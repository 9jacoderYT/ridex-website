"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

// Fetch all referrals with referrer and referred user details
export async function getAllReferrals() {
  try {
    const { data: referrals, error } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!referrals || referrals.length === 0) {
      return { success: true, referrals: [] };
    }

    // Collect all unique user IDs
    const userIds = [
      ...new Set([
        ...referrals.map((r) => r.referrer_user_id),
        ...referrals.map((r) => r.referred_user_id),
      ]),
    ];

    // Fetch user details
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("user_id, full_name, email, phone_number, created_at")
      .in("user_id", userIds);

    const userMap = {};
    if (users) {
      users.forEach((u) => {
        userMap[u.user_id] = u;
      });
    }

    // Enrich referrals with user data
    const enrichedReferrals = referrals.map((r) => ({
      id: r.id,
      referrer_user_id: r.referrer_user_id,
      referred_user_id: r.referred_user_id,
      referrer_name: userMap[r.referrer_user_id]?.full_name || "Unknown",
      referrer_email: userMap[r.referrer_user_id]?.email || "",
      referred_name: userMap[r.referred_user_id]?.full_name || "Unknown",
      referred_email: userMap[r.referred_user_id]?.email || "",
      referrer_reward: r.referrer_reward,
      referred_reward: r.referred_reward,
      created_at: r.created_at,
    }));

    return { success: true, referrals: enrichedReferrals };
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return { success: false, error: error.message };
  }
}

// Fetch referral settings
export async function getReferralSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("referral_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;

    return { success: true, settings: data };
  } catch (error) {
    console.error("Error fetching referral settings:", error);
    return { success: false, error: error.message };
  }
}

// Update referral settings (reward amounts and active status)
export async function updateReferralSettings({
  referrerReward,
  referredReward,
  isActive,
}) {
  try {
    // Get the single settings row
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("referral_settings")
      .select("id")
      .limit(1)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabaseAdmin
      .from("referral_settings")
      .update({
        referrer_reward_amount: referrerReward,
        referred_reward_amount: referredReward,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, settings: data };
  } catch (error) {
    console.error("Error updating referral settings:", error);
    return { success: false, error: error.message };
  }
}

// Get aggregated referral stats for admin dashboard
export async function getReferralStats() {
  try {
    // Total referrals
    const { count: totalReferrals, error: countError } = await supabaseAdmin
      .from("referrals")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // All referral records for calculations
    const { data: allReferrals, error: refError } = await supabaseAdmin
      .from("referrals")
      .select("referrer_reward, referred_reward, created_at, referrer_user_id");

    if (refError) throw refError;

    // Total rewards paid out
    const totalReferrerRewards = (allReferrals || []).reduce(
      (sum, r) => sum + (parseFloat(r.referrer_reward) || 0),
      0,
    );
    const totalReferredRewards = (allReferrals || []).reduce(
      (sum, r) => sum + (parseFloat(r.referred_reward) || 0),
      0,
    );
    const totalRewardsPaid = totalReferrerRewards + totalReferredRewards;

    // Unique referrers
    const uniqueReferrers = new Set(
      (allReferrals || []).map((r) => r.referrer_user_id),
    ).size;

    // Referrals this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthReferrals = (allReferrals || []).filter(
      (r) => new Date(r.created_at) >= startOfMonth,
    ).length;

    // Top referrers
    const referrerCounts = {};
    (allReferrals || []).forEach((r) => {
      referrerCounts[r.referrer_user_id] =
        (referrerCounts[r.referrer_user_id] || 0) + 1;
    });

    const topReferrerIds = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    let topReferrers = [];
    if (topReferrerIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("user_id, full_name, email")
        .in("user_id", topReferrerIds);

      const userMap = {};
      if (users) {
        users.forEach((u) => {
          userMap[u.user_id] = u;
        });
      }

      topReferrers = topReferrerIds.map((id) => ({
        user_id: id,
        full_name: userMap[id]?.full_name || "Unknown",
        email: userMap[id]?.email || "",
        referral_count: referrerCounts[id],
        total_earned: (allReferrals || [])
          .filter((r) => r.referrer_user_id === id)
          .reduce((sum, r) => sum + (parseFloat(r.referrer_reward) || 0), 0),
      }));
    }

    // Monthly breakdown (last 6 months)
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const monthReferrals = (allReferrals || []).filter((r) => {
        const d = new Date(r.created_at);
        return d >= monthDate && d <= monthEnd;
      });

      monthlyBreakdown.push({
        month: monthDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        count: monthReferrals.length,
        rewards: monthReferrals.reduce(
          (sum, r) =>
            sum +
            (parseFloat(r.referrer_reward) || 0) +
            (parseFloat(r.referred_reward) || 0),
          0,
        ),
      });
    }

    return {
      success: true,
      stats: {
        totalReferrals: totalReferrals || 0,
        totalRewardsPaid,
        uniqueReferrers,
        thisMonthReferrals,
        topReferrers,
        monthlyBreakdown,
      },
    };
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return { success: false, error: error.message };
  }
}
