"use client";

import { useState, useEffect, useRef } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import {
  getSupportTickets,
  getSupportTicket,
  updateSupportTicket,
  getTicketMessages,
  sendAdminMessage,
  getUserPreviousTickets,
  getRiderPreviousTickets,
  getCompanyPreviousTickets,
  creditUserWallet,
  getAppUserBasicInfo,
  getAppRiderBasicInfo,
  getCompanyBasicInfo,
} from "@/lib/server-actions/admin/manageSupport";
import { getOrderDetail } from "@/lib/server-actions/admin/manageOrders";

const STATUS_COLORS = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS = {
  // User categories
  payment_failed: "Payment Issue",
  order_issue: "Order Problem",
  refund_request: "Refund Request",
  app_error: "App Error",
  other: "Other",
  // Rider categories
  customer_issue: "Customer Issue",
  sender_unreachable: "Can't Reach Sender",
  receiver_unreachable: "Can't Reach Receiver",
  payment_dispute_sender: "Sender Won't Pay",
  payment_dispute_receiver: "Receiver Won't Pay",
  payment_not_confirmed: "Payment Not Confirmed",
  // Company categories
  rider_suspension_request: "Rider Suspension Req.",
  rider_removal_request: "Rider Removal Req.",
  payment_dispute: "Payment Dispute",
  account_issue: "Account Issue",
};

