// Path: lib/server-actions/reports/getReportData.js
"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
);

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value;
  if (!token) redirect("/loginadminusers");
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    redirect("/loginadminusers");
  }
}

export async function getReportData({ startDate, endDate }) {
  try {
    await verifyAdminSession();

    const [ordersRes, usersRes, ridersNewRes, withdrawalsRes, platformRes] =
      await Promise.all([
        // amount_paid is the column for what was paid (confirmed from orderUtils.ts insert payload)
        // payment_type values: "prepaid" | "pay_on_delivery"  (NOT "cod")
        // status values: pending | accepted | picked_up | in_transit | delivered | cancelled
        supabaseAdmin
          .from("orders")
          .select("id, status, amount_paid, payment_type, cod_amount, rider_id")
          .gte("created_at", startDate)
          .lte("created_at", endDate),

        supabaseAdmin
          .from("users")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", startDate)
          .lte("created_at", endDate),

        supabaseAdmin
          .from("riders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate)
          .lte("created_at", endDate),

        supabaseAdmin
          .from("withdrawal_requests")
          .select("amount, status, requester_type")
          .gte("created_at", startDate)
          .lte("created_at", endDate),

        supabaseAdmin
          .from("platform_settings")
          .select("platform_fee_percentage")
          .eq("id", 1)
          .single(),
      ]);

    // ── Orders ────────────────────────────────────────────────────────────────
    const orders = ordersRes.data || [];

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const deliveredOrders = orders.filter((o) => o.status === "delivered");

    // amount_paid = total fee the user paid for the delivery
    const grossRevenue = deliveredOrders.reduce(
      (sum, o) => sum + Number(o.amount_paid || 0),
      0,
    );

    const platformFeePct = Number(
      platformRes.data?.platform_fee_percentage || 20,
    );
    const platformRevenue = grossRevenue * (platformFeePct / 100);

    // COD orders use payment_type = "pay_on_delivery"
    const codOrders = orders.filter((o) => o.payment_type === "pay_on_delivery");
    const codValue = codOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.cod_amount || 0), 0);

    // ── Top riders by deliveries in period ────────────────────────────────────
    const riderDeliveryCounts = {};
    deliveredOrders.forEach((o) => {
      if (o.rider_id) {
        riderDeliveryCounts[o.rider_id] =
          (riderDeliveryCounts[o.rider_id] || 0) + 1;
      }
    });

    const topRiderIds = Object.entries(riderDeliveryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    let topRiders = [];
    if (topRiderIds.length > 0) {
      const { data: riderData } = await supabaseAdmin
        .from("riders")
        .select("id, name, phone, total_earned")
        .in("id", topRiderIds);
      topRiders = (riderData || [])
        .map((r) => ({ ...r, deliveries: riderDeliveryCounts[r.id] || 0 }))
        .sort((a, b) => b.deliveries - a.deliveries);
    }

    // ── Withdrawals ───────────────────────────────────────────────────────────
    const withdrawals = withdrawalsRes.data || [];
    const completedWithdrawals = withdrawals.filter(
      (w) => w.status === "completed",
    );
    const totalWithdrawn = completedWithdrawals.reduce(
      (sum, w) => sum + Number(w.amount || 0),
      0,
    );
    const riderWithdrawn = completedWithdrawals
      .filter((w) => w.requester_type === "rider")
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const companyWithdrawn = completedWithdrawals
      .filter((w) => w.requester_type === "company")
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const pendingWithdrawals = withdrawals
      .filter((w) => w.status === "pending")
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);

    return {
      success: true,
      data: {
        period: { startDate, endDate },
        orders: {
          total: orders.length,
          delivered: statusCounts.delivered || 0,
          cancelled: statusCounts.cancelled || 0,
          pending: statusCounts.pending || 0,
          accepted: statusCounts.accepted || 0,
          picked_up: statusCounts.picked_up || 0,
          in_transit: statusCounts.in_transit || 0,
          cod_count: codOrders.length,
          prepaid_count: orders.filter((o) => o.payment_type === "prepaid").length,
        },
        revenue: {
          gross: grossRevenue,
          platform: platformRevenue,
          platform_fee_pct: platformFeePct,
          rider_share: grossRevenue - platformRevenue,
          cod_value: codValue,
        },
        users: {
          new_count: usersRes.count || 0,
        },
        riders: {
          new_count: ridersNewRes.count || 0,
          top_performers: topRiders,
        },
        withdrawals: {
          total_completed: totalWithdrawn,
          rider_withdrawn: riderWithdrawn,
          company_withdrawn: companyWithdrawn,
          pending_amount: pendingWithdrawals,
          total_requests: withdrawals.length,
        },
      },
    };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}
