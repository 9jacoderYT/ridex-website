// Path: lib/server-actions/finance/manageWithdrawals.js
"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { sendNotificationEmail } from "@/lib/utils/sendNotificationEmail";

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

async function requireFinanceRole(payload) {
  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("role_name")
    .eq("username", payload.username)
    .single();
  const allowed = ["Super Admin", "Finance Officer"];
  if (!allowed.includes(admin?.role_name)) throw new Error("Insufficient permissions");
  return admin;
}

// ── Fetch withdrawal requests ─────────────────────────────────────────────────

export async function fetchWithdrawals({ status = "all", type = "all", page = 1, limit = 20 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("withdrawal_requests")
      .select(`
        id, requester_type, amount, bank_name, bank_code, account_number, account_name,
        status, admin_note, approved_by, approved_at, flutterwave_transfer_id,
        flutterwave_reference, failure_reason, created_at, updated_at,
        rider_id, company_id
      `)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status !== "all") query = query.eq("status", status);
    if (type !== "all") query = query.eq("requester_type", type);

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };

    // Enrich with rider/company names
    const enriched = await Promise.all(
      (data || []).map(async (req) => {
        if (req.requester_type === "rider" && req.rider_id) {
          const { data: rider } = await supabaseAdmin
            .from("riders")
            .select("full_name, rider_id, phone")
            .eq("id", req.rider_id)
            .single();
          return { ...req, requester_name: rider?.full_name, requester_ref: rider?.rider_id, requester_phone: rider?.phone };
        }
        if (req.requester_type === "company" && req.company_id) {
          const { data: company } = await supabaseAdmin
            .from("companies")
            .select("company_name, company_id, email")
            .eq("id", req.company_id)
            .single();
          return { ...req, requester_name: company?.company_name, requester_ref: company?.company_id, requester_phone: company?.email };
        }
        return req;
      }),
    );

    return { success: true, withdrawals: enriched, total: count };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── Approve withdrawal (marks as approved — payment processed manually) ───────

