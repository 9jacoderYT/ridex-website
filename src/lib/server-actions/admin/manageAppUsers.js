"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getSession } from "@/lib/utils/session";

async function verifyAdminSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// ─── App Users List ───────────────────────────────────────────────────────────

/**
 * Paginated list of all app users (customers).
 */
export async function getAppUsers({ page = 1, limit = 20, search = "", role = "all" } = {}) {
  try {
    await verifyAdminSession();

    // Use * to avoid breaking if optional migration columns don't exist yet
    let query = supabaseAdmin
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search.trim()) {
      query = query.or(
        `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%`
      );
    }

    if (role !== "all") {
      query = query.eq("role", role);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─── App User Detail ──────────────────────────────────────────────────────────

/**
 * Full profile for one app user including total order stats.
 */
export async function getAppUserDetail(userId) {
  try {
    await verifyAdminSession();

    const [userResult, ordersResult] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("user_id", userId),
    ]);

    if (userResult.error) throw userResult.error;

    const orders = ordersResult.data ?? [];
    const total = orders.length;
    const completed = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const inProgress = total - completed - cancelled;

    return {
      success: true,
      data: {
        ...userResult.data,
        order_stats: { total, completed, cancelled, in_progress: Math.max(0, inProgress) },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─── User Order History ───────────────────────────────────────────────────────

/**
 * Paginated order history for one user.
 * Uses select("*") to avoid failures when optional migration columns don't exist.
 */
export async function getUserOrderHistory(userId, { page = 1, limit = 15 } = {}) {
  try {
    await verifyAdminSession();

    const { data, error, count } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─── User Ratings ─────────────────────────────────────────────────────────────

/**
 * Ratings the user gave to riders (delivery_ratings where user_id = userId).
 */
export async function getUserRatingsGiven(userId) {
  try {
    await verifyAdminSession();

    const { data, error } = await supabaseAdmin
      .from("delivery_ratings")
      .select("id, order_id, rider_id, rating, comment, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Business ratings received by this user from riders (business_ratings where business_user_id = userId).
 * Only relevant for business accounts.
 */
export async function getUserBusinessRatings(userId) {
  try {
    await verifyAdminSession();

    const { data, error } = await supabaseAdmin
      .from("business_ratings")
      .select("id, order_id, rider_id, rating, comment, created_at")
      .eq("business_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
