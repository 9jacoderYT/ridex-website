// Path: lib/server-actions/pricing/managePricing.js
"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
);

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

async function requireSuperAdmin(payload) {
  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("role_name")
    .eq("username", payload.username)
    .single();
  if (admin?.role_name !== "Super Admin")
    throw new Error("Only Super Admin can change pricing settings");
  return admin;
}

// ── Get full pricing config ────────────────────────────────────────────────────

export async function getPricingSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select(
        "base_fee, rate_per_km, min_delivery_fee, " +
        "weight_mult_light, weight_mult_medium, weight_mult_heavy, " +
        "type_mult_normal, type_mult_priority, type_mult_high_value, " +
        "area_difficulty_enabled, area_max_multiplier, updated_at, updated_by"
      )
      .eq("id", 1)
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, pricing: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Update pricing config ──────────────────────────────────────────────────────

export async function updatePricingSettings({
  baseFee,
  ratePerKm,
  minDeliveryFee,
  weightMultLight,
  weightMultMedium,
  weightMultHeavy,
  typeMultNormal,
  typeMultPriority,
  typeMultHighValue,
  areaDifficultyEnabled,
  areaMaxMultiplier,
}) {
  try {
    // Basic validation
    if (baseFee < 0 || ratePerKm < 0 || minDeliveryFee < 0)
      return { success: false, error: "Fee values cannot be negative" };
    if (weightMultLight < 1 || weightMultMedium < 1 || weightMultHeavy < 1)
      return { success: false, error: "Weight multipliers must be >= 1.0" };
    if (typeMultNormal < 1 || typeMultPriority < 1 || typeMultHighValue < 1)
      return { success: false, error: "Delivery type multipliers must be >= 1.0" };
    if (areaMaxMultiplier < 1.0 || areaMaxMultiplier > 3.0)
      return { success: false, error: "Area max multiplier must be between 1.0 and 3.0" };

    const { error } = await supabaseAdmin
      .from("platform_settings")
      .update({
        base_fee:               baseFee,
        rate_per_km:            ratePerKm,
        min_delivery_fee:       minDeliveryFee,
        weight_mult_light:      weightMultLight,
        weight_mult_medium:     weightMultMedium,
        weight_mult_heavy:      weightMultHeavy,
        type_mult_normal:       typeMultNormal,
        type_mult_priority:     typeMultPriority,
        type_mult_high_value:   typeMultHighValue,
        area_difficulty_enabled: areaDifficultyEnabled,
        area_max_multiplier:    areaMaxMultiplier,
        updated_at:             new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Area scores management ────────────────────────────────────────────────────

export async function getAreaScores({ page = 1, limit = 50 } = {}) {
  try {
    const { data, error, count } = await supabaseAdmin
      .from("area_scores")
      .select("*", { count: "exact" })
      .order("difficulty_multiplier", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) return { success: false, error: error.message };
    return { success: true, areas: data || [], total: count };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function overrideAreaMultiplier(latGrid, lngGrid, multiplier) {
  try {
    if (multiplier < 1.0 || multiplier > 3.0)
      return { success: false, error: "Multiplier must be between 1.0 and 3.0" };

    const { error } = await supabaseAdmin
      .from("area_scores")
      .update({ difficulty_multiplier: multiplier })
      .eq("lat_grid", latGrid)
      .eq("lng_grid", lngGrid);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function resetAreaMultiplier(latGrid, lngGrid) {
  try {
    const { error } = await supabaseAdmin
      .from("area_scores")
      .update({ difficulty_multiplier: 1.0 })
      .eq("lat_grid", latGrid)
      .eq("lng_grid", lngGrid);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
