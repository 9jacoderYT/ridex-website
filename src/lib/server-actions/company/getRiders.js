// Path: lib/server-actions/company/getRiders.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function getRiders(companyId) {
  try {
    if (!companyId) {
      return {
        success: false,
        error: "Company ID is required",
      };
    }

    const BASE_FIELDS = `
      id,
      name,
      email,
      phone,
      vehicle_type,
      plate_number,
      driver_license_number,
      guarantor_name,
      guarantor_phone,
      vehicle_photo_url,
      rider_photo_url,
      plate_photo_url,
      is_active,
      status,
      created_at
    `;

    // Try with rating fields first; fall back to base fields if columns don't exist yet
    let { data: riders, error } = await supabaseAdmin
      .from("riders")
      .select(`${BASE_FIELDS}, average_rating, total_ratings`)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error?.code === "42703") {
      // Column doesn't exist yet — retry without rating fields
      const fallback = await supabaseAdmin
        .from("riders")
        .select(BASE_FIELDS)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (fallback.error) {
        console.error("Error fetching riders:", fallback.error);
        return { success: false, error: "Failed to fetch riders" };
      }
      riders = fallback.data;
      error = null;
    } else if (error) {
      console.error("Error fetching riders:", error);
      return { success: false, error: "Failed to fetch riders" };
    }

    return {
      success: true,
      riders: riders || [],
    };
  } catch (error) {
    console.error("Error in getRiders:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
