// Path: lib/server-actions/finance/walletOverview.js
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

// ── Summary totals ─────────────────────────────────────────────────────────────

export async function getWalletOverview() {
  try {
    await verifyAdminSession();

    const [riderRes, companyRes, userRes] = await Promise.all([
      supabaseAdmin
        .from("riders")
        .select("wallet_balance")
        .not("wallet_balance", "is", null),
      supabaseAdmin
        .from("company_wallets")
        .select("balance"),
      supabaseAdmin
        .from("users")
        .select("wallet_balance")
        .not("wallet_balance", "is", null)
        .gt("wallet_balance", 0),
    ]);

    const totalRiderWallets = (riderRes.data || []).reduce(
      (sum, r) => sum + Number(r.wallet_balance ?? 0), 0
    );
    const totalCompanyWallets = (companyRes.data || []).reduce(
      (sum, r) => sum + Number(r.balance ?? 0), 0
    );
    const totalUserWallets = (userRes.data || []).reduce(
      (sum, r) => sum + Number(r.wallet_balance ?? 0), 0
    );

    return {
      success: true,
      totals: {
        riders: totalRiderWallets,
        companies: totalCompanyWallets,
        users: totalUserWallets,
        grand: totalRiderWallets + totalCompanyWallets + totalUserWallets,
      },
    };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── Rider wallets (paginated, searchable) ─────────────────────────────────────

export async function getRiderWallets({ page = 1, search = "", limit = 20 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("riders")
      .select("id, name, email, phone, company_id, wallet_balance, total_earned, total_withdrawn", { count: "exact" })
      .order("wallet_balance", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };

    return { success: true, riders: data || [], total: count ?? 0 };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── Company wallets ────────────────────────────────────────────────────────────

export async function getCompanyWallets() {
  try {
    await verifyAdminSession();

    const { data, error } = await supabaseAdmin
      .from("company_wallets")
      .select(`
        company_id,
        balance,
        total_earned,
        total_withdrawn,
        companies (company_name, company_id, email)
      `)
      .order("balance", { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, companies: data || [] };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}

// ── User wallets (paginated, only those with balance > 0) ─────────────────────

export async function getUserWallets({ page = 1, search = "", limit = 20 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("users")
      .select("user_id, full_name, phone, wallet_balance", { count: "exact" })
      .gt("wallet_balance", 0)
      .order("wallet_balance", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,user_id.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };

    return { success: true, users: data || [], total: count ?? 0 };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { success: false, error: err.message };
  }
}
