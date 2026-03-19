"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

const STATUS_ORDER = ["pending", "assigned", "picked_up", "in_transit", "delivered"];

/**
 * Public order tracking — no auth required.
 * Only returns non-sensitive fields safe for public display.
 */
export async function trackOrder(trackingNumber) {
  try {
    const tn = (trackingNumber ?? "").trim().toUpperCase();
    if (!tn) return { success: false, error: "Please enter a tracking number." };

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "tracking_number, status, pickup_address, dropoff_address, recipient_name, " +
        "payment_type, delivery_type, distance_km, is_bulk_order, " +
        "rider_id, created_at, updated_at"
      )
      .ilike("tracking_number", tn)
      .maybeSingle();

    if (error) throw error;
    if (!order) return { success: false, error: "No order found with that tracking number." };

    // Fetch safe rider info (name + vehicle only) if assigned
    let rider = null;
    if (order.rider_id) {
      const { data: riderData } = await supabaseAdmin
        .from("riders")
        .select("full_name, vehicle_type")
        .eq("id", order.rider_id)
        .maybeSingle();

      if (riderData) {
        // Only expose first name for privacy
        const firstName = (riderData.full_name ?? "").split(" ")[0] || "Rider";
        rider = { name: firstName, vehicle_type: riderData.vehicle_type };
      }
    }

    // Determine progress step index
    const stepIndex = order.status === "cancelled"
      ? -1
      : STATUS_ORDER.indexOf(order.status);

    return {
      success: true,
      order: {
        tracking_number: order.tracking_number,
        status: order.status,
        step_index: stepIndex,
        pickup_address: order.pickup_address,
        dropoff_address: order.dropoff_address,
        recipient_name: order.recipient_name,
        payment_type: order.payment_type,
        delivery_type: order.delivery_type,
        distance_km: order.distance_km,
        is_bulk_order: order.is_bulk_order,
        created_at: order.created_at,
        updated_at: order.updated_at,
        rider,
      },
    };
  } catch (err) {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
