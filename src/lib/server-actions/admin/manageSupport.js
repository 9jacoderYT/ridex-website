"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getSession } from "@/lib/utils/session";
import { redirect } from "next/navigation";
import { sendNotificationEmail } from "@/lib/utils/sendNotificationEmail";

// ─── Auth helper ────────────────────────────────────────────────────────────

async function verifyAdminSession() {
  const session = await getSession();
  if (!session) redirect("/loginadminusers");
  return session;
}

// ─── Failed Payments ─────────────────────────────────────────────────────────

export async function getFailedPayments({ status = "all", page = 1, limit = 20 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("failed_payments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

export async function updateFailedPaymentStatus(id, { status, notes, resolvedBy }) {
  try {
    await verifyAdminSession();

    const updates = { status, notes };
    if (status === "resolved") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = resolvedBy;
    }

    const { error } = await supabaseAdmin
      .from("failed_payments")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Support Tickets ─────────────────────────────────────────────────────────

export async function getSupportTickets({ status = "all", category = "all", source = "all", page = 1, limit = 20 } = {}) {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin
      .from("support_tickets")
      .select(
        `*, users!support_tickets_user_id_fkey(full_name, phone, role)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status !== "all") query = query.eq("status", status);
    if (category !== "all") query = query.eq("category", category);
    if (source !== "all") query = query.eq("ticket_source", source);

    const { data, error, count } = await query;
    if (error) {
      // Fallback: fetch without join if foreign key relationship isn't defined
      let fallbackQuery = supabaseAdmin
        .from("support_tickets")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (status !== "all") fallbackQuery = fallbackQuery.eq("status", status);
      if (category !== "all") fallbackQuery = fallbackQuery.eq("category", category);
      if (source !== "all") fallbackQuery = fallbackQuery.eq("ticket_source", source);

      const fallback = await fallbackQuery;
      if (fallback.error) throw fallback.error;

      // Enrich company tickets with company names
      let tickets = fallback.data ?? [];
      tickets = await enrichCompanyTickets(tickets);
      return { success: true, data: tickets, total: fallback.count ?? 0 };
    }

    // Flatten joined user data
    let tickets = (data ?? []).map((t) => ({
      ...t,
      user_full_name: t.users?.full_name ?? null,
      user_phone: t.users?.phone ?? null,
      user_role: t.users?.role ?? null,
      users: undefined,
    }));

    // Enrich company tickets with company names
    tickets = await enrichCompanyTickets(tickets);

    return { success: true, data: tickets, total: count ?? 0 };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

/** Batch-fetch company names for any company-sourced tickets */
async function enrichCompanyTickets(tickets) {
  const companyIds = tickets
    .filter((t) => t.ticket_source === "company" && t.company_id)
    .map((t) => t.company_id);

  if (companyIds.length === 0) return tickets;

  const { data: companies } = await supabaseAdmin
    .from("companies")
    .select("id, company_name, contact_person_name, email, phone")
    .in("id", companyIds);

  if (!companies || companies.length === 0) return tickets;

  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));
  return tickets.map((t) =>
    t.ticket_source === "company" && t.company_id
      ? {
          ...t,
          company_name: companyMap[t.company_id]?.company_name ?? null,
          company_contact: companyMap[t.company_id]?.contact_person_name ?? null,
          company_email: companyMap[t.company_id]?.email ?? null,
          company_phone: companyMap[t.company_id]?.phone ?? null,
        }
      : t
  );
}

export async function getSupportTicket(id) {
  try {
    await verifyAdminSession();

    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

export async function updateSupportTicket(id, { status, adminReply, adminNotes, resolvedBy }) {
  try {
    await verifyAdminSession();

    const updates = {};
    if (status) updates.status = status;
    if (adminReply !== undefined) updates.admin_reply = adminReply;
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    if (status === "resolved") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = resolvedBy;
    }

    const { error } = await supabaseAdmin
      .from("support_tickets")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Ticket Messaging ────────────────────────────────────────────────────────

/** Fetch all messages for a ticket (ordered oldest → newest). */
export async function getTicketMessages(ticketId) {
  try {
    await verifyAdminSession();
    const { data, error } = await supabaseAdmin
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

/**
 * Send an admin message on a ticket.
 * Also updates support_tickets.admin_reply for backward compat
 * and sets status to in_progress if it was open.
 */
export async function sendAdminMessage(ticketId, adminUsername, message) {
  try {
    await verifyAdminSession();

    const { error: msgErr } = await supabaseAdmin
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_type: "admin",
        sender_id: adminUsername,
        message,
        image_urls: [],
      });
    if (msgErr) throw msgErr;

    // Move to in_progress if still open, also update admin_reply field
    const { data: ticket } = await supabaseAdmin
      .from("support_tickets")
      .select("status")
      .eq("id", ticketId)
      .single();

    const newStatus =
      ticket?.status === "open" || ticket?.status === "closed" ? "in_progress" : ticket?.status;

    const { error: updateErr } = await supabaseAdmin
      .from("support_tickets")
      .update({ admin_reply: message, status: newStatus })
      .eq("id", ticketId);
    if (updateErr) throw updateErr;

    return { success: true };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

/**
 * Fetch previous tickets by the same user (excluding the current ticket).
 * Returns up to 10 most recent.
 */
export async function getUserPreviousTickets(userId, currentTicketId) {
  try {
    await verifyAdminSession();
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_number, subject, status, category, created_at")
      .eq("user_id", userId)
      .neq("id", currentTicketId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Rider Info ───────────────────────────────────────────────────────────────

/**
 * Fetch basic info of a rider by their custom rider_id (RXRDR-...).
 * Also returns total delivery count and average rating.
 */
export async function getAppRiderBasicInfo(riderId) {
  try {
    await verifyAdminSession();

    const [riderResult, deliveryCountResult] = await Promise.all([
      supabaseAdmin
        .from("riders")
        .select(
          "id, full_name, email, phone, vehicle_type, status, wallet_balance, average_rating, total_ratings, created_at, profile_picture_url"
        )
        .eq("id", riderId)   // riderId is the riders.id UUID (set as rider.riderId in app)
        .single(),
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("rider_id", riderId)
        .eq("status", "delivered"),
    ]);

    if (riderResult.error) throw riderResult.error;

    return {
      success: true,
      data: {
        ...riderResult.data,
        total_deliveries: deliveryCountResult.count ?? 0,
      },
    };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

/**
 * Fetch previous tickets submitted by the same rider (excluding the current ticket).
 * Returns up to 10 most recent.
 */
export async function getRiderPreviousTickets(riderId, currentTicketId) {
  try {
    await verifyAdminSession();
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_number, subject, status, category, created_at")
      .eq("rider_id", riderId)
      .neq("id", currentTicketId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── App User Info ───────────────────────────────────────────────────────────

/**
 * Fetch basic info of an app user (customer) by their custom user_id.
 * Also returns total order count.
 */
export async function getAppUserBasicInfo(userId) {
  try {
    await verifyAdminSession();

    const [userResult, orderCountResult] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select(
          "user_id, full_name, email, phone, role, wallet_balance, promo_balance, business_rating, business_total_ratings, cod_trial_remaining, created_at, profile_picture_url"
        )
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    if (userResult.error) throw userResult.error;

    return {
      success: true,
      data: {
        ...userResult.data,
        total_orders: orderCountResult.count ?? 0,
      },
    };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Company Info ─────────────────────────────────────────────────────────────

/**
 * Fetch basic info about a company by their UUID (companies.id).
 * Also returns their total registered rider count and order count.
 */
export async function getCompanyBasicInfo(companyId) {
  try {
    await verifyAdminSession();

    const [companyResult, riderCountResult] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select(
          "id, company_name, contact_person_name, email, phone, company_id, is_active, is_approved, created_at"
        )
        .eq("id", companyId)
        .single(),
      supabaseAdmin
        .from("riders")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
    ]);

    if (companyResult.error) throw companyResult.error;

    return {
      success: true,
      data: {
        ...companyResult.data,
        total_riders: riderCountResult.count ?? 0,
      },
    };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

/**
 * Fetch previous tickets submitted by the same company (excluding the current ticket).
 * Returns up to 10 most recent.
 */
export async function getCompanyPreviousTickets(companyId, currentTicketId) {
  try {
    await verifyAdminSession();
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .select("id, ticket_number, subject, status, category, created_at")
      .eq("company_id", companyId)
      .neq("id", currentTicketId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}

// ─── Wallet Credit ───────────────────────────────────────────────────────────

/**
 * Manually credit a wallet — works for users, riders, and companies.
 * Pass exactly one of: userId, riderId, companyId.
 * For users: updates users.wallet_balance + inserts wallet_transactions audit row.
 * For riders: updates riders.wallet_balance directly.
 * For companies: updates company_wallets.balance directly.
 */
export async function creditUserWallet({ userId, riderId, companyId, amount, description, adminUsername, ticketId, failedPaymentId }) {
  try {
    await verifyAdminSession();

    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const reference = ticketId
      ? `ticket-${ticketId}`
      : failedPaymentId
      ? `failpay-${failedPaymentId}`
      : `admin-${Date.now()}`;

    const auditNote = `Wallet credited ₦${amount.toLocaleString()} by ${adminUsername}. ${description || ""}`.trim();

    // ── Rider credit ──────────────────────────────────────────────────────────
    if (riderId) {
      const { data: riderData, error: riderErr } = await supabaseAdmin
        .from("riders")
        .select("id, full_name, wallet_balance")
        .eq("id", riderId)
        .single();

      if (riderErr || !riderData) throw new Error("Rider not found");

      const newBalance = (riderData.wallet_balance ?? 0) + amount;
      const { error: updateErr } = await supabaseAdmin
        .from("riders")
        .update({ wallet_balance: newBalance })
        .eq("id", riderId);

      if (updateErr) throw updateErr;

      if (ticketId) {
        await supabaseAdmin
          .from("support_tickets")
          .update({ status: "resolved", admin_notes: auditNote, resolved_by: adminUsername, resolved_at: new Date().toISOString() })
          .eq("id", ticketId);
      }

      return { success: true, newBalance };
    }

    // ── Company credit ────────────────────────────────────────────────────────
    if (companyId) {
      const { data: walletData, error: walletErr } = await supabaseAdmin
        .from("company_wallets")
        .select("balance")
        .eq("company_id", companyId)
        .single();

      if (walletErr || !walletData) throw new Error("Company wallet not found");

      const newBalance = (walletData.balance ?? 0) + amount;
      const { error: updateErr } = await supabaseAdmin
        .from("company_wallets")
        .update({ balance: newBalance })
        .eq("company_id", companyId);

      if (updateErr) throw updateErr;

      if (ticketId) {
        await supabaseAdmin
          .from("support_tickets")
          .update({ status: "resolved", admin_notes: auditNote, resolved_by: adminUsername, resolved_at: new Date().toISOString() })
          .eq("id", ticketId);
      }

      return { success: true, newBalance };
    }

    // ── User credit ───────────────────────────────────────────────────────────
    if (!userId) throw new Error("No target wallet specified");

    const { data: userData, error: userErr } = await supabaseAdmin
      .from("users")
      .select("user_id, full_name, email, wallet_balance")
      .eq("user_id", userId)
      .single();

    if (userErr || !userData) throw new Error("User not found");

    const newBalance = (userData.wallet_balance ?? 0) + amount;
    const { error: updateErr } = await supabaseAdmin
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("user_id", userId);

    if (updateErr) throw updateErr;

    // Audit record in wallet_transactions
    const { error: txErr } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        amount,
        type: "credit",
        source: "admin_credit",
        reference_id: reference,
        description: description || `Admin wallet credit by ${adminUsername}`,
      });

    if (txErr) throw txErr;

    if (ticketId) {
      await supabaseAdmin
        .from("support_tickets")
        .update({ status: "resolved", admin_notes: auditNote, resolved_by: adminUsername, resolved_at: new Date().toISOString() })
        .eq("id", ticketId);
    }

    if (failedPaymentId) {
      await supabaseAdmin
        .from("failed_payments")
        .update({ status: "resolved", notes: `Wallet credited ₦${amount.toLocaleString()} by ${adminUsername}.`, resolved_by: adminUsername, resolved_at: new Date().toISOString() })
        .eq("id", failedPaymentId);
    }

    // Email the user (fire-and-forget)
    if (userData?.email) {
      sendNotificationEmail("admin_wallet_credit", userData.email, {
        name: userData.full_name || "there",
        amount,
        description: description || undefined,
        newBalance,
      });
    }

    return { success: true, newBalance };
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { success: false, error: error.message };
  }
}
