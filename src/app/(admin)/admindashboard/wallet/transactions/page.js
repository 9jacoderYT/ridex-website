// Path: app/(admin)/admindashboard/wallet/transactions/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTransactionSummary,
  getPaymentTransactions,
  getWalletTransactions,
  getPromoTransactions,
  getCodLedger,
  getWithdrawalTransactions,
} from "@/lib/server-actions/finance/getTransactions";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n) {
  return `₦${Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const WALLET_SOURCE_LABELS = {
  refund_no_rider: "Refund – No Rider",
  refund_cancelled: "Refund – Cancelled",
  top_up: "Wallet Top-Up",
  order_payment: "Order Payment",
  admin_credit: "Admin Credit",
};

const PROMO_SOURCE_LABELS = {
  referral_bonus: "Referral Bonus",
  welcome_bonus: "Welcome Bonus",
  order_discount: "Order Discount",
  admin_credit: "Admin Credit",
  promo_refund: "Promo Refund",
};

const WITHDRAWAL_STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

// ── Shared components ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ label, className }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function Pagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-4">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
        Prev
      </button>
      <span className="text-xs text-gray-500">{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
        Next
      </button>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
    </div>
  );
}

function TableShell({ loading, empty, total, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs text-gray-400">{total.toLocaleString()} records</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12 text-gray-400 text-sm">Loading…</div>
      ) : empty ? (
        <div className="flex justify-center py-12 text-gray-400 text-sm">No records found</div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

// ── Tab 1: Payments (orders) ───────────────────────────────────────────────────

function PaymentsTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const res = await getPaymentTransactions({ page, search, method, limit: LIMIT });
    if (res.success) { setRows(res.transactions); setTotal(res.total); }
    else setError(res.error || "Failed to load");
    setLoading(false);
  }, [page, search, method]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, method]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tracking #, name, phone, tx ref…" />
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Methods</option>
          <option value="flutterwave">Flutterwave</option>
          <option value="wallet">Wallet</option>
          <option value="cod">COD (Rider Collected)</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <TableShell loading={loading} empty={rows.length === 0} total={total}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "Tracking #", "Sender", "Rider", "Method", "Amount", "Tx Ref"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(tx => {
              const isCod = tx.payment_type === "pay_on_delivery";
              const amount = isCod ? Number(tx.cod_amount ?? 0) : Number(tx.amount_paid ?? 0);
              const methodLabel = isCod ? "COD" : tx.payment_method === "flutterwave" ? "Flutterwave" : tx.payment_method === "wallet" ? "Wallet" : tx.payment_method || "—";
              const methodColor = isCod ? "bg-amber-100 text-amber-700" : tx.payment_method === "flutterwave" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";
              return (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(isCod ? tx.cod_collected_at : tx.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{tx.tracking_number || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{tx.sender_name || "—"}</p>
                    <p className="text-xs text-gray-400">{tx.sender_phone || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{tx.rider_id || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={methodLabel} className={methodColor} />
                    {isCod && tx.cod_payer && <p className="text-xs text-gray-400 mt-0.5">Paid by: {tx.cod_payer}</p>}
                    {tx.promo_discount > 0 && <p className="text-xs text-emerald-600 mt-0.5">Promo: -{fmt(tx.promo_discount)}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(amount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{tx.flutterwave_tx_ref || (isCod ? "COD" : "—")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 pb-4"><Pagination page={page} total={total} limit={LIMIT} onPage={setPage} /></div>
      </TableShell>
    </div>
  );
}

// ── Tab 2: Wallet Transactions ─────────────────────────────────────────────────

function WalletTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const res = await getWalletTransactions({ page, search, type, source, limit: LIMIT });
    if (res.success) { setRows(res.transactions); setTotal(res.total); }
    else setError(res.error || "Failed to load");
    setLoading(false);
  }, [page, search, type, source]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, type, source]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="User ID, description, reference…" />
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Sources</option>
          <option value="top_up">Wallet Top-Up</option>
          <option value="order_payment">Order Payment</option>
          <option value="refund_no_rider">Refund – No Rider</option>
          <option value="refund_cancelled">Refund – Cancelled</option>
          <option value="admin_credit">Admin Credit</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <TableShell loading={loading} empty={rows.length === 0} total={total}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "User", "Type", "Source", "Amount", "Description", "Reference"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-900">{tx.user?.full_name || "—"}</p>
                  <p className="text-xs text-gray-400">{tx.user_id}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={tx.type === "credit" ? "+ Credit" : "− Debit"}
                    className={tx.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{WALLET_SOURCE_LABELS[tx.source] || tx.source || "—"}</td>
                <td className={`px-4 py-3 font-semibold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                  {tx.type === "credit" ? "+" : "−"}{fmt(Math.abs(tx.amount))}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{tx.description || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{tx.reference_id || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 pb-4"><Pagination page={page} total={total} limit={LIMIT} onPage={setPage} /></div>
      </TableShell>
    </div>
  );
}

// ── Tab 3: Promo / Referral Transactions ──────────────────────────────────────

function PromoTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const res = await getPromoTransactions({ page, search, type, source, limit: LIMIT });
    if (res.success) { setRows(res.transactions); setTotal(res.total); }
    else setError(res.error || "Failed to load");
    setLoading(false);
  }, [page, search, type, source]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, type, source]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="User ID, description, reference…" />
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Sources</option>
          <option value="referral_bonus">Referral Bonus</option>
          <option value="welcome_bonus">Welcome Bonus</option>
          <option value="order_discount">Order Discount</option>
          <option value="admin_credit">Admin Credit</option>
          <option value="promo_refund">Promo Refund</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <TableShell loading={loading} empty={rows.length === 0} total={total}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "User", "Type", "Source", "Amount", "Description", "Reference"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-900">{tx.user?.full_name || "—"}</p>
                  <p className="text-xs text-gray-400">{tx.user_id}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={tx.type === "credit" ? "+ Credit" : "− Debit"}
                    className={tx.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{PROMO_SOURCE_LABELS[tx.source] || tx.source || "—"}</td>
                <td className={`px-4 py-3 font-semibold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-orange-600"}`}>
                  {tx.type === "credit" ? "+" : "−"}{fmt(Math.abs(tx.amount))}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{tx.description || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{tx.reference_id || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 pb-4"><Pagination page={page} total={total} limit={LIMIT} onPage={setPage} /></div>
      </TableShell>
    </div>
  );
}

// ── Tab 4: COD Ledger ──────────────────────────────────────────────────────────

function CodLedgerTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [remitted, setRemitted] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const res = await getCodLedger({ page, search, remitted, limit: LIMIT });
    if (res.success) { setRows(res.transactions); setTotal(res.total); }
    else setError(res.error || "Failed to load");
    setLoading(false);
  }, [page, search, remitted]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, remitted]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rider ID or Order ID…" />
        <select value={remitted} onChange={(e) => setRemitted(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All</option>
          <option value="true">Remitted to RideX</option>
          <option value="false">Not Yet Remitted</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <TableShell loading={loading} empty={rows.length === 0} total={total}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "Rider", "Order", "Collected", "Rider Share", "Platform Share", "Company Share", "Remitted"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-900">{tx.rider?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{tx.rider?.phone || tx.rider_id}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-gray-700">{tx.orders?.tracking_number || "—"}</p>
                  <p className="text-xs text-gray-400">{tx.orders?.sender_name || ""}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(tx.amount_collected)}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(tx.rider_share)}</td>
                <td className="px-4 py-3 text-blue-600 font-semibold">{fmt(tx.platform_share)}</td>
                <td className="px-4 py-3 text-purple-600">{fmt(tx.company_share)}</td>
                <td className="px-4 py-3">
                  {tx.remitted ? (
                    <Badge label="Remitted" className="bg-emerald-100 text-emerald-700" />
                  ) : (
                    <Badge label="Pending" className="bg-yellow-100 text-yellow-700" />
                  )}
                  {tx.remitted_at && <p className="text-xs text-gray-400 mt-0.5">{fmtDate(tx.remitted_at)}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 pb-4"><Pagination page={page} total={total} limit={LIMIT} onPage={setPage} /></div>
      </TableShell>
    </div>
  );
}

