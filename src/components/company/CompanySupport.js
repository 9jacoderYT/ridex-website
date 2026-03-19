// Path: src/components/company/CompanySupport.js

"use client";

import { useState, useEffect, useRef } from "react";
import {
  submitCompanyTicket,
  getCompanyTickets,
  getCompanyTicketMessages,
  sendCompanyMessage,
} from "@/lib/server-actions/company/companyTickets";

const STATUS_COLORS = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS = {
  rider_suspension_request: "Rider Suspension Request",
  rider_removal_request: "Rider Removal Request",
  payment_dispute: "Payment Dispute",
  account_issue: "Account Issue",
  order_issue: "Order Issue",
  app_error: "App Error",
  other: "Other",
};

const CATEGORY_COLORS = {
  rider_suspension_request: "bg-red-100 text-red-700",
  rider_removal_request: "bg-red-100 text-red-700",
  payment_dispute: "bg-purple-100 text-purple-700",
  account_issue: "bg-blue-100 text-blue-700",
  order_issue: "bg-orange-100 text-orange-700",
  app_error: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600",
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COMPANY_CATEGORIES = [
  { value: "rider_suspension_request", label: "Rider Suspension Request" },
  { value: "rider_removal_request", label: "Rider Removal Request" },
  { value: "payment_dispute", label: "Payment Dispute" },
  { value: "account_issue", label: "Account Issue" },
  { value: "order_issue", label: "Order Issue" },
  { value: "app_error", label: "App Error" },
  { value: "other", label: "Other" },
];

export default function CompanySupport({ riders = [] }) {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // New ticket form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "other",
    description: "",
    relatedRiderId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Ticket detail / conversation
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef(null);

  const LIMIT = 10;

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, page]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    const result = await getCompanyTickets({ status: statusFilter, page, limit: LIMIT });
    if (result.success) {
      setTickets(result.data);
      setTotal(result.total);
    }
    setLoading(false);
  };

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setReplyText("");
    setLoadingMessages(true);
    const result = await getCompanyTicketMessages(ticket.id);
    setMessages(result.success ? result.data : []);
    setLoadingMessages(false);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    const result = await sendCompanyMessage(selectedTicket.id, replyText.trim());
    setSendingReply(false);
    if (result.success) {
      setReplyText("");
      const msgResult = await getCompanyTicketMessages(selectedTicket.id);
      setMessages(msgResult.success ? msgResult.data : []);
      setSelectedTicket((t) => ({
        ...t,
        status: t.status === "open" ? "in_progress" : t.status,
      }));
    } else {
      alert("Error sending reply: " + result.error);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      setFormError("Subject and description are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const result = await submitCompanyTicket({
      subject: formData.subject.trim(),
      category: formData.category,
      description: formData.description.trim(),
      relatedRiderId: formData.relatedRiderId || undefined,
    });
    setSubmitting(false);
    if (result.success) {
      setShowForm(false);
      setFormData({ subject: "", category: "other", description: "", relatedRiderId: "" });
      fetchTickets();
    } else {
      setFormError(result.error || "Failed to submit ticket. Please try again.");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Support Tickets</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Contact admin for rider management, disputes, and account issues.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Open a Ticket
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 font-medium">Status:</span>
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">{total} ticket{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Notice about rider actions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-amber-800">
          <strong>Rider actions require admin approval.</strong> To suspend or remove a rider from your fleet, please open a support ticket. Our team typically responds within 24 hours.
        </p>
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No tickets yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Open a Ticket" to contact support.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Ticket #", "Subject", "Category", "Status", "Date", "Reply", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-bold text-emerald-700">{t.ticket_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 font-medium max-w-xs truncate">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CATEGORY_COLORS[t.category] || "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_LABELS[t.category] || t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[t.status]}`}>
                      {t.status === "in_progress" ? "In Progress" : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(t.created_at)}</td>
                  <td className="px-4 py-3">
                    {t.admin_reply ? (
                      <span className="text-xs text-green-600 font-semibold">✓ Replied</span>
                    ) : (
                      <span className="text-xs text-amber-500">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openTicket(t)}
                      className="text-emerald-600 text-sm font-medium hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* ── New Ticket Form Modal ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Open a Support Ticket</h2>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitTicket} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {COMPANY_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {(formData.category === "rider_suspension_request" || formData.category === "rider_removal_request") && (
                  <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded-lg px-2 py-1">
                    Please include the rider's name and the reason in the description below.
                  </p>
                )}
              </div>

              {riders.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Rider <span className="text-gray-400">(optional)</span>
                  </label>
                  <select
                    value={formData.relatedRiderId}
                    onChange={(e) => setFormData((f) => ({ ...f, relatedRiderId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select a rider --</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.plate_number || r.phone})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Brief summary of your issue"
                  maxLength={120}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe your issue in detail…"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(null); }}
                  className="px-5 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Ticket Conversation Modal ─────────────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl flex flex-col"
            style={{ maxHeight: "88vh" }}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-gray-900 font-mono">{selectedTicket.ticket_number}</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[selectedTicket.status]}`}>
                    {selectedTicket.status === "in_progress" ? "In Progress" : selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[selectedTicket.category] || "bg-gray-100 text-gray-600"}`}>
                    {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700 mt-1">{selectedTicket.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmt(selectedTicket.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none ml-4 shrink-0"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-sm rounded-2xl px-4 py-3 ${
                        msg.sender_type === "user"
                          ? "bg-gray-100 rounded-tl-sm"
                          : "bg-emerald-600 text-white rounded-tr-sm"
                      }`}
                    >
                      <p className={`text-xs font-semibold mb-1.5 ${msg.sender_type === "user" ? "text-gray-500" : "text-emerald-100"}`}>
                        {msg.sender_type === "admin" ? "🎧 Support Team" : "🏢 Your Company"}
                      </p>
                      {msg.message && (
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.sender_type === "user" ? "text-gray-800" : "text-white"}`}>
                          {msg.message}
                        </p>
                      )}
                      <p className={`text-xs mt-1.5 ${msg.sender_type === "user" ? "text-gray-400" : "text-emerald-200"}`}>
                        {fmt(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply */}
            {!["resolved", "closed"].includes(selectedTicket.status) && (
              <div className="px-5 pb-3 pt-2 border-t border-gray-100 shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply();
                    }}
                    rows={2}
                    placeholder="Type a reply… (Ctrl+Enter to send)"
                    className="flex-1 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-emerald-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    {sendingReply ? "Sending…" : "Send ↑"}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              {["resolved", "closed"].includes(selectedTicket.status) && (
                <p className="text-center text-sm text-gray-400 mb-3">
                  This ticket is {selectedTicket.status}. Open a new ticket if you need further help.
                </p>
              )}
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