export async function approveWithdrawal(withdrawalId, adminNote = "") {
  try {
    const payload = await verifyAdminSession();
    await requireFinanceRole(payload);

    // Get the withdrawal request (must be pending)
    const { data: wr, error: wrErr } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("id, status")
      .eq("id", withdrawalId)
      .eq("status", "pending")
      .single();

    if (wrErr || !wr) return { success: false, error: "Withdrawal not found or already processed" };

    // Mark as approved — admin will process the bank transfer manually
    const { error: updateErr } = await supabaseAdmin
      .from("withdrawal_requests")
      .update({
        status: "approved",
        approved_by: payload.username,
        approved_at: new Date().toISOString(),
        admin_note: adminNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId);

    if (updateErr) return { success: false, error: "Failed to approve withdrawal" };

    return { success: true, message: "Withdrawal approved successfully" };
  } catch (err) {
    console.error("approveWithdrawal error:", err);
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── Reject withdrawal (restore balance) ──────────────────────────────────────

export async function rejectWithdrawal(withdrawalId, adminNote = "") {
  try {
    const payload = await verifyAdminSession();
    await requireFinanceRole(payload);

    const { data: wr, error: wrErr } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawalId)
      .eq("status", "pending")
      .single();

    if (wrErr || !wr) return { success: false, error: "Withdrawal not found or already processed" };

    // Restore balance and look up email for notification
    let recipientEmail = null;
    let recipientName  = null;
    let restoredBalance = null;

    if (wr.requester_type === "rider" && wr.rider_id) {
      await supabaseAdmin.rpc("restore_rider_wallet", {
        p_rider_id: wr.rider_id,
        p_amount: wr.amount,
      });
      const { data: rider } = await supabaseAdmin
        .from("riders")
        .select("name, email, wallet_balance")
        .eq("id", wr.rider_id)
        .single();
      recipientEmail  = rider?.email;
      recipientName   = rider?.name;
      restoredBalance = rider ? (Number(rider.wallet_balance ?? 0) + Number(wr.amount)) : null;
    } else if (wr.requester_type === "company" && wr.company_id) {
      await supabaseAdmin.rpc("restore_company_wallet", {
        p_company_id: wr.company_id,
        p_amount: wr.amount,
      });
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("company_name, email")
        .eq("id", wr.company_id)
        .single();
      recipientEmail = company?.email;
      recipientName  = company?.company_name;
    }

    await supabaseAdmin
      .from("withdrawal_requests")
      .update({
        status: "rejected",
        approved_by: payload.username,
        approved_at: new Date().toISOString(),
        admin_note: adminNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId);

    // Notify recipient (fire-and-forget)
    if (recipientEmail) {
      sendNotificationEmail("withdrawal_rejected", recipientEmail, {
        name: recipientName || "there",
        amount: wr.amount,
        adminNote: adminNote || undefined,
        restoredBalance: restoredBalance ?? undefined,
      });
    }

    return { success: true, message: "Withdrawal rejected and balance restored" };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── Check transfer status from Flutterwave ────────────────────────────────────

export async function checkTransferStatus(withdrawalId) {
  try {
    await verifyAdminSession();

    const { data: wr } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("flutterwave_transfer_id, status, rider_id, company_id, amount, requester_type")
      .eq("id", withdrawalId)
      .single();

    if (!wr?.flutterwave_transfer_id) return { success: false, error: "No transfer ID found" };
    if (wr.status === "completed" || wr.status === "failed") {
      return { success: true, status: wr.status };
    }

    const flwRes = await fetch(
      `https://api.flutterwave.com/v3/transfers/${wr.flutterwave_transfer_id}`,
      { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } },
    );
    const flwData = await flwRes.json();
    const flwStatus = flwData.data?.status?.toLowerCase();

    if (flwStatus === "successful") {
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", withdrawalId);
      return { success: true, status: "completed" };
    }

    if (flwStatus === "failed") {
      // Restore balance
      if (wr.requester_type === "rider" && wr.rider_id) {
        await supabaseAdmin.rpc("restore_rider_wallet", { p_rider_id: wr.rider_id, p_amount: wr.amount });
      } else if (wr.requester_type === "company" && wr.company_id) {
        await supabaseAdmin.rpc("restore_company_wallet", { p_company_id: wr.company_id, p_amount: wr.amount });
      }
      await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "failed",
          failure_reason: flwData.data?.complete_message || "Transfer failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);
      return { success: true, status: "failed" };
    }

    return { success: true, status: "processing" };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── Platform settings ─────────────────────────────────────────────────────────

export async function getPlatformSettings() {
  try {
    await verifyAdminSession();
    const { data, error } = await supabaseAdmin.from("platform_settings").select("*").eq("id", 1).single();
    if (error) return { success: false, error: error.message };
    return { success: true, settings: data };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

export async function updatePlatformSettings({ platformFeePercentage, minRiderWithdrawal, minCompanyWithdrawal, maxWeeklyWithdrawals }) {
  try {
    const payload = await verifyAdminSession();
    if (payload.role !== "Super Admin") return { success: false, error: "Only Super Admin can change platform settings" };

    const { error } = await supabaseAdmin
      .from("platform_settings")
      .update({
        platform_fee_percentage: platformFeePercentage,
        min_rider_withdrawal: minRiderWithdrawal,
        min_company_withdrawal: minCompanyWithdrawal,
        max_weekly_withdrawals: maxWeeklyWithdrawals,
        updated_by: payload.username,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── Withdrawal summary stats ──────────────────────────────────────────────────

export async function getWithdrawalStats() {
  try {
    await verifyAdminSession();

    const { data } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("status, amount");

    const stats = { pending: 0, approved: 0, completed: 0, failed: 0, rejected: 0, pending_amount: 0, approved_amount: 0, completed_amount: 0 };
    for (const r of data || []) {
      if (r.status === "pending") { stats.pending++; stats.pending_amount += Number(r.amount); }
      if (r.status === "approved") { stats.approved++; stats.approved_amount += Number(r.amount); }
      if (r.status === "completed") { stats.completed++; stats.completed_amount += Number(r.amount); }
      if (r.status === "failed") stats.failed++;
      if (r.status === "rejected") stats.rejected++;
    }

    return { success: true, stats };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}
