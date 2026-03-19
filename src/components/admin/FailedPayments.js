"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import {
  getFailedPayments,
  updateFailedPaymentStatus,
  creditUserWallet,
} from "@/lib/server-actions/admin/manageSupport";

const STATUS_COLORS = {
  unresolved: "bg-red-100 text-red-700",
  investigating: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
};

const TYPE_LABELS = {
  flutterwave_prepaid: "FW Prepaid",
  promo_only: "Promo Only",
  cod_order_creation: "COD Order",
  cod_collection: "COD Collection",
};

export default function FailedPayments() {
  const { admin, loading: authLoading } = useAdmin();
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [showCreditForm, setShowCreditForm] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && admin) fetchPayments();
  }, [admin, statusFilter, page]);

  const fetchPayments = async () => {
    setLoading(true);
    const result = await getFailedPayments({ status: statusFilter, page, limit: LIMIT });
    if (result.success) {
      setPayments(result.data);
      setTotal(result.total);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (status) => {
    if (!selected) return;
    setActionLoading(true);
    const result = await updateFailedPaymentStatus(selected.id, {
      status,
      notes,
      resolvedBy: admin?.username,
    });
    if (result.success) {
      setSelected(null);
      setNotes("");
      fetchPayments();
    } else {
      alert("Error: " + result.error);
    }
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
      description: creditDesc || `Compensation for failed payment (${selected.tx_ref || selected.id})`,
      adminUsername: admin?.username,
      failedPaymentId: selected.id,
    });
    if (result.success) {
      alert(`Wallet credited ₦${amount.toLocaleString()} successfully.`);
      setSelected(null);
      setCreditAmount("");
      setCreditDesc("");
      setShowCreditForm(false);
      fetchPayments();
    } else {
      alert("Error: " + result.error);
    }
    setActionLoading(false);
  };

  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Failed Payments</h1>
        <p className="text-gray-500 mt-1">
          Review payment failures and manually credit user wallets where needed.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["unresolved", "investigating", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`bg-white border rounded-xl p-4 text-left hover:border-blue-400 transition-colors ${statusFilter === s ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"}`}
          >
            <p className="text-sm text-gray-500 capitalize">{s}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">—</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex gap-3 items-center">
        <span className="text-sm text-gray-600 font-medium">Filter:</span>
        {["all", "unresolved", "investigating", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No failed payments found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Date", "User ID", "Type", "Amount", "Tx Ref", "Error", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmt(p.created_at)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.user_id || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      {TYPE_LABELS[p.payment_type] || p.payment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {p.amount ? `₦${Number(p.amount).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{p.tx_ref || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{p.error_message}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelected(p); setNotes(p.notes || ""); setShowCreditForm(false); }}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      Review
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

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Failed Payment Review</h2>
                <p className="text-sm text-gray-500 mt-0.5">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["User ID", selected.user_id],
                  ["Payment Type", TYPE_LABELS[selected.payment_type] || selected.payment_type],
                  ["Amount", selected.amount ? `₦${Number(selected.amount).toLocaleString()}` : "—"],
                  ["Transaction Ref", selected.tx_ref || "—"],
                  ["Status", selected.status],
                  ["Created", fmt(selected.created_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-gray-400 text-xs font-medium uppercase">{label}</p>
                    <p className="text-gray-800 font-medium mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Error Message</p>
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{selected.error_message}</p>
              </div>

              {selected.context && Object.keys(selected.context).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-medium mb-1">Context</p>
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto">
                    {JSON.stringify(selected.context, null, 2)}
                  </pre>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Add notes for the team..."
                />
              </div>

              {/* Credit Wallet Toggle */}
              {selected.user_id && (
                <div>
                  <button
                    onClick={() => setShowCreditForm(!showCreditForm)}
                    className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    {showCreditForm ? "▾ Hide" : "▸ Credit User Wallet"}
                  </button>
                  {showCreditForm && (
                    <div className="mt-3 bg-blue-50 rounded-xl p-4 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Amount (₦)</label>
                        <input
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                        <input
                          type="text"
                          value={creditDesc}
                          onChange={(e) => setCreditDesc(e.target.value)}
                          placeholder="Reason for credit"
                          className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={handleCreditWallet}
                        disabled={actionLoading}
                        className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading ? "Processing..." : "Credit Wallet & Resolve"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => handleStatusUpdate("investigating")}
                disabled={actionLoading || selected.status === "investigating"}
                className="flex-1 border border-yellow-400 text-yellow-700 rounded-lg py-2.5 text-sm font-medium hover:bg-yellow-50 disabled:opacity-40"
              >
                Mark Investigating
              </button>
              <button
                onClick={() => handleStatusUpdate("resolved")}
                disabled={actionLoading || selected.status === "resolved"}
                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-40"
              >
                {actionLoading ? "Saving..." : "Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
