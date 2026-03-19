"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getSession } from "@/lib/utils/session";

// ─────────────────────────────────────────────────────────────────────────────
// TrustScore — Admin-only server actions
// NOT exposed to riders, senders, receivers, or companies.
// ─────────────────────────────────────────────────────────────────────────────

async function verifyAdminSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// ── Fetch TrustScore(s) for an entity ────────────────────────────────────────

/**
 * Get all trust scores for an entity plus recent admin log.
 *
 * @param {"rider"|"user"|"company"} entityType
 * @param {string} entityId  UUID for rider/company, user_id (RXxxxx) for user
 */
export async function getTrustScore(entityType, entityId) {
  try {
    await verifyAdminSession();

    let scores = {};

    if (entityType === "rider") {
      const { data, error } = await supabaseAdmin
        .from("riders")
        .select("rider_trust_score")
        .eq("id", entityId)
        .single();
      if (error) throw error;
      scores.rider = data.rider_trust_score ?? 60;
    }

    if (entityType === "user") {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("user_trust_score")
        .eq("user_id", entityId)
        .single();
      if (error) throw error;
      scores.user = data.user_trust_score ?? 60;
    }

    if (entityType === "company") {
      const { data, error } = await supabaseAdmin
        .from("companies")
        .select("company_trust_score")
        .eq("id", entityId)
        .single();
      if (error) throw error;
      scores.company = data.company_trust_score ?? 60;
    }

    // Fetch last 10 admin log entries for this entity
    const { data: log } = await supabaseAdmin
      .from("trust_score_admin_log")
      .select("id, entity_type, old_score, new_score, reason, source, created_at")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(10);

    return { success: true, scores, log: log ?? [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── Admin manual override ─────────────────────────────────────────────────────

/**
 * Admin sets a trust score manually. Logged to trust_score_admin_log.
 *
 * @param {"rider"|"user_sender"|"user_receiver"|"company"} scoreType
 * @param {string} entityId
 * @param {number} newScore  0–100
 * @param {string} reason
 */
export async function setTrustScore(scoreType, entityId, newScore, reason) {
  try {
    const session = await verifyAdminSession();

    const clamped = Math.max(0, Math.min(100, Math.round(Number(newScore))));
    if (isNaN(clamped)) throw new Error("Invalid score value");

    const { error } = await supabaseAdmin.rpc("admin_set_trust_score", {
      p_entity_type:    scoreType,
      p_entity_id:      entityId,
      p_new_score:      clamped,
      p_reason:         reason || null,
      p_admin_user_id:  session.id ?? null,
    });

    if (error) throw error;

    return { success: true, score: clamped };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── Auto-recompute from 30-day history ───────────────────────────────────────

/**
 * Trigger auto-recompute of a trust score from the last 30 days of data.
 *
 * @param {"rider"|"user_sender"|"company"} scoreType
 * @param {string} entityId
 */
export async function recomputeTrustScore(scoreType, entityId) {
  try {
    await verifyAdminSession();

    let rpcName;
    let rpcArg;

    if (scoreType === "rider") {
      rpcName = "compute_rider_trust_score";
      rpcArg  = { p_rider_id: entityId };
    } else if (scoreType === "user") {
      rpcName = "compute_user_trust_score";
      rpcArg  = { p_user_id: entityId };
    } else if (scoreType === "company") {
      rpcName = "compute_company_trust_score";
      rpcArg  = { p_company_id: entityId };
    } else {
      throw new Error("Recompute not supported for this score type");
    }

    const { data, error } = await supabaseAdmin.rpc(rpcName, rpcArg);
    if (error) throw error;

    return { success: true, score: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
