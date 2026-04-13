"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getSession } from "@/lib/utils/session";
import { redirect } from "next/navigation";

async function verifyAdminSession() {
  const session = await getSession();
  if (!session) redirect("/loginadminusers");
  return session;
}

// ─── All Orders ───────────────────────────────────────────────────────────────

/**
 * Paginated list of all orders with optional filters.
 */
export async function getAllOrders({
  page = 1,
  limit = 25,
  search = "",
  status = "all",
  paymentType = "all",
  dateFrom = "",
  dateTo = "",
} = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search.trim()) {
      query = query.or(
        `order_id.ilike.%${search.trim()}%,tracking_number.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%,rider_id.ilike.%${search.trim()}%,recipient_name.ilike.%${search.trim()}%,pickup_address.ilike.%${search.trim()}%,dropoff_address.ilike.%${search.trim()}%`
      );
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (paymentType !== "all") {
      query = query.eq("payment_type", paymentType);
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      // Add 1 day to dateTo to include the entire end day
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt("created_at", endDate.toISOString());
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Order Detail ─────────────────────────────────────────────────────────────

/**
 * Full order details including user and rider info.
 */
export async function getOrderDetail(orderId) {
  try {
    await verifyAdminSession();

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) throw error;

    // Fetch user: orders.user_id stores auth UUID, match against users.auth_user_id
    const userResult = order.user_id
      ? await supabaseAdmin
          .from("users")
          .select("user_id, full_name, email, phone, role")
          .eq("auth_user_id", order.user_id)
          .maybeSingle()
      : { data: null };

    // Fetch rider: try riders.id (UUID PK, used by rider app) first,
    // then fall back to riders.auth_user_id (used in some edge-function assignments)
    let riderResult = { data: null };
    if (order.rider_id) {
      const byId = await supabaseAdmin
        .from("riders")
        .select("id, name, email, phone, vehicle_type, plate_number, average_rating")
        .eq("id", order.rider_id)
        .maybeSingle();
      if (byId.data) {
        riderResult = byId;
      } else {
        const byAuth = await supabaseAdmin
          .from("riders")
          .select("id, name, email, phone, vehicle_type, plate_number, average_rating")
          .eq("auth_user_id", order.rider_id)
          .maybeSingle();
        riderResult = byAuth;
      }
    }

    return {
      success: true,
      data: {
        ...order,
        user: userResult.data ?? null,
        rider: riderResult.data ?? null,
      },
    };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Orders by Status (for sub-pages) ────────────────────────────────────────

/**
 * Failed/cancelled orders with pagination.
 */
export async function getFailedOrders({ page = 1, limit = 25, search = "" } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .in("status", ["cancelled", "failed"])
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search.trim()) {
      query = query.or(
        `order_id.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%,tracking_number.ilike.%${search.trim()}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

/**
 * Search order by tracking number.
 */
export async function getOrderByTracking(trackingNumber) {
  try {
    await verifyAdminSession();

    if (!trackingNumber?.trim()) {
      return { success: false, error: "Tracking number required" };
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .ilike("tracking_number", trackingNumber.trim())
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, error: "Order not found" };

    return { success: true, data };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

/**
 * Delivered orders (for POD verification view).
 */
export async function getDeliveredOrders({ page = 1, limit = 25, search = "" } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .eq("status", "delivered")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search.trim()) {
      query = query.or(
        `order_id.ilike.%${search.trim()}%,user_id.ilike.%${search.trim()}%,tracking_number.ilike.%${search.trim()}%,rider_id.ilike.%${search.trim()}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Order Stats ──────────────────────────────────────────────────────────────

/**
 * Summary stats for the orders dashboard header.
 */
export async function getOrderStats() {
  try {
    await verifyAdminSession();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("status, payment_type, amount_paid, cod_amount");

    if (error) throw error;

    const orders = data ?? [];
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const active = orders.filter((o) =>
      ["accepted", "picked_up", "in_transit"].includes(o.status)
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const codOrders = orders.filter((o) => o.payment_type === "pay_on_delivery").length;

    return {
      success: true,
      stats: { total, pending, active, delivered, cancelled, codOrders },
    };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}
