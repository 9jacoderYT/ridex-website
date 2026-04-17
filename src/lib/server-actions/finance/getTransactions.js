// Path: lib/server-actions/finance/getTransactions.js
"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

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

// ── Summary cards across all transaction types ────────────────────────────────

export async function getTransactionSummary() {
  try {
    await verifyAdminSession();

    // Use head:true so Supabase returns only the count — no row data loaded into memory
    const [prepaidRes, codRes, walletCreditRes, walletDebitRes, promoRes, withdrawalRes] =
      await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "completed")
          .neq("payment_type", "pay_on_delivery"),
        supabaseAdmin
          .from("rider_cod_ledger")
          .select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("wallet_transactions")
          .select("*", { count: "exact", head: true })
          .eq("type", "credit"),
        supabaseAdmin
          .from("wallet_transactions")
          .select("*", { count: "exact", head: true })
          .eq("type", "debit"),
        supabaseAdmin
          .from("promo_transactions")
          .select("*", { count: "exact", head: true })
          .eq("type", "credit"),
        supabaseAdmin
          .from("withdrawal_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed"),
      ]);

    return {
      success: true,
      summary: {
        prepaidCount: prepaidRes.count ?? 0,
        codCount: codRes.count ?? 0,
        walletCreditCount: walletCreditRes.count ?? 0,
        walletDebitCount: walletDebitRes.count ?? 0,
        promoCreditCount: promoRes.count ?? 0,
        withdrawalCount: withdrawalRes.count ?? 0,
      },
    };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── 1. Order payments (prepaid + COD) ─────────────────────────────────────────

export async function getPaymentTransactions({ page = 1, search = "", method = "", limit = 25 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("orders")
      .select(`
        id,
        tracking_number,
        payment_type,
        payment_method,
        payment_status,
        amount_paid,
        cod_amount,
        cod_collected,
        cod_collected_at,
        cod_payer,
        promo_discount,
        flutterwave_tx_ref,
        flutterwave_tx_id,
        created_at,
        status,
        sender_name,
        sender_phone,
        recipient_name,
        user_id,
        rider_id
      `, { count: "exact" })
      .or("payment_status.eq.completed,cod_collected.eq.true")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (method === "flutterwave") {
      query = query.eq("payment_method", "flutterwave");
    } else if (method === "wallet") {
      query = query.eq("payment_method", "wallet");
    } else if (method === "cod") {
      query = query.eq("payment_type", "pay_on_delivery").eq("cod_collected", true);
    }

    if (search) {
      query = query.or(
        `tracking_number.ilike.%${search}%,sender_name.ilike.%${search}%,sender_phone.ilike.%${search}%,flutterwave_tx_ref.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, transactions: data || [], total: count ?? 0 };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── 2. User wallet transactions (top-ups, refunds, order payments, admin credits) ──

export async function getWalletTransactions({ page = 1, search = "", type = "", source = "", limit = 25 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("wallet_transactions")
      .select(`
        id,
        user_id,
        amount,
        type,
        source,
        reference_id,
        description,
        created_at
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) query = query.eq("type", type);
    if (source) query = query.eq("source", source);
    if (search) {
      query = query.or(
        `user_id.ilike.%${search}%,description.ilike.%${search}%,reference_id.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };

    // Hydrate user names — wallet_transactions.user_id is the custom VARCHAR(10) user_id
    const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
    let userMap = {};
    if (userIds.length) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      (users || []).forEach((u) => { userMap[u.user_id] = u; });
    }

    const transactions = (data || []).map((r) => ({ ...r, user: userMap[r.user_id] || null }));
    return { success: true, transactions, total: count ?? 0 };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── 3. Promo/referral transactions ────────────────────────────────────────────

export async function getPromoTransactions({ page = 1, search = "", type = "", source = "", limit = 25 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("promo_transactions")
      .select(`
        id,
        user_id,
        amount,
        type,
        source,
        reference_id,
        description,
        created_at
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) query = query.eq("type", type);
    if (source) query = query.eq("source", source);
    if (search) {
      query = query.or(
        `user_id.ilike.%${search}%,description.ilike.%${search}%,reference_id.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };

    // Hydrate user names — promo_transactions.user_id is the custom VARCHAR(10) user_id
    const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
    let userMap = {};
    if (userIds.length) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      (users || []).forEach((u) => { userMap[u.user_id] = u; });
    }

    const transactions = (data || []).map((r) => ({ ...r, user: userMap[r.user_id] || null }));
    return { success: true, transactions, total: count ?? 0 };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── 4. Rider COD ledger ───────────────────────────────────────────────────────

export async function getCodLedger({ page = 1, search = "", remitted = "", limit = 25 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("rider_cod_ledger")
      .select(`
        id,
        rider_id,
        order_id,
        amount_collected,
        platform_share,
        company_share,
        rider_share,
        remitted,
        remitted_at,
        created_at,
        orders ( tracking_number, sender_name )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (remitted === "true") query = query.eq("remitted", true);
    if (remitted === "false") query = query.eq("remitted", false);
    if (search) {
      query = query.or(`rider_id.ilike.%${search}%,order_id.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };

    // Hydrate rider names — rider_cod_ledger.rider_id is VARCHAR(20), no FK to riders table
    const riderIds = [...new Set((data || []).map((r) => r.rider_id).filter(Boolean))];
    let riderMap = {};
    if (riderIds.length) {
      const { data: riders } = await supabaseAdmin
        .from("riders")
        .select("id, name, phone")
        .in("id", riderIds);
      (riders || []).forEach((r) => { riderMap[r.id] = r; });
    }

    const transactions = (data || []).map((r) => ({ ...r, rider: riderMap[r.rider_id] || null }));
    return { success: true, transactions, total: count ?? 0 };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── 5. Withdrawals ─────────────────────────────────────────────────────────────

export async function getWithdrawalTransactions({ page = 1, search = "", status = "", requesterType = "", limit = 25 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("withdrawal_requests")
      .select(`
        id,
        requester_type,
        rider_id,
        company_id,
        amount,
        bank_name,
        account_number,
        account_name,
        status,
        admin_note,
        approved_by,
        approved_at,
        flutterwave_reference,
        failure_reason,
        created_at,
        updated_at,
        riders ( name, phone ),
        companies ( company_name, email )
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq("status", status);
    if (requesterType) query = query.eq("requester_type", requesterType);
    if (search) {
      query = query.or(
        `account_name.ilike.%${search}%,account_number.ilike.%${search}%,flutterwave_reference.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, transactions: data || [], total: count ?? 0 };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}
