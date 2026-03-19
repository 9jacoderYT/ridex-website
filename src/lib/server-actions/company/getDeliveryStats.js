// Path: lib/server-actions/company/getDeliveryStats.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function getDeliveryStats(companyId) {
  try {
    if (!companyId) {
      return {
        success: false,
        error: "Company ID is required",
      };
    }

    // Step 1: Get all rider IDs for this company
    const { data: riders, error: ridersError } = await supabaseAdmin
      .from("riders")
      .select("id")
      .eq("company_id", companyId);

    if (ridersError) {
      console.error("Error fetching riders:", ridersError);
      return {
        success: false,
        error: "Failed to fetch riders",
      };
    }

    // If no riders, return zero stats
    if (!riders || riders.length === 0) {
      return {
        success: true,
        stats: {
          totalDeliveries: 0,
          activeRides: 0,
          completedToday: 0,
        },
      };
    }

    // Extract rider IDs
    const riderIds = riders.map((rider) => rider.id);

    // Step 2: Get total completed deliveries (status = 'delivered')
    const { count: totalDeliveries, error: totalError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("rider_id", riderIds)
      .eq("status", "delivered");

    if (totalError) {
      console.error("Error fetching total deliveries:", totalError);
      return {
        success: false,
        error: "Failed to fetch delivery statistics",
      };
    }

    // Step 3: Get active rides (status in: accepted, picked_up, in_transit)
    const { count: activeRides, error: activeError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("rider_id", riderIds)
      .in("status", ["accepted", "picked_up", "in_transit"]);

    if (activeError) {
      console.error("Error fetching active rides:", activeError);
      return {
        success: false,
        error: "Failed to fetch active rides",
      };
    }

    // Step 4: Get completed today (delivered_at is today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: completedToday, error: todayError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("rider_id", riderIds)
      .eq("status", "delivered")
      .gte("delivered_at", todayStart.toISOString())
      .lte("delivered_at", todayEnd.toISOString());

    if (todayError) {
      console.error("Error fetching today's deliveries:", todayError);
      return {
        success: false,
        error: "Failed to fetch today's deliveries",
      };
    }

    return {
      success: true,
      stats: {
        totalDeliveries: totalDeliveries || 0,
        activeRides: activeRides || 0,
        completedToday: completedToday || 0,
      },
    };
  } catch (error) {
    console.error("Error in getDeliveryStats:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
