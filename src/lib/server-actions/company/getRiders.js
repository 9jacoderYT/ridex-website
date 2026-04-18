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

    const riderList = riders || [];

    // Fetch per-rider commission overrides for this company in one query
    const riderIds = riderList.map((r) => r.id);
    let overrideMap = {};
    if (riderIds.length > 0) {
      const { data: overrides } = await supabaseAdmin
        .from("rider_commission_overrides")
        .select("rider_id, rider_percentage")
        .in("rider_id", riderIds);

      if (overrides) {
        overrideMap = Object.fromEntries(
          overrides.map((o) => [o.rider_id, parseFloat(o.rider_percentage)])
        );
      }
    }

    // Fetch company-wide default
    const { data: companyComm } = await supabaseAdmin
      .from("company_commission_settings")
      .select("rider_percentage")
      .eq("company_id", companyId)
      .maybeSingle();
    const companyDefaultPct = companyComm?.rider_percentage != null
      ? parseFloat(companyComm.rider_percentage)
      : 75;

    const enrichedRiders = riderList.map((r) => ({
      ...r,
      hasCommissionOverride: r.id in overrideMap,
      commissionPct: r.id in overrideMap ? overrideMap[r.id] : companyDefaultPct,
      companyDefaultPct,
    }));

    return {
      success: true,
      riders: enrichedRiders,
    };
  } catch (error) {
    console.error("Error in getRiders:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
