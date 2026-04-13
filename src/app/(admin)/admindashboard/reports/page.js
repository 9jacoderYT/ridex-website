// Path: app/(admin)/admindashboard/reports/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getReportData } from "@/lib/server-actions/reports/getReportData";

// PDF button is client-only (react-pdf/renderer doesn't support SSR)
const ReportPDFButton = dynamic(() => import("./ReportPDFButton"), {
  ssr: false,
  loading: () => (
    <button disabled className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-60 cursor-not-allowed">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      Export PDF
    </button>
  ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return `₦${Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
];

function getPeriodDates(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        start: today.toISOString(),
        end: now.toISOString(),
        label: `Today — ${today.toLocaleDateString("en-NG", { dateStyle: "medium" })}`,
      };
    case "week": {
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      return {
        start: monday.toISOString(),
        end: now.toISOString(),
        label: `This Week (${monday.toLocaleDateString("en-NG", { dateStyle: "medium" })} – Now)`,
      };
    }
    case "month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: first.toISOString(),
        end: now.toISOString(),
        label: now.toLocaleDateString("en-NG", { month: "long", year: "numeric" }),
      };
    }
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return {
        start: first.toISOString(),
        end: last.toISOString(),
        label: first.toLocaleDateString("en-NG", { month: "long", year: "numeric" }),
      };
    }
    default:
      return getPeriodDates("month");
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = "gray" }) {
  const colors = {
    gray: "text-gray-900",
    green: "text-emerald-600",
    blue: "text-blue-600",
    violet: "text-violet-600",
    amber: "text-amber-600",
    red: "text-red-500",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
      {title}
    </h2>
  );
}

function OrderStatusRow({ label, count, total, color = "bg-blue-500" }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%`, minWidth: count > 0 ? 4 : 0 }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
      <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-32" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    const { start, end } = getPeriodDates(p);
    const res = await getReportData({ startDate: start, endDate: end });
    if (res.success) {
      setReportData(res.data);
    } else {
      setError(res.error || "Failed to load report");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  const periodInfo = getPeriodDates(period);
  const d = reportData;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading…" : periodInfo.label}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => load(period)}
            disabled={loading}
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            title="Refresh"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* PDF export */}
          {!loading && d && (
            <ReportPDFButton data={d} periodLabel={periodInfo.label} />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── KPI cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : d ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Orders"
            value={d.orders.total}
            sub={`${d.orders.delivered} delivered`}
            accent="gray"
          />
          <StatCard
            label="Platform Revenue"
            value={fmt(d.revenue.platform)}
            sub={`${d.revenue.platform_fee_pct}% of ₦${Number(d.revenue.gross).toLocaleString("en-NG", { maximumFractionDigits: 0 })} gross`}
            accent="blue"
          />
          <StatCard
            label="New Users"
            value={d.users.new_count}
            sub="Registered this period"
            accent="amber"
          />
          <StatCard
            label="New Riders"
            value={d.riders.new_count}
            sub="Joined this period"
            accent="violet"
          />
        </div>
      ) : null}

      {/* ── Body ── */}
      {!loading && d && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Orders breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <SectionHeader title="Order Status" />
            <div className="space-y-3">
              <OrderStatusRow label="Delivered"   count={d.orders.delivered}  total={d.orders.total} color="bg-emerald-500" />
              <OrderStatusRow label="In Transit"  count={d.orders.in_transit} total={d.orders.total} color="bg-blue-500" />
              <OrderStatusRow label="Picked Up"   count={d.orders.picked_up}  total={d.orders.total} color="bg-sky-500" />
              <OrderStatusRow label="Accepted"    count={d.orders.accepted}   total={d.orders.total} color="bg-sky-400" />
              <OrderStatusRow label="Pending"     count={d.orders.pending}    total={d.orders.total} color="bg-amber-400" />
              <OrderStatusRow label="Cancelled"   count={d.orders.cancelled}  total={d.orders.total} color="bg-gray-400" />
            </div>
            <div className="pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
              <span>Prepaid: <strong className="text-gray-900">{d.orders.prepaid_count}</strong></span>
              <span>Pay on Delivery: <strong className="text-gray-900">{d.orders.cod_count}</strong></span>
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <SectionHeader title="Revenue" />
            <div className="space-y-3">
              {[
                { label: "Gross (Delivery Fees)", value: fmt(d.revenue.gross), accent: "text-gray-900" },
                { label: `Platform Share (${d.revenue.platform_fee_pct}%)`, value: fmt(d.revenue.platform), accent: "text-blue-600" },
                { label: "Rider Payouts", value: fmt(d.revenue.rider_share), accent: "text-emerald-600" },
                { label: "COD Value Processed", value: fmt(d.revenue.cod_value), accent: "text-violet-600" },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`text-sm font-semibold ${accent}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Withdrawals */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <SectionHeader title="Withdrawals" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{fmt(d.withdrawals.total_completed)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600">Pending</p>
                <p className="text-base font-bold text-amber-700 mt-0.5">{fmt(d.withdrawals.pending_amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Rider Payouts</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{fmt(d.withdrawals.rider_withdrawn)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Company Payouts</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{fmt(d.withdrawals.company_withdrawn)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">{d.withdrawals.total_requests} withdrawal request{d.withdrawals.total_requests !== 1 ? "s" : ""} this period</p>
          </div>

          {/* Top riders */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <SectionHeader title="Top Riders by Deliveries" />
            {d.riders.top_performers.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No completed deliveries this period</p>
            ) : (
              <div className="space-y-2">
                {d.riders.top_performers.map((rider, i) => (
                  <div key={rider.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-yellow-100 text-yellow-700"
                      : i === 1 ? "bg-gray-200 text-gray-600"
                      : i === 2 ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{rider.name || "—"}</p>
                      <p className="text-xs text-gray-400">{rider.phone || ""}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-emerald-600">{rider.deliveries} deliveries</p>
                      <p className="text-xs text-gray-400">earned {fmt(rider.total_earned)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
