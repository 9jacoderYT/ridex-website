"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getSession } from "@/lib/utils/session";
import { redirect } from "next/navigation";
import { sendNotificationEmail } from "@/lib/utils/sendNotificationEmail";

async function verifyAdminSession() {
  const session = await getSession();
  if (!session) redirect("/loginadminusers");
  return session;
}

// ─── All Riders ───────────────────────────────────────────────────────────────

/**
 * Paginated list of all riders with optional filters.
 */
export async function getAllRiders({
  page = 1,
  limit = 25,
  search = "",
  status = "all",
  vehicleType = "all",
} = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("riders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%,plate_number.ilike.%${search.trim()}%`
      );
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (vehicleType !== "all") {
      query = query.eq("vehicle_type", vehicleType);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Rider Detail ─────────────────────────────────────────────────────────────

/**
 * Full rider profile including order statistics.
 */
export async function getRiderDetail(riderId) {
  try {
    await verifyAdminSession();

    const [riderResult, ordersResult, ratingsResult] = await Promise.all([
      supabaseAdmin.from("riders").select("*").eq("id", riderId).single(),
      supabaseAdmin.from("orders").select("id, status, amount_paid, created_at").eq("rider_id", riderId),
      supabaseAdmin
        .from("delivery_ratings")
        .select("rating, comment, created_at, order_id")
        .eq("rider_id", riderId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (riderResult.error) throw riderResult.error;

    // Fetch company info if rider belongs to one
    let company = null;
    if (riderResult.data?.company_id) {
      const companyRes = await supabaseAdmin
        .from("companies")
        .select("id, company_name, company_id, email, phone, is_active")
        .eq("id", riderResult.data.company_id)
        .maybeSingle();
      company = companyRes.data ?? null;
    }

    const orders = ordersResult.data ?? [];
    const total = orders.length;
    const completed = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const active = orders.filter((o) =>
      ["accepted", "picked_up", "in_transit"].includes(o.status)
    ).length;

    return {
      success: true,
      data: {
        ...riderResult.data,
        company,
        order_stats: { total, completed, cancelled, active },
        recent_ratings: ratingsResult.data ?? [],
      },
    };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Rider Orders ─────────────────────────────────────────────────────────────

/**
 * Paginated delivery history for a specific rider.
 */
export async function getRiderOrders(riderId, { page = 1, limit = 20 } = {}) {
  try {
    await verifyAdminSession();

    const { data, error, count } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .eq("rider_id", riderId)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Update Rider Status ──────────────────────────────────────────────────────

/**
 * Update a rider's status (active/inactive/suspended).
 */
export async function updateRiderStatus(riderId, status, adminNote = "") {
  try {
    await verifyAdminSession();

    if (!["active", "inactive", "suspended"].includes(status)) {
      throw new Error("Invalid status");
    }

    // Fetch rider email + name before updating
    const { data: rider } = await supabaseAdmin
      .from("riders")
      .select("name, email")
      .eq("id", riderId)
      .single();

    const { error } = await supabaseAdmin
      .from("riders")
      .update({ status, is_active: status === "active" })
      .eq("id", riderId);

    if (error) throw error;

    // Notify rider via email (fire-and-forget)
    if (rider?.email) {
      sendNotificationEmail("rider_status_change", rider.email, {
        name: rider.name,
        newStatus: status,
        note: adminNote || undefined,
      });
    }

    return { success: true };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Rider Stats ──────────────────────────────────────────────────────────────

/**
 * Summary stats for the riders dashboard header.
 */
export async function getRiderStats() {
  try {
    await verifyAdminSession();

    const { data, error } = await supabaseAdmin
      .from("riders")
      .select("status, vehicle_type, average_rating");

    if (error) throw error;

    const riders = data ?? [];
    const total = riders.length;
    const active = riders.filter((r) => r.status === "active").length;
    const suspended = riders.filter((r) => r.status === "suspended").length;
    const inactive = riders.filter((r) => r.status === "inactive").length;
    const bikes = riders.filter((r) => r.vehicle_type === "bike").length;
    const cars = riders.filter((r) => r.vehicle_type === "car").length;

    const ratingsWithValues = riders.filter((r) => r.average_rating > 0);
    const avgRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, r) => sum + (r.average_rating || 0), 0) /
          ratingsWithValues.length
        : 0;

    return {
      success: true,
      stats: { total, active, suspended, inactive, bikes, cars, avgRating },
    };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}
