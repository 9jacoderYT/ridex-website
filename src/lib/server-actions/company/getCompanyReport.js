// Path: lib/server-actions/company/getCompanyReport.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { validateCompanySession } from "./validateSession";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export async function getCompanyReport({ startMonth, startYear, endMonth, endYear }) {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    // Build date range boundaries
    const start = new Date(startYear, startMonth - 1, 1);
    const end = new Date(endYear, endMonth, 0, 23, 59, 59, 999);

    // Step 1: Get all rider IDs for this company
    const { data: riders, error: ridersError } = await supabaseAdmin
      .from("riders")
      .select("id, name, average_rating, total_ratings")
      .eq("company_id", companyId);

    if (ridersError) {
      console.error("Error fetching riders:", ridersError);
      return { success: false, error: "Failed to fetch company riders" };
    }

    // Guard: no riders registered
    if (!riders || riders.length === 0) {
      return {
        success: true,
        report: buildZeroReport({ startMonth, startYear, endMonth, endYear }),
      };
    }

    const riderIds = riders.map((r) => r.id);
    const riderMap = Object.fromEntries(riders.map((r) => [r.id, r.name]));

    // Step 2: Parallel queries
    const [ordersRes, ratingsRes, codLedgerRes, withdrawalsRes] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select(
          "id, status, payment_type, cod_amount, created_at, delivered_at, rider_id, tracking_number, pickup_address, dropoff_address"
        )
        .in("rider_id", riderIds)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("delivery_ratings")
        .select("order_id, rider_id, rating, created_at")
        .in("rider_id", riderIds)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString()),

      supabaseAdmin
        .from("rider_cod_ledger")
        .select("order_id, rider_id, amount_collected, company_share, rider_share, platform_share, remitted, created_at")
        .in("rider_id", riderIds)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString()),

      supabaseAdmin
        .from("withdrawal_requests")
        .select("id, amount, status, created_at")
        .eq("company_id", companyId)
        .eq("requester_type", "company")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false }),
    ]);

    if (ordersRes.error) {
      console.error("Orders query error:", ordersRes.error);
      return { success: false, error: "Failed to fetch orders for report" };
    }

    const orders = ordersRes.data ?? [];
    const ratings = ratingsRes.data ?? [];
    const codLedger = codLedgerRes.data ?? [];
    const withdrawals = withdrawalsRes.data ?? [];

    // Step 3: Aggregate
    const completed = orders.filter((o) => o.status === "delivered");
    const cancelled = orders.filter((o) => o.status === "cancelled");
    const completionRate =
      orders.length > 0
        ? ((completed.length / orders.length) * 100).toFixed(1)
        : "0.0";

    const codOrders = orders.filter((o) => o.payment_type === "pay_on_delivery" || o.payment_type === "cod");
    const prepaidOrders = orders.filter((o) => o.payment_type !== "pay_on_delivery" && o.payment_type !== "cod");
    const prepaidDelivered = prepaidOrders.filter((o) => o.status === "delivered");

    const codCollected = codLedger.reduce((s, l) => s + (l.amount_collected ?? 0), 0);
    const codCompanyShare = codLedger.reduce((s, l) => s + (l.company_share ?? 0), 0);
    // delivery_fee column doesn't exist on orders; use COD ledger for COD earnings.
    // For prepaid, count is tracked but monetary total comes from the company wallet.
    const prepaidTotal = prepaidDelivered.length; // count only — no fee column available

    const totalRatings = ratings.length;
    const avgRating =
      totalRatings > 0
        ? (ratings.reduce((s, r) => s + r.rating, 0) / totalRatings).toFixed(2)
        : null;

    // Top 5 riders by completed deliveries
    const riderCounts = {};
    completed.forEach((o) => {
      riderCounts[o.rider_id] = (riderCounts[o.rider_id] ?? 0) + 1;
    });
    const topRiders = Object.entries(riderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ name: riderMap[id] ?? "Unknown", count }));

    const withdrawalRequested = withdrawals.reduce((s, w) => s + (w.amount ?? 0), 0);
    const withdrawalCompleted = withdrawals
      .filter((w) => w.status === "completed")
      .reduce((s, w) => s + (w.amount ?? 0), 0);

    return {
      success: true,
      report: {
        period: { startMonth, startYear, endMonth, endYear },
        orders: {
          total: orders.length,
          completed: completed.length,
          cancelled: cancelled.length,
          completionRate,
        },
        payments: {
          codCount: codOrders.length,
          prepaidCount: prepaidOrders.length,
          codCollected,
          codCompanyShare,
          prepaidDelivered: prepaidTotal, // count of completed prepaid orders
        },
        ratings: {
          average: avgRating,
          total: totalRatings,
        },
        topRiders,
        withdrawals: {
          count: withdrawals.length,
          requested: withdrawalRequested,
          completed: withdrawalCompleted,
        },
        allOrders: orders.map((o) => ({
          tracking_number: o.tracking_number,
          status: o.status,
          payment_type: o.payment_type,
          cod_amount: o.cod_amount,
          pickup_address: o.pickup_address,
          dropoff_address: o.dropoff_address,
          created_at: o.created_at,
          delivered_at: o.delivered_at,
          rider_name: riderMap[o.rider_id] ?? "Unknown",
        })),
      },
    };
  } catch (err) {
    console.error("Error in getCompanyReport:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

function buildZeroReport({ startMonth, startYear, endMonth, endYear }) {
  return {
    period: { startMonth, startYear, endMonth, endYear },
    orders: { total: 0, completed: 0, cancelled: 0, completionRate: "0.0" },
    payments: { codCount: 0, prepaidCount: 0, codCollected: 0, codCompanyShare: 0, prepaidDelivered: 0 },
    ratings: { average: null, total: 0 },
    topRiders: [],
    withdrawals: { count: 0, requested: 0, completed: 0 },
    allOrders: [],
  };
}
