// Path: app/(admin)/admindashboard/wallet/withdrawals/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalStats,
  getPlatformSettings,
  updatePlatformSettings,
} from "@/lib/server-actions/finance/manageWithdrawals";

const STATUS_COLORS = {
  pending:    "bg-amber-100 text-amber-800",
  approved:   "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  completed:  "bg-green-100 text-green-800",
  rejected:   "bg-red-100 text-red-800",
  failed:     "bg-red-100 text-red-800",
};

function fmt(n) {
  return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function StatCard({ label, value, sub, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Approval / Rejection modal ─────────────────────────────────────────────────

function ActionModal({ wr, action, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setLoading(true);
    setErr("");
    const res = action === "approve"
      ? await approveWithdrawal(wr.id, note)
      : await rejectWithdrawal(wr.id, note);
    setLoading(false);
    if (!res.success) { setErr(res.error); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-lg">
            {action === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">ID: {wr.id.slice(0, 8)}…</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Requester</span>
              <span className="font-medium">{wr.requester_name || "—"} ({wr.requester_type})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-gray-900">{fmt(wr.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bank</span>
              <span className="font-medium">{wr.bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account</span>
              <span className="font-medium">{wr.account_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{wr.account_name}</span>
            </div>
          </div>

          {action === "approve" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              This marks the withdrawal as approved. Process the bank transfer of {fmt(wr.amount)} manually to the account above.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Internal note..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
              action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Processing…" : action === "approve" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Platform settings panel ───────────────────────────────────────────────────

function PlatformSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getPlatformSettings().then((r) => {
      if (r.success) {
        setSettings(r.settings);
        setForm({
          platformFeePercentage: r.settings.platform_fee_percentage,
          minRiderWithdrawal: r.settings.min_rider_withdrawal,
          minCompanyWithdrawal: r.settings.min_company_withdrawal,
          maxWeeklyWithdrawals: r.settings.max_weekly_withdrawals ?? 2,
        });
      }
    });
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    const parsed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, parseFloat(v) || 0])
    );
    const res = await updatePlatformSettings(parsed);
    setSaving(false);
    setMsg(res.success ? "Settings saved." : res.error);
  }

  if (!settings) return <div className="text-sm text-gray-400 p-4">Loading…</div>;

  const field = (label, key, opts = {}) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        value={form[key] ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...opts}
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Platform Settings</h3>
      <div className="grid grid-cols-2 gap-4">
        {field("Platform Fee %", "platformFeePercentage", { min: 0, max: 50, step: 0.5 })}
        {field("Max Weekly Withdrawals", "maxWeeklyWithdrawals", { min: 1, max: 7, step: 1 })}
        {field("Min Rider Withdrawal (₦)", "minRiderWithdrawal", { min: 1000, step: 500 })}
        {field("Min Company Withdrawal (₦)", "minCompanyWithdrawal", { min: 1000, step: 500 })}
      </div>
      {msg && <p className={`text-sm mt-3 ${msg === "Settings saved." ? "text-green-600" : "text-red-600"}`}>{msg}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState(null); // { wr, action }
  const [tab, setTab] = useState("requests"); // 'requests' | 'settings'

  const load = useCallback(async () => {
    setLoading(true);
    const [wRes, sRes] = await Promise.all([
      fetchWithdrawals({ status: statusFilter, type: typeFilter }),
      getWithdrawalStats(),
    ]);
    if (wRes.success) setWithdrawals(wRes.withdrawals);
    if (sRes.success) setStats(sRes.stats);
    setLoading(false);
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage rider and company withdrawal requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("requests")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "requests" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            Requests
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "settings" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Pending" value={stats.pending} sub={fmt(stats.pending_amount)} color="text-amber-600" />
          <StatCard label="Approved" value={stats.approved} sub={fmt(stats.approved_amount)} color="text-blue-600" />
          <StatCard label="Completed" value={stats.completed} sub={fmt(stats.completed_amount)} color="text-green-600" />
          <StatCard label="Rejected / Failed" value={stats.rejected + stats.failed} color="text-red-600" />
        </div>
      )}

      {tab === "settings" ? (
        <PlatformSettingsPanel />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 sm:items-center">
            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
              {["pending", "approved", "completed", "rejected", "failed", "all"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    statusFilter === s ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              {["all", "rider", "company"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    typeFilter === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={load} className="sm:ml-auto text-xs text-blue-600 hover:underline">Refresh</button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
            ) : withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-sm">No withdrawal requests found</p>
              </div>
            ) : (
              <>
                {/* ── Mobile card list ── */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {withdrawals.map((wr) => (
                    <div key={wr.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{wr.requester_name || "—"}</p>
                          <p className="text-xs text-gray-400">{wr.requester_ref}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${STATUS_COLORS[wr.status] || "bg-gray-100 text-gray-600"}`}>
                          {wr.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-base font-bold text-gray-900">{fmt(wr.amount)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wr.requester_type === "rider" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                          {wr.requester_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{wr.bank_name} · {wr.account_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(wr.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                      {wr.failure_reason && <p className="text-xs text-red-500 mt-1">{wr.failure_reason}</p>}
                      {wr.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setModal({ wr, action: "approve" })} className="flex-1 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium">Approve</button>
                          <button onClick={() => setModal({ wr, action: "reject" })} className="flex-1 py-2 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 font-medium border border-red-200">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Desktop table ── */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Requester", "Type", "Amount", "Bank Details", "Status", "Requested", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {withdrawals.map((wr) => (
                        <tr key={wr.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{wr.requester_name || "—"}</p>
                            <p className="text-xs text-gray-400">{wr.requester_ref}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${wr.requester_type === "rider" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                              {wr.requester_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{fmt(wr.amount)}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{wr.bank_name}</p>
                            <p className="text-xs text-gray-500">{wr.account_number}</p>
                            <p className="text-xs text-gray-400">{wr.account_name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[wr.status] || "bg-gray-100 text-gray-600"}`}>
                              {wr.status}
                            </span>
                            {wr.failure_reason && (
                              <p className="text-xs text-red-500 mt-0.5 max-w-[140px]" title={wr.failure_reason}>
                                {wr.failure_reason.slice(0, 40)}…
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(wr.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                            <br />
                            {new Date(wr.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {wr.status === "pending" && (
                                <>
                                  <button onClick={() => setModal({ wr, action: "approve" })} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium">Approve</button>
                                  <button onClick={() => setModal({ wr, action: "reject" })} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 font-medium border border-red-200">Reject</button>
                                </>
                              )}
                              {wr.status === "approved" && (
                                <span className="text-xs text-blue-600 font-medium">Awaiting transfer</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {modal && (
        <ActionModal
          wr={modal.wr}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
