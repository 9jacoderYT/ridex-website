"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function getDashboardStats() {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Run all counts in parallel
    const [
      totalOrdersRes,
      thisMonthOrdersRes,
      lastMonthOrdersRes,
      totalUsersRes,
      thisMonthUsersRes,
      lastMonthUsersRes,
      activeRidersRes,
      thisMonthRidersRes,
      lastMonthRidersRes,
      recentOrdersRes,
      recentUsersRes,
      recentRidersRes,
      recentWithdrawalsRes,
    ] = await Promise.all([
      // Total orders (all time)
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
      // Orders created this month
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).gte("created_at", startOfThisMonth),
      // Orders created last month
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
      // Total users
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      // Users joined this month
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).gte("created_at", startOfThisMonth),
      // Users joined last month
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
      // Active riders (is_active = true)
      supabaseAdmin.from("riders").select("*", { count: "exact", head: true }).eq("is_active", true),
      // Riders approved this month
      supabaseAdmin.from("riders").select("*", { count: "exact", head: true }).gte("created_at", startOfThisMonth),
      // Riders approved last month
      supabaseAdmin.from("riders").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
      // Recent orders for activity feed
      supabaseAdmin.from("orders").select("order_id, tracking_number, status, created_at").order("created_at", { ascending: false }).limit(5),
      // Recent user registrations
      supabaseAdmin.from("users").select("full_name, created_at").order("created_at", { ascending: false }).limit(3),
      // Recent rider approvals
      supabaseAdmin.from("riders").select("full_name, created_at, is_active").order("created_at", { ascending: false }).limit(3),
      // Recent withdrawals
      supabaseAdmin.from("withdrawal_requests").select("amount, status, created_at").order("created_at", { ascending: false }).limit(3),
    ]);

    // Helper: calculate % change
    const pctChange = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalOrders = totalOrdersRes.count ?? 0;
    const thisMonthOrders = thisMonthOrdersRes.count ?? 0;
    const lastMonthOrders = lastMonthOrdersRes.count ?? 0;
    const orderChange = pctChange(thisMonthOrders, lastMonthOrders);

    const totalUsers = totalUsersRes.count ?? 0;
    const thisMonthUsers = thisMonthUsersRes.count ?? 0;
    const lastMonthUsers = lastMonthUsersRes.count ?? 0;
    const userChange = pctChange(thisMonthUsers, lastMonthUsers);

    const activeRiders = activeRidersRes.count ?? 0;
    const thisMonthRiders = thisMonthRidersRes.count ?? 0;
    const lastMonthRiders = lastMonthRidersRes.count ?? 0;
    const riderChange = pctChange(thisMonthRiders, lastMonthRiders);

    // Build activity feed from real events
    const activityItems = [];

    // Recent orders
    for (const order of recentOrdersRes.data ?? []) {
      activityItems.push({
        action: `Order ${order.tracking_number || order.order_id} — ${order.status}`,
        time: order.created_at,
        type: "order",
      });
    }
    // Recent user registrations
    for (const user of recentUsersRes.data ?? []) {
      activityItems.push({
        action: `New user registered${user.full_name ? `: ${user.full_name}` : ""}`,
        time: user.created_at,
        type: "user",
      });
    }
    // Recent rider approvals
    for (const rider of recentRidersRes.data ?? []) {
      activityItems.push({
        action: `Rider onboarded${rider.full_name ? `: ${rider.full_name}` : ""}`,
        time: rider.created_at,
        type: "rider",
      });
    }
    // Recent withdrawals
    for (const w of recentWithdrawalsRes.data ?? []) {
      activityItems.push({
        action: `Withdrawal ₦${Number(w.amount).toLocaleString()} — ${w.status}`,
        time: w.created_at,
        type: "payment",
      });
    }

    // Sort by most recent
    activityItems.sort((a, b) => new Date(b.time) - new Date(a.time));

    return {
      success: true,
      stats: {
        totalOrders,
        orderChange,
        totalUsers,
        userChange,
        activeRiders,
        riderChange,
      },
      activity: activityItems.slice(0, 8),
    };
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return { success: false, stats: null, activity: [] };
  }
}
