// Path: lib/server-actions/company/companyTickets.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { validateCompanySession } from "./validateSession";

function genTicketNumber() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "RXTK-";
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// ─── Submit a new ticket ──────────────────────────────────────────────────────

export async function submitCompanyTicket({ subject, category, description, relatedRiderId }) {
  try {
    const sessionResult = await validateCompanySession();
    if (!sessionResult.success) return { success: false, error: sessionResult.error };

    const company = sessionResult.company;

    const ticketNumber = genTicketNumber();

    const insertPayload = {
      ticket_number: ticketNumber,
      ticket_source: "company",
      company_id: company.id,
      subject,
      message: description,
      category,
      status: "open",
    };

    if (relatedRiderId) {
      insertPayload.rider_id = relatedRiderId;
    }

    const { data: ticket, error } = await supabaseAdmin
      .from("support_tickets")
      .insert(insertPayload)
      .select("id, ticket_number")
      .single();

    if (error) throw error;

    // Insert initial message into ticket_messages so the thread is populated
    await supabaseAdmin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_type: "user",
      sender_id: company.company_id || company.company_name,
      message: description,
      image_urls: [],
    });

    return { success: true, ticket };
  } catch (error) {
    console.error("submitCompanyTicket error:", error);
    return { success: false, error: error.message };
  }
}

// ─── List tickets for this company ───────────────────────────────────────────

export async function getCompanyTickets({ status = "all", page = 1, limit = 10 } = {}) {
  try {
    const sessionResult = await validateCompanySession();
    if (!sessionResult.success) return { success: false, error: sessionResult.error };

    const company = sessionResult.company;

    let query = supabaseAdmin
      .from("support_tickets")
      .select("*", { count: "exact" })
      .eq("company_id", company.id)
      .eq("ticket_source", "company")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status !== "all") query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [], total: count ?? 0 };
  } catch (error) {
    console.error("getCompanyTickets error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Get messages for a specific ticket ──────────────────────────────────────

export async function getCompanyTicketMessages(ticketId) {
  try {
    const sessionResult = await validateCompanySession();
    if (!sessionResult.success) return { success: false, error: sessionResult.error };

    const company = sessionResult.company;

    // Verify the ticket belongs to this company
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("support_tickets")
      .select("id, status")
      .eq("id", ticketId)
      .eq("company_id", company.id)
      .single();

    if (ticketErr || !ticket) return { success: false, error: "Ticket not found" };

    const { data, error } = await supabaseAdmin
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { success: true, data: data ?? [], ticketStatus: ticket.status };
  } catch (error) {
    console.error("getCompanyTicketMessages error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Send a message on a ticket ──────────────────────────────────────────────

export async function sendCompanyMessage(ticketId, message) {
  try {
    const sessionResult = await validateCompanySession();
    if (!sessionResult.success) return { success: false, error: sessionResult.error };

    const company = sessionResult.company;

    // Verify ticket belongs to this company and is still open
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("support_tickets")
      .select("id, status")
      .eq("id", ticketId)
      .eq("company_id", company.id)
      .single();

    if (ticketErr || !ticket) return { success: false, error: "Ticket not found" };
    if (["resolved", "closed"].includes(ticket.status)) {
      return { success: false, error: "Cannot reply to a resolved or closed ticket" };
    }

    const { error } = await supabaseAdmin.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_type: "user",
      sender_id: company.company_id || company.company_name,
      message,
      image_urls: [],
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("sendCompanyMessage error:", error);
    return { success: false, error: error.message };
  }
}