// ── Tab 5: Withdrawals ─────────────────────────────────────────────────────────

function WithdrawalsTab() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [requesterType, setRequesterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const res = await getWithdrawalTransactions({ page, search, status, requesterType, limit: LIMIT });
    if (res.success) { setRows(res.transactions); setTotal(res.total); }
    else setError(res.error || "Failed to load");
    setLoading(false);
  }, [page, search, status, requesterType]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, requesterType]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Account name, number, or tx ref…" />
        <select value={requesterType} onChange={(e) => setRequesterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">Riders & Companies</option>
          <option value="rider">Riders Only</option>
          <option value="company">Companies Only</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <TableShell loading={loading} empty={rows.length === 0} total={total}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "Requester", "Type", "Amount", "Bank", "Status", "Approved By", "Tx Ref"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(tx => {
              const name = tx.requester_type === "rider"
                ? (tx.riders?.name || "—")
                : (tx.companies?.company_name || "—");
              const phone = tx.requester_type === "rider"
                ? (tx.riders?.phone || "")
                : (tx.companies?.email || "");
              return (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={tx.requester_type === "rider" ? "Rider" : "Company"}
                      className={tx.requester_type === "rider" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-red-600">−{fmt(tx.amount)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{tx.bank_name || "—"}</p>
                    <p className="text-xs text-gray-400">{tx.account_number} · {tx.account_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={tx.status}
                      className={WITHDRAWAL_STATUS_STYLES[tx.status] || "bg-gray-100 text-gray-600"}
                    />
                    {tx.failure_reason && <p className="text-xs text-red-500 mt-0.5">{tx.failure_reason}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{tx.approved_by || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{tx.flutterwave_reference || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 pb-4"><Pagination page={page} total={total} limit={LIMIT} onPage={setPage} /></div>
      </TableShell>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: "payments", label: "Payments" },
  { key: "wallet", label: "Wallet Activity" },
  { key: "promo", label: "Promo & Referrals" },
  { key: "cod", label: "COD Ledger" },
  { key: "withdrawals", label: "Withdrawals" },
];

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("payments");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    getTransactionSummary().then((res) => {
      if (res.success) setSummary(res.summary);
      setSummaryLoading(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete financial history — payments, wallet activity, promo credits, COD collections, and withdrawals</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-2 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard label="Prepaid Orders" value={(summary?.prepaidCount ?? 0).toLocaleString()} sub="completed" color="text-emerald-600" />
            <SummaryCard label="COD Collections" value={(summary?.codCount ?? 0).toLocaleString()} sub="by riders" color="text-amber-600" />
            <SummaryCard label="Wallet Credits" value={(summary?.walletCreditCount ?? 0).toLocaleString()} sub="transactions" color="text-blue-600" />
            <SummaryCard label="Wallet Debits" value={(summary?.walletDebitCount ?? 0).toLocaleString()} sub="transactions" color="text-red-500" />
            <SummaryCard label="Promo Credits" value={(summary?.promoCreditCount ?? 0).toLocaleString()} sub="issued" color="text-purple-600" />
            <SummaryCard label="Withdrawals" value={(summary?.withdrawalCount ?? 0).toLocaleString()} sub="completed" color="text-gray-700" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "payments" && <PaymentsTab />}
      {activeTab === "wallet" && <WalletTab />}
      {activeTab === "promo" && <PromoTab />}
      {activeTab === "cod" && <CodLedgerTab />}
      {activeTab === "withdrawals" && <WithdrawalsTab />}
    </div>
  );
}
