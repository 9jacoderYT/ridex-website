// Path: lib/server-actions/company/getRiderPerformance.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function getRiderPerformance(riderDbId) {
  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get("company_session")?.value;

    if (!companyId || !riderDbId) {
      return { success: false, error: "Missing parameters" };
    }

    // Base columns that definitely exist on the riders table
    const BASE_COLS =
      "id, name, email, phone, vehicle_type, plate_number, rider_photo_url, " +
      "profile_picture_url, is_active, status, created_at, average_rating, total_ratings";

    // Try fetching with optional columns first; fall back if any are missing
    let rider = null;
    for (const cols of [
      `${BASE_COLS}, wallet_balance, total_earned, rider_trust_score`,
      BASE_COLS,
    ]) {
      const { data, error } = await supabaseAdmin
        .from("riders")
        .select(cols)
        .eq("id", riderDbId)
        .eq("company_id", companyId)
        .single();

      if (!error) {
        rider = data;
        break;
      }
      // 42703 = column does not exist — try next set
      if (error.code !== "42703") {
        // Real error (not found, wrong company, etc.)
        return { success: false, error: "Rider not found or access denied" };
      }
    }

    if (!rider) {
      return { success: false, error: "Rider not found or access denied" };
    }

    // Commission % — lives in company_commission_settings, not on riders
    const { data: commissionRow } = await supabaseAdmin
      .from("company_commission_settings")
      .select("rider_percentage")
      .eq("company_id", companyId)
      .single();
    const commissionPct = commissionRow?.rider_percentage ?? null;

    // Order stats — all orders for this rider
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: allOrders } = await supabaseAdmin
      .from("orders")
      .select("id, status, amount_paid, distance_km, created_at, delivery_type, payment_type")
      .eq("rider_id", riderDbId)
      .order("created_at", { ascending: false });

    const orders = allOrders || [];
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const cancelledCount = orders.filter(o => o.status === "cancelled").length;
    const recent30 = orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);

    const totalEarned = deliveredOrders.reduce((s, o) => s + Number(o.amount_paid || 0), 0);
    const avgDistance =
      deliveredOrders.length > 0
        ? deliveredOrders.reduce((s, o) => s + Number(o.distance_km || 0), 0) / deliveredOrders.length
        : 0;

    // Recent delivery history (last 20)
    const recentHistory = orders.slice(0, 20);

    // Ratings — rider_id in delivery_ratings is the rider's text riderId (same as riders.id UUID)
    const { data: ratings } = await supabaseAdmin
      .from("delivery_ratings")
      .select("rating, comment, created_at")
      .eq("rider_id", riderDbId)
      .order("created_at", { ascending: false })
      .limit(20);

    const ratingsList = ratings || [];
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of ratingsList) {
      if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating]++;
    }

    // COD summary — rider_id in cod_ledger is the same UUID
    const { data: codLedger } = await supabaseAdmin
      .from("rider_cod_ledger")
      .select("amount_collected, rider_share, company_share, platform_share, remitted, created_at")
      .eq("rider_id", riderDbId)
      .order("created_at", { ascending: false })
      .limit(50);

    const codEntries = codLedger || [];

    return {
      success: true,
      rider: { ...rider, commissionPct },
      stats: {
        totalOrders: orders.length,
        deliveredOrders: deliveredOrders.length,
        cancelledOrders: cancelledCount,
        activeOrders: orders.filter(o =>
          ["accepted", "picked_up", "in_transit"].includes(o.status)
        ).length,
        completionRate:
          orders.length > 0
            ? Math.round((deliveredOrders.length / orders.length) * 100)
            : 0,
        last30Days: {
          total: recent30.length,
          delivered: recent30.filter(o => o.status === "delivered").length,
        },
        totalEarned,
        avgDistance: Math.round(avgDistance * 10) / 10,
      },
      recentHistory,
      ratingsList,
      ratingCounts,
      cod: {
        totalCollected: codEntries.reduce((s, e) => s + Number(e.amount_collected || 0), 0),
        riderShare: codEntries.reduce((s, e) => s + Number(e.rider_share || 0), 0),
        companyShare: codEntries.reduce((s, e) => s + Number(e.company_share || 0), 0),
        totalEntries: codEntries.length,
        remittedCount: codEntries.filter(e => e.remitted).length,
      },
    };
  } catch (error) {
    console.error("getRiderPerformance error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
