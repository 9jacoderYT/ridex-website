// Path: lib/server-actions/company/companyFinance.js
"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { validateCompanySession } from "./validateSession";

// ── Get company wallet balance ────────────────────────────────────────────────

export async function getCompanyWallet() {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    const { data, error } = await supabaseAdmin
      .from("company_wallets")
      .select("balance, total_earned, total_withdrawn")
      .eq("company_id", companyId)
      .single();

    if (error && error.code !== "PGRST116") return { success: false, error: error.message };

    return {
      success: true,
      wallet: data ?? { balance: 0, total_earned: 0, total_withdrawn: 0 },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Get company commission settings ──────────────────────────────────────────

export async function getCompanyCommission() {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    const [commissionRes, platformRes] = await Promise.all([
      supabaseAdmin
        .from("company_commission_settings")
        .select("rider_percentage")
        .eq("company_id", companyId)
        .single(),
      supabaseAdmin
        .from("platform_settings")
        .select("platform_fee_percentage")
        .eq("id", 1)
        .single(),
    ]);

    const riderPct = parseFloat(commissionRes.data?.rider_percentage ?? "75");
    const platformPct = parseFloat(platformRes.data?.platform_fee_percentage ?? "20");
    const remainder = 100 - platformPct;
    const companyPct = remainder - (remainder * riderPct) / 100;

    return {
      success: true,
      commission: {
        platform_fee_percentage: platformPct,
        rider_percentage_of_remainder: riderPct,
        rider_total_percentage: (remainder * riderPct) / 100,
        company_total_percentage: companyPct,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Update company commission (rider split) ───────────────────────────────────

export async function updateCompanyCommission(riderPercentage) {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    if (riderPercentage < 50 || riderPercentage > 100) {
      return { success: false, error: "Rider percentage must be between 50% and 100%" };
    }

    const { error } = await supabaseAdmin
      .from("company_commission_settings")
      .upsert(
        { company_id: companyId, rider_percentage: riderPercentage, updated_at: new Date().toISOString() },
        { onConflict: "company_id" },
      );

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Per-rider commission override ────────────────────────────────────────────

// Set (or update) a custom commission split for one specific rider.
export async function setRiderCommission(riderDbId, riderPercentage) {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    if (riderPercentage < 50 || riderPercentage > 100)
      return { success: false, error: "Rider percentage must be between 50% and 100%" };

    // Verify the rider belongs to this company
    const { data: rider, error: riderErr } = await supabaseAdmin
      .from("riders")
      .select("id")
      .eq("id", riderDbId)
      .eq("company_id", companyId)
      .single();

    if (riderErr || !rider)
      return { success: false, error: "Rider not found or does not belong to your company" };

    const { error } = await supabaseAdmin
      .from("rider_commission_overrides")
      .upsert(
        { rider_id: riderDbId, company_id: companyId, rider_percentage: riderPercentage, updated_at: new Date().toISOString() },
        { onConflict: "rider_id" }
      );

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Remove the custom override for a rider — they revert to the company default.
export async function removeRiderCommission(riderDbId) {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    const { error } = await supabaseAdmin
      .from("rider_commission_overrides")
      .delete()
      .eq("rider_id", riderDbId)
      .eq("company_id", companyId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Get company withdrawal history ────────────────────────────────────────────

export async function getCompanyWithdrawals() {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    const { data, error } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("id, amount, bank_name, account_number, account_name, status, admin_note, failure_reason, created_at, approved_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return { success: false, error: error.message };
    return { success: true, withdrawals: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Request a withdrawal ──────────────────────────────────────────────────────

export async function requestCompanyWithdrawal({ amount, bankName, bankCode, accountNumber, accountName }) {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    // Get platform settings for min withdrawal
    const { data: settings } = await supabaseAdmin
      .from("platform_settings")
      .select("min_company_withdrawal, max_weekly_withdrawals")
      .eq("id", 1)
      .single();

    const minWithdrawal = parseFloat(settings?.min_company_withdrawal ?? "10000");
    const maxWeekly = parseInt(settings?.max_weekly_withdrawals ?? "2");

    if (amount < minWithdrawal) {
      return { success: false, error: `Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}` };
    }

    // Check weekly withdrawal limit (Mon–Sun week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .in("status", ["pending", "approved", "processing", "completed"])
      .gte("created_at", startOfWeek.toISOString());

    if ((count ?? 0) >= maxWeekly) {
      return { success: false, error: `You can only make ${maxWeekly} withdrawal(s) per week` };
    }

    // Atomic debit
    const { data: debitResult } = await supabaseAdmin.rpc("debit_company_wallet_for_withdrawal", {
      p_company_id: companyId,
      p_amount: amount,
    });

    if (!debitResult?.success) {
      return { success: false, error: debitResult?.error || "Insufficient balance" };
    }

    // Create request
    const { data: wr, error: wrErr } = await supabaseAdmin
      .from("withdrawal_requests")
      .insert({
        requester_type: "company",
        company_id: companyId,
        amount,
        bank_name: bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        status: "pending",
      })
      .select("id")
      .single();

    if (wrErr) {
      // Rollback balance
      await supabaseAdmin.rpc("restore_company_wallet", { p_company_id: companyId, p_amount: amount });
      return { success: false, error: "Failed to create withdrawal request" };
    }

    return { success: true, withdrawalId: wr.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Get saved banking info ─────────────────────────────────────────────────────

export async function getCompanyBankInfo() {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("saved_bank_name, saved_bank_code, saved_account_number, saved_account_name")
      .eq("id", companyId)
      .single();

    if (error) return { success: false, error: error.message };

    const hasSavedInfo = !!(data?.saved_bank_name && data?.saved_account_number);
    return {
      success: true,
      bankInfo: hasSavedInfo ? {
        bankName: data.saved_bank_name,
        bankCode: data.saved_bank_code,
        accountNumber: data.saved_account_number,
        accountName: data.saved_account_name,
      } : null,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Save banking info ─────────────────────────────────────────────────────────

export async function saveCompanyBankInfo({ bankName, bankCode, accountNumber, accountName }) {
  try {
    const session = await validateCompanySession();
    if (!session.success) return { success: false, error: session.error };
    const companyId = session.company.id;

    if (!bankName || !bankCode) return { success: false, error: "Please select a bank" };
    if (!accountNumber || accountNumber.length < 10) return { success: false, error: "Account number must be 10 digits" };
    if (!accountName?.trim()) return { success: false, error: "Please enter account name" };

    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        saved_bank_name: bankName,
        saved_bank_code: bankCode,
        saved_account_number: accountNumber,
        saved_account_name: accountName.trim(),
      })
      .eq("id", companyId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
