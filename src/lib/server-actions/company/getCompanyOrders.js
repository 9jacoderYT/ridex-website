// Path: lib/server-actions/company/getCompanyOrders.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function getCompanyOrders(companyId, options = {}) {
  try {
    if (!companyId) {
      return {
        success: false,
        error: "Company ID is required",
      };
    }

    const {
      status = "all", // 'all', 'active', 'completed', 'cancelled'
      page = 1,
      limit = 10,
      riderId = null, // optional: filter to a single rider
    } = options;

    // Step 1: Get all rider IDs for this company
    const { data: riders, error: ridersError } = await supabaseAdmin
      .from("riders")
      .select("id, name")
      .eq("company_id", companyId);

    if (ridersError) {
      console.error("Error fetching riders:", ridersError);
      return {
        success: false,
        error: "Failed to fetch riders",
      };
    }

    // If no riders, return empty orders
    if (!riders || riders.length === 0) {
      return {
        success: true,
        orders: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // Create a map of rider IDs to names for later use
    const riderMap = {};
    riders.forEach((rider) => {
      riderMap[rider.id] = rider.name;
    });

    const riderIds = riders.map((rider) => rider.id);

    // If filtering by a specific rider, validate they belong to this company
    const filteredRiderIds = riderId ? riderIds.filter((id) => id === riderId) : riderIds;
    if (riderId && filteredRiderIds.length === 0) {
      return { success: false, error: "Rider not found in your company" };
    }

    // Step 2: Build the query based on status filter
    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .in("rider_id", filteredRiderIds)
      .not("rider_id", "is", null); // Only orders that have been accepted by riders

    // Apply status filter
    if (status === "active") {
      query = query.in("status", ["accepted", "picked_up", "in_transit"]);
    } else if (status === "completed") {
      query = query.eq("status", "delivered");
    } else if (status === "cancelled") {
      query = query.eq("status", "cancelled");
    }
    // 'all' doesn't need additional filtering

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return {
        success: false,
        error: "Failed to fetch orders",
      };
    }

    // Step 3: Attach rider names to orders
    const ordersWithRiderNames = (orders || []).map((order) => ({
      ...order,
      rider_name: riderMap[order.rider_id] || "Unknown Rider",
    }));

    return {
      success: true,
      orders: ordersWithRiderNames,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    console.error("Error in getCompanyOrders:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