const CATEGORY_COLORS = {
  payment_failed: "bg-red-100 text-red-700",
  order_issue: "bg-orange-100 text-orange-700",
  refund_request: "bg-purple-100 text-purple-700",
  app_error: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600",
  customer_issue: "bg-yellow-100 text-yellow-700",
  sender_unreachable: "bg-orange-100 text-orange-700",
  receiver_unreachable: "bg-orange-100 text-orange-700",
  payment_dispute_sender: "bg-red-100 text-red-700",
  payment_dispute_receiver: "bg-red-100 text-red-700",
  payment_not_confirmed: "bg-pink-100 text-pink-700",
  // Company categories
  rider_suspension_request: "bg-red-100 text-red-700",
  rider_removal_request: "bg-red-100 text-red-700",
  payment_dispute: "bg-purple-100 text-purple-700",
  account_issue: "bg-blue-100 text-blue-700",
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtShort(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function SupportTickets() {
  const { admin, loading: authLoading } = useAdmin();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Detail modal
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Admin tools
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");

  // Complainant info (user, rider, or company)
  const [ticketUserInfo, setTicketUserInfo] = useState(null);
  const [ticketRiderInfo, setTicketRiderInfo] = useState(null);
  const [ticketCompanyInfo, setTicketCompanyInfo] = useState(null);

  // History
  const [prevTickets, setPrevTickets] = useState([]);
  const [prevMsgMap, setPrevMsgMap] = useState({});
  const [expandedPrev, setExpandedPrev] = useState(null);

  // Linked order (fetched to get customer info for rider tickets)
  const [ticketOrderDetail, setTicketOrderDetail] = useState(null);

  const messagesEndRef = useRef(null);

  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && admin) fetchTickets();
  }, [admin, statusFilter, categoryFilter, sourceFilter, page]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    setFetchError(null);
    const result = await getSupportTickets({
      status: statusFilter,
      category: categoryFilter,
      source: sourceFilter,
      page,
      limit: LIMIT,
    });
    if (result.success) {
      setTickets(result.data);
      setTotal(result.total);
    } else {
      console.error("[SupportTickets] fetchTickets error:", result.error);
      setFetchError(result.error);
    }
    setLoading(false);
  };

  const openTicket = async (ticket) => {
    const result = await getSupportTicket(ticket.id);
    if (!result.success) return;
    setSelected(result.data);
    setAdminNotes(result.data.admin_notes || "");
    setReplyText("");
    setCreditAmount("");
    setCreditDesc("");
    setPrevTickets([]);
    setPrevMsgMap({});
    setExpandedPrev(null);
    setTicketUserInfo(null);
    setTicketRiderInfo(null);
    setTicketCompanyInfo(null);
    setTicketOrderDetail(null);

    const isRiderTicket = result.data.ticket_source === "rider";
    const isCompanyTicket = result.data.ticket_source === "company";

    // Determine info and history fetchers based on ticket source
    let infoFetcher = Promise.resolve({ success: false });
    let histFetcher = Promise.resolve({ success: false });

    if (isRiderTicket && result.data.rider_id) {
      infoFetcher = getAppRiderBasicInfo(result.data.rider_id);
      histFetcher = getRiderPreviousTickets(result.data.rider_id, ticket.id);
    } else if (isCompanyTicket && result.data.company_id) {
      infoFetcher = getCompanyBasicInfo(result.data.company_id);
      histFetcher = getCompanyPreviousTickets(result.data.company_id, ticket.id);
    } else if (!isRiderTicket && !isCompanyTicket && result.data.user_id) {
      infoFetcher = getAppUserBasicInfo(result.data.user_id);
      histFetcher = getUserPreviousTickets(result.data.user_id, ticket.id);
    }

    // Load messages + submitter info + order detail in parallel
    setLoadingMessages(true);
    const [msgResult, infoResult, histResult, orderResult] = await Promise.all([
      getTicketMessages(ticket.id),
      infoFetcher,
      histFetcher,
      result.data.related_order_id
        ? getOrderDetail(result.data.related_order_id)
        : Promise.resolve({ success: false }),
    ]);

    setMessages(msgResult.success ? msgResult.data : []);
    setLoadingMessages(false);

    if (infoResult.success) {
      if (isRiderTicket) setTicketRiderInfo(infoResult.data);
      else if (isCompanyTicket) setTicketCompanyInfo(infoResult.data);
      else setTicketUserInfo(infoResult.data);
    }
    if (histResult.success) setPrevTickets(histResult.data);
    if (orderResult.success) setTicketOrderDetail(orderResult.data);
  };

  const handleSendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSendingReply(true);
    const result = await sendAdminMessage(selected.id, admin?.username, replyText.trim());
    setSendingReply(false);
    if (result.success) {
      setReplyText("");
      const msgResult = await getTicketMessages(selected.id);
      setMessages(msgResult.success ? msgResult.data : []);
      setSelected((s) => ({
        ...s,
        status: s.status === "open" || s.status === "closed" ? "in_progress" : s.status,
      }));
      fetchTickets();
    } else {
      alert("Error sending reply: " + result.error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setActionLoading(true);
    await updateSupportTicket(selected.id, { adminNotes, resolvedBy: admin?.username });
    setActionLoading(false);
  };

  const handleResolve = async () => {
    if (!selected) return;
    setActionLoading(true);
    const result = await updateSupportTicket(selected.id, {
      status: "resolved",
      adminNotes,
      resolvedBy: admin?.username,
    });
    if (result.success) { setSelected(null); fetchTickets(); }
    else alert("Error: " + result.error);
    setActionLoading(false);
  };

  const handleCreditWallet = async () => {
    if (!selected || !creditAmount) return;
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) { alert("Enter a valid amount."); return; }
    setActionLoading(true);
    const result = await creditUserWallet({
      userId: selected.user_id,
      amount,
      description: creditDesc || `Support resolution for ticket ${selected.ticket_number}`,
      adminUsername: admin?.username,
      ticketId: selected.id,
      failedPaymentId: selected.failed_payment_id,
    });
    if (result.success) {
      alert(`Wallet credited ₦${amount.toLocaleString()} and ticket resolved.`);
      setSelected(null);
      fetchTickets();
    } else {
      alert("Error: " + result.error);
    }
    setActionLoading(false);
  };

  const handleTogglePrevMessages = async (ticketId) => {
    if (expandedPrev === ticketId) { setExpandedPrev(null); return; }
    setExpandedPrev(ticketId);
    if (!prevMsgMap[ticketId]) {
      const result = await getTicketMessages(ticketId);
      if (result.success) setPrevMsgMap((m) => ({ ...m, [ticketId]: result.data }));
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500 mt-1">
          Manage user and rider-reported issues. Reply, resolve, or credit wallets directly.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Source filter */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Source:</span>
          {[
            { value: "all", label: "All" },
            { value: "user", label: "👤 Users" },
            { value: "rider", label: "🛵 Riders" },
            { value: "company", label: "🏢 Companies" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setSourceFilter(value); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                sourceFilter === value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Status:</span>
          {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Category:</span>
          {["all", "payment_failed", "order_issue", "refund_request", "app_error",
            "sender_unreachable", "receiver_unreachable", "payment_dispute_sender",
            "payment_dispute_receiver", "payment_not_confirmed", "customer_issue"].map((c) => (
            <button
              key={c}
              onClick={() => { setCategoryFilter(c); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                categoryFilter === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c === "all" ? "All" : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-500">{total} tickets</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 font-semibold mb-1">Failed to load tickets</p>
            <p className="text-sm text-red-400 font-mono bg-red-50 rounded p-3 text-left break-all">{fetchError}</p>
            <button
              onClick={fetchTickets}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No tickets found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Ticket #", "Source", "Submitter", "Subject", "Category", "Status", "Date", "Reply", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600">{t.ticket_number}</td>
                  <td className="px-4 py-3">
                    {t.ticket_source === "rider" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">🛵 Rider</span>
                    ) : t.ticket_source === "company" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">🏢 Company</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">👤 User</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {t.ticket_source === "rider" ? (
                      <>
                        <span className="font-medium">{t.rider_id || "—"}</span>
                        {t.rider_id && <span className="block text-xs text-gray-400 font-mono">{t.rider_id}</span>}
                      </>
                    ) : t.ticket_source === "company" ? (
                      <>
                        <span className="font-medium">{t.company_name || "—"}</span>
                        {t.company_id && <span className="block text-xs text-gray-400 font-mono">{t.company_id.slice(0, 8)}…</span>}
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{t.user_full_name || t.user_id || "—"}</span>
                        {t.user_id && <span className="block text-xs text-gray-400 font-mono">{t.user_id}</span>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate font-medium">{t.subject}</td>
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
                      <span className="text-xs text-amber-500 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openTicket(t)} className="text-blue-600 text-sm font-medium hover:underline">
                      Open
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
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
            Next
          </button>
        </div>
      )}

      {/* ── Ticket Detail Modal ──────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl flex flex-col"
            style={{ maxHeight: "92vh" }}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900">{selected.ticket_number}</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[selected.status]}`}>
                    {selected.status === "in_progress" ? "In Progress" : selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[selected.category]}`}>
                    {CATEGORY_LABELS[selected.category]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-700 mt-1 truncate">{selected.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="font-mono">
                    {selected.ticket_source === "rider"
                      ? selected.rider_id
                      : selected.ticket_source === "company"
                      ? (selected.company_name || selected.company_id?.slice(0, 8))
                      : selected.user_id}
                  </span> · {fmt(selected.created_at)}
                  {selected.ticket_source === "rider" && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">🛵 Rider Ticket</span>
                  )}
                  {selected.ticket_source === "company" && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">🏢 Company Ticket</span>
                  )}
                </p>
                {/* Rider Info Card */}
                {ticketRiderInfo && (
                  <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-indigo-400 font-medium">Name</span>
                      <p className="text-gray-800 font-semibold">{ticketRiderInfo.full_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Phone</span>
                      <p className="text-gray-800 font-semibold">{ticketRiderInfo.phone || "—"}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Email</span>
                      <p className="text-gray-800">{ticketRiderInfo.email || "—"}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Vehicle</span>
                      <p className="text-gray-800 capitalize">{ticketRiderInfo.vehicle_type || "—"}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Status</span>
                      <p className="text-gray-800 capitalize">{ticketRiderInfo.status || "—"}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Total deliveries</span>
                      <p className="text-gray-800 font-semibold">{ticketRiderInfo.total_deliveries ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Rating</span>
                      <p className="text-gray-800 font-semibold">
                        {ticketRiderInfo.average_rating > 0
                          ? `${Number(ticketRiderInfo.average_rating).toFixed(1)} ★ (${ticketRiderInfo.total_ratings})`
                          : "No ratings yet"}
                      </p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Wallet</span>
                      <p className="text-gray-800 font-semibold">₦{(ticketRiderInfo.wallet_balance ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-medium">Member since</span>
                      <p className="text-gray-800">{ticketRiderInfo.created_at ? fmtShort(ticketRiderInfo.created_at) : "—"}</p>
                    </div>
                    {selected.related_order_id && (
                      <div>
                        <span className="text-indigo-400 font-medium">Linked order</span>
                        <p className="text-gray-800 font-mono font-semibold text-indigo-600">{selected.related_order_id.slice(0, 8)}…</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Company Info Card */}
                {ticketCompanyInfo && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-emerald-500 font-medium">Company</span>
                      <p className="text-gray-800 font-semibold">{ticketCompanyInfo.company_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">Contact Person</span>
                      <p className="text-gray-800 font-semibold">{ticketCompanyInfo.contact_person_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">Email</span>
                      <p className="text-gray-800">{ticketCompanyInfo.email || "—"}</p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">Phone</span>
                      <p className="text-gray-800 font-semibold">{ticketCompanyInfo.phone || "—"}</p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">Company ID</span>
                      <p className="text-gray-800 font-mono">{ticketCompanyInfo.company_id || "—"}</p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">Registered Riders</span>
                      <p className="text-gray-800 font-semibold">{ticketCompanyInfo.total_riders ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">Account Status</span>
                      <p className={`font-semibold ${ticketCompanyInfo.is_active ? "text-green-700" : "text-red-700"}`}>
                        {ticketCompanyInfo.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">Member since</span>
                      <p className="text-gray-800">{ticketCompanyInfo.created_at ? fmtShort(ticketCompanyInfo.created_at) : "—"}</p>
                    </div>
                  </div>
                )}
                {/* User Info Card */}
                {ticketUserInfo && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Name</span>
                      <p className="text-gray-800 font-semibold">{ticketUserInfo.full_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Phone</span>
                      <p className="text-gray-800 font-semibold">{ticketUserInfo.phone || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Email</span>
                      <p className="text-gray-800">{ticketUserInfo.email || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Account type</span>
                      <p className="text-gray-800 capitalize">{ticketUserInfo.role || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Total orders</span>
                      <p className="text-gray-800 font-semibold">{ticketUserInfo.total_orders ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Wallet balance</span>
                      <p className="text-gray-800 font-semibold">₦{(ticketUserInfo.wallet_balance ?? 0).toLocaleString()}</p>
                    </div>
                    {ticketUserInfo.role === "business" && (
                      <div>
                        <span className="text-gray-400 font-medium">Business rating</span>
                        <p className="text-gray-800 font-semibold">
                          {ticketUserInfo.business_rating > 0
                            ? `${Number(ticketUserInfo.business_rating).toFixed(1)} ★ (${ticketUserInfo.business_total_ratings})`
                            : "No ratings yet"}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 font-medium">Member since</span>
                      <p className="text-gray-800">{ticketUserInfo.created_at ? fmtShort(ticketUserInfo.created_at) : "—"}</p>
                    </div>
                  </div>
                )}
                {selected.attachment_urls?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selected.attachment_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt={`attachment ${i + 1}`}
                          className="w-20 h-14 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none ml-4 shrink-0"
              >
                ×
              </button>
            </div>

            {/* Quick Navigation Links */}
            {(selected.related_order_id || selected.user_id || selected.rider_id || selected.company_id) && (
              <div className="px-5 py-2.5 border-b border-gray-100 flex flex-wrap gap-2 shrink-0">
                {selected.company_id && (
                  <button
                    onClick={() => window.open(`/admindashboard/companies?open=${selected.company_id}`, "_blank")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    🏢 View Company ↗
                  </button>
                )}
                {selected.related_order_id && (
                  <button
                    onClick={() => window.open(`/admindashboard/orders?open=${selected.related_order_id}`, "_blank")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    📦 View Order ↗
                  </button>
                )}
                {selected.user_id && selected.ticket_source !== "rider" && (
                  <button
                    onClick={() => window.open(`/admindashboard/app-users?open=${selected.user_id}`, "_blank")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    👤 View User ↗
                  </button>
                )}
                {selected.rider_id && (
                  <button
                    onClick={() => window.open(`/admindashboard/riders?open=${selected.rider_id}`, "_blank")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    🛵 View Rider ↗
                  </button>
                )}
                {selected.ticket_source === "rider" && ticketOrderDetail?.user && (
                  <button
                    onClick={() => window.open(`/admindashboard/app-users?open=${ticketOrderDetail.user.user_id}`, "_blank")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    👤 View Customer ↗
                  </button>
                )}
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-md rounded-2xl px-4 py-3 ${
                        msg.sender_type === "user"
                          ? "bg-gray-100 rounded-tl-sm"
                          : "bg-blue-600 text-white rounded-tr-sm"
                      }`}
                    >
                      {msg.sender_type === "admin" && (
                        <p className="text-xs font-semibold text-blue-200 mb-1.5">
                          🎧 Support ({msg.sender_id})
                        </p>
                      )}
                      {msg.sender_type === "user" && (
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">
                          {selected.ticket_source === "rider" ? "🛵" : selected.ticket_source === "company" ? "🏢" : "👤"}{" "}
                          {selected.ticket_source === "rider"
                            ? (ticketRiderInfo?.full_name || selected.rider_id)
                            : selected.ticket_source === "company"
                            ? (ticketCompanyInfo?.company_name || selected.company_name || "Company")
                            : (ticketUserInfo?.full_name || selected.user_id)}
                        </p>
                      )}
                      {msg.message && (
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.sender_type === "user" ? "text-gray-800" : "text-white"}`}>
                          {msg.message}
                        </p>
                      )}
                      {msg.image_urls?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.image_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt="attachment"
                                className="w-28 h-20 object-cover rounded-lg border border-white/20 hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className={`text-xs mt-1.5 ${msg.sender_type === "user" ? "text-gray-400 text-left" : "text-blue-200 text-right"}`}>
                        {fmt(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            {selected.status !== "resolved" && selected.status !== "closed" && (
              <div className="px-5 pb-3 pt-2 border-t border-gray-100 shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply();
                    }}
                    rows={2}
                    placeholder="Type your reply… (Ctrl+Enter to send)"
                    className="flex-1 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    {sendingReply ? "Sending…" : "Send ↑"}
                  </button>
                </div>
              </div>
            )}

            {/* Admin Tools */}
            <div className="border-t border-gray-100 px-5 py-3 space-y-2 shrink-0">
              {/* Internal Notes */}
              <details className="group">
                <summary className="text-xs text-gray-500 font-semibold uppercase cursor-pointer select-none list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block text-gray-400">▶</span>
                  Internal Notes (not shown to user)
                </summary>
                <div className="mt-2 flex gap-2">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Internal notes for the team…"
                    className="flex-1 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={actionLoading}
                    className="border border-gray-200 text-gray-600 rounded-xl px-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </details>

              {/* Credit Wallet — only for user tickets */}
              {selected.user_id && selected.ticket_source !== "rider" && (
                <details className="group">
                  <summary className="text-xs text-blue-600 font-semibold uppercase cursor-pointer select-none list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block text-blue-400">▶</span>
                    Credit User Wallet
                  </summary>
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                    <p className="text-xs text-blue-700">Adds balance to user wallet and auto-resolves this ticket.</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="Amount (₦)"
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={creditDesc}
                        onChange={(e) => setCreditDesc(e.target.value)}
                        placeholder="Reason for credit"
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleCreditWallet}
                      disabled={actionLoading || !creditAmount}
                      className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Processing…" : "Credit Wallet & Resolve"}
                    </button>
                  </div>
                </details>
              )}

              {/* Submitter History */}
              {prevTickets.length > 0 && (
                <details className="group">
                  <summary className="text-xs text-gray-500 font-semibold uppercase cursor-pointer select-none list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block text-gray-400">▶</span>
                    {selected.ticket_source === "rider" ? "Rider" : selected.ticket_source === "company" ? "Company" : "User"} History — {prevTickets.length} previous ticket{prevTickets.length !== 1 ? "s" : ""}
                  </summary>
                  <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                    {prevTickets.map((t) => (
                      <div key={t.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600">{t.ticket_number}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[t.status]}`}>
                              {t.status === "in_progress" ? "In Progress" : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{fmtShort(t.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 font-medium">{t.subject}</p>
                        <button
                          onClick={() => handleTogglePrevMessages(t.id)}
                          className="text-xs text-blue-500 hover:underline mt-1"
                        >
                          {expandedPrev === t.id ? "Hide conversation ▲" : "View conversation ▶"}
                        </button>
                        {expandedPrev === t.id && (
                          <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 space-y-2 max-h-44 overflow-y-auto">
                            {!prevMsgMap[t.id] ? (
                              <p className="text-xs text-gray-400">Loading…</p>
                            ) : prevMsgMap[t.id].length === 0 ? (
                              <p className="text-xs text-gray-400">No messages in this ticket.</p>
                            ) : (
                              prevMsgMap[t.id].map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-xs rounded-xl px-3 py-2 text-xs ${
                                      msg.sender_type === "admin"
                                        ? "bg-blue-100 text-blue-900"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    <p className="font-semibold mb-0.5 text-xs">
                                      {msg.sender_type === "admin" ? `Support (${msg.sender_id})` : "User"}
                                    </p>
                                    {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}
                                    {msg.image_urls?.length > 0 && (
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {msg.image_urls.map((url, i) => (
                                          <a key={i} href={url} target="_blank" rel="noreferrer">
                                            <img src={url} alt="" className="w-14 h-10 object-cover rounded hover:opacity-80" />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-gray-400 mt-0.5">{fmt(msg.created_at)}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
              {selected.status !== "resolved" && selected.status !== "closed" ? (
                <button
                  onClick={handleResolve}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
                >
                  {actionLoading ? "Saving…" : "✓ Mark Resolved"}
                </button>
              ) : (
                <div className="flex-1 text-center text-sm text-gray-400 py-2.5">
                  Ticket is {selected.status}
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-5 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
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
