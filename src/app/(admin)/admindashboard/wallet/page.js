// Path: app/(admin)/admindashboard/wallet/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWalletOverview,
  getRiderWallets,
  getCompanyWallets,
  getUserWallets,
} from "@/lib/server-actions/finance/walletOverview";

function fmt(n) {
  return `₦${Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function SummaryCard({ label, value, sub, color = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
      />
    </div>
  );
}

function Pagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
      >
        Prev
      </button>
      <span className="text-xs text-gray-500">{page} / {totalPages}</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}

// ── Rider Wallets Table ───────────────────────────────────────────────────────

function RiderWalletsTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getRiderWallets({ page, search, limit: LIMIT });
    if (res.success) { setData(res.riders); setTotal(res.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Rider Wallets</h3>
          <p className="text-xs text-gray-400 mt-0.5">{total} riders</p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search riders…" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <div className="flex justify-center py-10 text-gray-400 text-sm">No riders found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Rider", "Phone", "Company", "Wallet Balance", "Total Earned", "Total Withdrawn"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-900">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.company_id ? "Company" : "Independent"}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(r.wallet_balance)}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(r.total_earned)}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(r.total_withdrawn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="px-4 pb-4">
          <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
        </div>
      )}
    </div>
  );
}

// ── Company Wallets Table ─────────────────────────────────────────────────────

function CompanyWalletsTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyWallets().then((res) => {
      if (res.success) setData(res.companies);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Company Wallets</h3>
        <p className="text-xs text-gray-400 mt-0.5">{data.length} companies</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <div className="flex justify-center py-10 text-gray-400 text-sm">No company wallets yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Company", "Contact", "Balance", "Total Earned", "Total Withdrawn"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((c) => (
                <tr key={c.company_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.companies?.company_name || "—"}</p>
                    <p className="text-xs text-gray-400">{c.companies?.company_id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.companies?.email || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(c.balance)}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(c.total_earned)}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(c.total_withdrawn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── User Wallets Table ────────────────────────────────────────────────────────

function UserWalletsTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getUserWallets({ page, search, limit: LIMIT });
    if (res.success) { setData(res.users); setTotal(res.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">User Wallets</h3>
          <p className="text-xs text-gray-400 mt-0.5">{total} users with balance</p>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <div className="flex justify-center py-10 text-gray-400 text-sm">No users with wallet balance</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User", "Phone", "Wallet Balance"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((u) => (
                <tr key={u.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.full_name || "—"}</p>
                    <p className="text-xs text-gray-400">{u.user_id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.phone || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{fmt(u.wallet_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="px-4 pb-4">
          <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WalletOverviewPage() {
  const [totals, setTotals] = useState(null);
  const [loadingTotals, setLoadingTotals] = useState(true);

  useEffect(() => {
    getWalletOverview().then((res) => {
      if (res.success) setTotals(res.totals);
      setLoadingTotals(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">All wallet balances across riders, companies, and users</p>
      </div>

      {/* Summary Cards */}
      {loadingTotals ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total in System" value={fmt(totals?.grand)} color="text-blue-600" />
          <SummaryCard label="Rider Wallets" value={fmt(totals?.riders)} color="text-emerald-600" />
          <SummaryCard label="Company Wallets" value={fmt(totals?.companies)} color="text-violet-600" />
          <SummaryCard label="User Wallets" value={fmt(totals?.users)} color="text-amber-600" />
        </div>
      )}

      {/* Tables */}
      <RiderWalletsTable />
      <CompanyWalletsTable />
      <UserWalletsTable />
    </div>
  );
}
