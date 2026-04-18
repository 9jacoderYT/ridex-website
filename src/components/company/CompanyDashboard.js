// Path: src/components/company/CompanyDashboard.js

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/components/company/CompanyContext";
import { getRiders } from "@/lib/server-actions/company/getRiders";
import { getDeliveryStats } from "@/lib/server-actions/company/getDeliveryStats";
import { getCompanyOrders } from "@/lib/server-actions/company/getCompanyOrders";
import CompanySupport from "@/components/company/CompanySupport";
import {
  getCompanyWallet,
  getCompanyCommission,
  updateCompanyCommission,
  setRiderCommission,
  removeRiderCommission,
  getCompanyWithdrawals,
  requestCompanyWithdrawal,
  getCompanyBankInfo,
  saveCompanyBankInfo,
} from "@/lib/server-actions/company/companyFinance";
import { getCompanyReport } from "@/lib/server-actions/company/getCompanyReport";
import { updateCompanyProfile } from "@/lib/server-actions/company/updateCompanyProfile";
import { changeCompanyPassword } from "@/lib/server-actions/company/changeCompanyPassword";
import { getRiderPerformance } from "@/lib/server-actions/company/getRiderPerformance";

// Nigerian banks list (shared with rider app)
const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Ecobank", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank", code: "011" },
  { name: "FCMB", code: "214" },
  { name: "GTBank", code: "058" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Moniepoint", code: "090405" },
  { name: "Opay", code: "100004" },
  { name: "PalmPay", code: "100033" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC", code: "039" },
  { name: "Sterling Bank", code: "232" },
  { name: "UBA", code: "033" },
  { name: "Union Bank", code: "032" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

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

function formatReportPeriodLabel({ startMonth, startYear, endMonth, endYear }) {
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  if (startMonth === endMonth && startYear === endYear) {
    return `${MONTHS[startMonth - 1]} ${startYear}`;
  }
  return `${MONTHS[startMonth - 1]} ${startYear} – ${MONTHS[endMonth - 1]} ${endYear}`;
}

// ── Reports Panel ─────────────────────────────────────────────────────────────

const REPORT_MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function buildYears() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = 2025; y <= current; y++) years.push(y);
  return years;
}

function isValidRange(start, end) {
  return start.year * 12 + start.month <= end.year * 12 + end.month;
}

function isMaxRange(start, end) {
  return end.year * 12 + end.month - (start.year * 12 + start.month) > 11;
}

function CompanyReportsPanel({ company }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [startSel, setStartSel] = useState({ month: currentMonth, year: currentYear });
  const [endSel, setEndSel] = useState({ month: currentMonth, year: currentYear });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const years = buildYears();
  const rangeValid = isValidRange(startSel, endSel);
  const rangeTooBig = isMaxRange(startSel, endSel);

  async function fetchReport() {
    if (!rangeValid || rangeTooBig) return;
    setLoading(true);
    setError("");
    setReportData(null);
    const res = await getCompanyReport({
      startMonth: startSel.month,
      startYear: startSel.year,
      endMonth: endSel.month,
      endYear: endSel.year,
    });
    setLoading(false);
    if (res.success) {
      setReportData(res.report);
    } else {
      setError(res.error ?? "Failed to load report. Please try again.");
    }
  }

  async function handleExportPdf(mode) {
    if (!reportData) return;
    setExporting(true);
    setExportError("");
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { CompanyReportDocument } = await import("@/components/company/CompanyReportPDF");

      const element = (
        <CompanyReportDocument
          report={reportData}
          companyName={company?.company_name ?? "Company"}
          mode={mode}
        />
      );
      const blob = await pdf(element).toBlob();

      const periodLabel = formatReportPeriodLabel(reportData.period).replace(/\s+/g, "-").replace(/–/g, "to");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RideX-Report-${periodLabel}-${mode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      setExportError("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Generate Delivery Report</h3>
        <p className="text-sm text-gray-500 mb-5">
          Select a date range to generate a summary of your delivery performance.
        </p>
        <div className="flex flex-wrap gap-6 items-end">
          {/* Start month */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">From</label>
            <div className="flex gap-2">
              <select
                value={startSel.month}
                onChange={(e) => setStartSel((s) => ({ ...s, month: Number(e.target.value) }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {REPORT_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={startSel.year}
                onChange={(e) => setStartSel((s) => ({ ...s, year: Number(e.target.value) }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* End month */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">To</label>
            <div className="flex gap-2">
              <select
                value={endSel.month}
                onChange={(e) => setEndSel((s) => ({ ...s, month: Number(e.target.value) }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {REPORT_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={endSel.year}
                onChange={(e) => setEndSel((s) => ({ ...s, year: Number(e.target.value) }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading || !rangeValid || rangeTooBig}
            className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>

        {/* Validation errors */}
        {!rangeValid && (
          <p className="text-red-600 text-xs mt-3">End month must be the same as or after the start month.</p>
        )}
        {rangeTooBig && rangeValid && (
          <p className="text-amber-600 text-xs mt-3">Maximum report range is 12 months. Please narrow your selection.</p>
        )}
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      {/* Empty state (before first generate) */}
      {!reportData && !loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Select a date range above and click <strong>Generate Report</strong> to see your delivery statistics.</p>
        </div>
      )}

      {/* Report Preview */}
      {reportData && (
        <>
          {/* Period header + export buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {formatReportPeriodLabel(reportData.period)}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Delivery report for your company</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleExportPdf("summary")}
                disabled={exporting}
                className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {exporting ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Export Summary PDF
              </button>
              <button
                onClick={() => handleExportPdf("full")}
                disabled={exporting}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {exporting ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Export Full Report PDF
              </button>
            </div>
          </div>
          {exportError && <p className="text-red-600 text-sm">{exportError}</p>}

          {/* No orders in period */}
          {reportData.orders.total === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <p className="text-amber-700 text-sm font-medium">No deliveries found for this period.</p>
              <p className="text-amber-600 text-xs mt-1">Try selecting a different date range.</p>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Total Orders", value: reportData.orders.total, sub: "in selected period", color: "text-gray-900" },
              { label: "Completed", value: reportData.orders.completed, sub: "delivered", color: "text-emerald-700" },
              { label: "Cancelled", value: reportData.orders.cancelled, sub: "not delivered", color: "text-red-600" },
              {
                label: "Completion Rate",
                value: `${reportData.orders.completionRate}%`,
                sub: reportData.orders.total === 0 ? "no orders" : `${reportData.orders.completed} of ${reportData.orders.total}`,
                color: Number(reportData.orders.completionRate) >= 70 ? "text-emerald-700" : "text-amber-600",
              },
              {
                label: "Avg Customer Rating",
                value: reportData.ratings.average ? `${reportData.ratings.average} / 5` : "N/A",
                sub: reportData.ratings.total > 0 ? `from ${reportData.ratings.total} ratings` : "no ratings yet",
                color: "text-blue-700",
              },
              {
                label: "COD Collected",
                value: fmt(reportData.payments.codCollected),
                sub: `${reportData.payments.codCount} COD orders`,
                color: "text-purple-700",
              },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-medium text-gray-500 mb-2">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Payment Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "COD Orders", value: reportData.payments.codCount },
                { label: "COD Amount Collected", value: fmt(reportData.payments.codCollected) },
                { label: "COD Company Share", value: fmt(reportData.payments.codCompanyShare) },
                { label: "Prepaid Orders", value: reportData.payments.prepaidCount },
                { label: "Prepaid Completed", value: reportData.payments.prepaidDelivered },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Riders */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Top 5 Riders by Deliveries</h3>
            {reportData.topRiders.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No completed deliveries in this period.</p>
            ) : (
              <div className="space-y-2">
                {reportData.topRiders.map((rider, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-800">{rider.name}</span>
                        <span className="text-sm font-bold text-emerald-700">{rider.count} deliveries</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min((rider.count / (reportData.topRiders[0]?.count || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Withdrawal Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Requested</p>
                <p className="text-xl font-bold text-gray-900">{fmt(reportData.withdrawals.requested)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Completed Payouts</p>
                <p className="text-xl font-bold text-emerald-700">{fmt(reportData.withdrawals.completed)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">No. of Requests</p>
                <p className="text-xl font-bold text-gray-900">{reportData.withdrawals.count}</p>
              </div>
            </div>
          </div>

          {/* Full orders preview table (top 10) */}
          {reportData.allOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  Recent Deliveries
                </h3>
                <span className="text-xs text-gray-400">{reportData.allOrders.length} total • export Full Report PDF to see all</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">Tracking #</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Payment</th>
                      <th className="pb-3 font-medium">Rider</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.allOrders.slice(0, 10).map((order, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-gray-700 font-mono text-xs">{order.tracking_number ?? "-"}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.status === "delivered" ? "bg-green-100 text-green-700" :
                            order.status === "cancelled" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600 text-xs uppercase">{order.payment_type === "pay_on_delivery" || order.payment_type === "cod" ? "COD" : "Prepaid"}</td>
                        <td className="py-3 text-gray-700">{order.rider_name}</td>
                        <td className="py-3 text-gray-500 text-xs">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Finance Panel ─────────────────────────────────────────────────────────────

function CompanyFinancePanel({ companyId }) {
  const [wallet, setWallet] = useState(null);
  const [commission, setCommission] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview"); // 'overview' | 'withdraw' | 'banking' | 'commission'
  const [riderPct, setRiderPct] = useState("");
  const [savingPct, setSavingPct] = useState(false);
  const [pctMsg, setPctMsg] = useState("");
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bankName: "", bankCode: "", accountNumber: "", accountName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState({ text: "", ok: false });
  const [savedBankInfo, setSavedBankInfo] = useState(null);
  const [bankForm, setBankForm] = useState({ bankName: "", bankCode: "", accountNumber: "", accountName: "" });
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState({ text: "", ok: false });

  useEffect(() => {
    if (!companyId) return;
    Promise.all([getCompanyWallet(), getCompanyCommission(), getCompanyWithdrawals(), getCompanyBankInfo()]).then(
      ([wRes, cRes, hRes, bRes]) => {
        if (wRes.success) setWallet(wRes.wallet);
        if (cRes.success) { setCommission(cRes.commission); setRiderPct(String(cRes.commission.rider_percentage_of_remainder)); }
        if (hRes.success) setWithdrawals(hRes.withdrawals);
        if (bRes.success && bRes.bankInfo) {
          setSavedBankInfo(bRes.bankInfo);
          setBankForm(bRes.bankInfo);
          // Pre-fill withdrawal form with saved bank info
          setWithdrawForm((f) => ({
            ...f,
            bankName: bRes.bankInfo.bankName,
            bankCode: bRes.bankInfo.bankCode,
            accountNumber: bRes.bankInfo.accountNumber,
            accountName: bRes.bankInfo.accountName,
          }));
        }
        setLoading(false);
      },
    );
  }, [companyId]);

  async function saveCommission() {
    setSavingPct(true); setPctMsg("");
    const res = await updateCompanyCommission(parseFloat(riderPct));
    setSavingPct(false);
    setPctMsg(res.success ? "Saved!" : res.error);
    if (res.success) {
      const cRes = await getCompanyCommission();
      if (cRes.success) setCommission(cRes.commission);
    }
  }

  async function submitWithdrawal(e) {
    e.preventDefault();
    setSubmitting(true); setWithdrawMsg({ text: "", ok: false });
    const res = await requestCompanyWithdrawal({
      amount: parseFloat(withdrawForm.amount),
      bankName: withdrawForm.bankName,
      bankCode: withdrawForm.bankCode,
      accountNumber: withdrawForm.accountNumber,
      accountName: withdrawForm.accountName,
    });
    setSubmitting(false);
    if (res.success) {
      setWithdrawMsg({ text: "Withdrawal request submitted! Admin will review within 1 business day.", ok: true });
      // Keep bank details, only clear amount
      setWithdrawForm((f) => ({ ...f, amount: "" }));
      const [wRes, hRes] = await Promise.all([getCompanyWallet(), getCompanyWithdrawals()]);
      if (wRes.success) setWallet(wRes.wallet);
      if (hRes.success) setWithdrawals(hRes.withdrawals);
    } else {
      setWithdrawMsg({ text: res.error, ok: false });
    }
  }

  async function saveBankInfo(e) {
    e.preventDefault();
    setSavingBank(true); setBankMsg({ text: "", ok: false });
    const res = await saveCompanyBankInfo({
      bankName: bankForm.bankName,
      bankCode: bankForm.bankCode,
      accountNumber: bankForm.accountNumber,
      accountName: bankForm.accountName,
    });
    setSavingBank(false);
    if (res.success) {
      setSavedBankInfo({ ...bankForm });
      // Pre-fill withdrawal form with newly saved bank info
      setWithdrawForm((f) => ({
        ...f,
        bankName: bankForm.bankName,
        bankCode: bankForm.bankCode,
        accountNumber: bankForm.accountNumber,
        accountName: bankForm.accountName,
      }));
      setBankMsg({ text: "Banking information saved!", ok: true });
    } else {
      setBankMsg({ text: res.error, ok: false });
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Wallet summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Available Balance", value: fmt(wallet?.balance ?? 0), color: "text-emerald-600" },
          { label: "Total Earned", value: fmt(wallet?.total_earned ?? 0), color: "text-gray-900" },
          { label: "Total Withdrawn", value: fmt(wallet?.total_withdrawn ?? 0), color: "text-gray-500" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["overview", "History"], ["withdraw", "Withdraw Funds"], ["banking", "Banking Info"], ["commission", "Split Settings"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${section === key ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* History */}
      {section === "overview" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Withdrawal History</h3>
          </div>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">No withdrawals yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                {["Date", "Amount", "Bank", "Account", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(w.amount)}</td>
                    <td className="px-4 py-3">{w.bank_name}</td>
                    <td className="px-4 py-3 text-gray-500">{w.account_number}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[w.status] || "bg-gray-100 text-gray-600"}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Withdraw form */}
      {section === "withdraw" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Request Withdrawal</h3>
          <form onSubmit={submitWithdrawal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input type="number" required min="10000" step="100" value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Min ₦10,000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
              <select required value={withdrawForm.bankCode} onChange={(e) => {
                const bank = NIGERIAN_BANKS.find((b) => b.code === e.target.value);
                setWithdrawForm((f) => ({ ...f, bankCode: e.target.value, bankName: bank?.name ?? "" }));
              }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select bank</option>
                {NIGERIAN_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input type="text" required maxLength={10} value={withdrawForm.accountNumber}
                onChange={(e) => setWithdrawForm((f) => ({ ...f, accountNumber: e.target.value }))}
                placeholder="10-digit account number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <input type="text" required value={withdrawForm.accountName}
                onChange={(e) => setWithdrawForm((f) => ({ ...f, accountName: e.target.value }))}
                placeholder="As it appears on your bank account" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {savedBankInfo && (
              <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-700 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Using saved bank account. <button type="button" onClick={() => setSection("banking")} className="underline ml-1">Change</button>
              </div>
            )}
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              Withdrawals are reviewed by admin and transferred within 1 business day. Minimum ₦10,000 · Max 2 per week.
            </div>
            {withdrawMsg.text && (
              <p className={`text-sm ${withdrawMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{withdrawMsg.text}</p>
            )}
            <button type="submit" disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60">
              {submitting ? "Submitting…" : "Request Withdrawal"}
            </button>
          </form>
        </div>
      )}

      {/* Banking Info */}
      {section === "banking" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-1">Banking Information</h3>
          <p className="text-sm text-gray-500 mb-5">Save your bank details to pre-fill future withdrawal requests.</p>
          {savedBankInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm space-y-1">
              <p className="font-medium text-gray-700">Current saved account</p>
              <p className="text-gray-600">{savedBankInfo.bankName} · {savedBankInfo.accountNumber}</p>
              <p className="text-gray-500">{savedBankInfo.accountName}</p>
            </div>
          )}
          <form onSubmit={saveBankInfo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
              <select required value={bankForm.bankCode} onChange={(e) => {
                const bank = NIGERIAN_BANKS.find((b) => b.code === e.target.value);
                setBankForm((f) => ({ ...f, bankCode: e.target.value, bankName: bank?.name ?? "" }));
              }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select bank</option>
                {NIGERIAN_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input type="text" required maxLength={10} value={bankForm.accountNumber}
                onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
                placeholder="10-digit account number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <input type="text" required value={bankForm.accountName}
                onChange={(e) => setBankForm((f) => ({ ...f, accountName: e.target.value }))}
                placeholder="As it appears on your bank account"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {bankMsg.text && (
              <p className={`text-sm ${bankMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{bankMsg.text}</p>
            )}
            <button type="submit" disabled={savingBank}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60">
              {savingBank ? "Saving…" : "Save Banking Info"}
            </button>
          </form>
        </div>
      )}

      {/* Commission settings */}
      {section === "commission" && commission && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-1">Revenue Split Settings</h3>
          <p className="text-sm text-gray-500 mb-5">Set what percentage of the post-platform amount your riders receive. You keep the rest.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span className="font-semibold">{commission.platform_fee_percentage}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Rider Share (of total)</span><span className="font-semibold text-blue-600">{commission.rider_total_percentage.toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Your Share (of total)</span><span className="font-semibold text-emerald-600">{commission.company_total_percentage.toFixed(1)}%</span></div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rider % of post-platform amount <span className="text-gray-400 font-normal">(50–100%)</span>
            </label>
            <input type="number" min="50" max="100" step="5" value={riderPct}
              onChange={(e) => setRiderPct(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <p className="text-xs text-gray-400 mt-1">
              Example: if platform fee is {commission.platform_fee_percentage}% and you set riders to {riderPct}%, riders get {((100 - commission.platform_fee_percentage) * parseFloat(riderPct || "0") / 100).toFixed(1)}% of the total delivery fee.
            </p>
          </div>

          {pctMsg && <p className={`text-sm mb-3 ${pctMsg === "Saved!" ? "text-emerald-600" : "text-red-600"}`}>{pctMsg}</p>}
          <button onClick={saveCommission} disabled={savingPct}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg text-sm disabled:opacity-60">
            {savingPct ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Rider Detail Modal ────────────────────────────────────────────────────────

function RiderDetailModal({ riderId, riderName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  // Per-rider commission editing
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionInput, setCommissionInput] = useState("");
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionStatus, setCommissionStatus] = useState(null); // { ok, msg }

  async function reload() {
    const res = await getRiderPerformance(riderId);
    if (res.success) setData(res);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getRiderPerformance(riderId);
      setLoading(false);
      if (res.success) {
        setData(res);
        setCommissionInput(String(res.rider?.commissionPct ?? ""));
      }
    }
    load();
  }, [riderId]);

  async function handleSaveCommission() {
    const pct = parseFloat(commissionInput);
    if (isNaN(pct) || pct < 50 || pct > 100) {
      setCommissionStatus({ ok: false, msg: "Enter a value between 50 and 100" });
      return;
    }
    setSavingCommission(true);
    setCommissionStatus(null);
    const res = await setRiderCommission(riderId, pct);
    setSavingCommission(false);
    if (res.success) {
      setCommissionStatus({ ok: true, msg: "Commission saved" });
      setEditingCommission(false);
      await reload();
    } else {
      setCommissionStatus({ ok: false, msg: res.error });
    }
  }

  async function handleResetCommission() {
    setSavingCommission(true);
    setCommissionStatus(null);
    const res = await removeRiderCommission(riderId);
    setSavingCommission(false);
    if (res.success) {
      setCommissionStatus({ ok: true, msg: "Reset to company default" });
      setEditingCommission(false);
      await reload();
    } else {
      setCommissionStatus({ ok: false, msg: res.error });
    }
  }

  const fmtCurrency = (n) =>
    `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const STATUS_PILL = {
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    in_transit: "bg-blue-100 text-blue-700",
    picked_up: "bg-indigo-100 text-indigo-700",
    accepted: "bg-amber-100 text-amber-700",
    pending: "bg-gray-100 text-gray-600",
  };

  const sections = ["overview", "history", "ratings", "cod"];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            {data?.rider?.rider_photo_url || data?.rider?.profile_picture_url ? (
              <img
                src={data.rider.profile_picture_url || data.rider.rider_photo_url}
                alt={riderName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 font-semibold text-sm">
                  {riderName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{riderName}</h2>
              <p className="text-xs text-gray-500">Performance Overview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading performance data…</p>
            </div>
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-gray-500">Failed to load data.</p>
          </div>
        ) : (
          <>
            {/* Section tabs */}
            <div className="border-b border-gray-200 px-6">
              <nav className="-mb-px flex gap-6">
                {sections.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSection(s)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                      activeSection === s
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {s === "cod" ? "COD" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {/* ── OVERVIEW ── */}
              {activeSection === "overview" && (
                <div className="space-y-6">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Orders", value: data.stats.totalOrders, color: "text-gray-900" },
                      { label: "Delivered", value: data.stats.deliveredOrders, color: "text-green-600" },
                      { label: "Cancelled", value: data.stats.cancelledOrders, color: "text-red-500" },
                      { label: "Completion Rate", value: `${data.stats.completionRate}%`, color: "text-emerald-600" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Last 30 Days", value: `${data.stats.last30Days.delivered} delivered` },
                      { label: "Avg Distance", value: `${data.stats.avgDistance} km` },
                      { label: "Rating", value: data.rider.average_rating > 0 ? `${Number(data.rider.average_rating).toFixed(1)} ★` : "No ratings" },
                      { label: "Wallet Balance", value: data.rider.wallet_balance != null ? fmtCurrency(data.rider.wallet_balance) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-base font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rider info */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Rider Details</h4>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {[
                        ["Phone", data.rider.phone],
                        ["Email", data.rider.email],
                        ["Vehicle", data.rider.vehicle_type === "bike" ? "Motorcycle" : "Car"],
                        ["Plate No.", data.rider.plate_number || "—"],
                        ["Status", data.rider.is_active ? "Active" : "Inactive"],
                        ["Joined", fmtDate(data.rider.created_at)],
                        ["Total Ratings", data.rider.total_ratings || 0],
                      ].map(([dt, dd]) => (
                        <div key={dt}>
                          <dt className="text-xs text-gray-500">{dt}</dt>
                          <dd className="text-sm font-medium text-gray-900 mt-0.5">{dd}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Per-rider commission card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Commission Split</h4>
                      {!editingCommission && (
                        <button
                          onClick={() => { setEditingCommission(true); setCommissionStatus(null); setCommissionInput(String(data.rider.commissionPct ?? data.rider.companyDefaultPct ?? "")); }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Current state */}
                    {!editingCommission && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${data.rider.hasCommissionOverride ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            {data.rider.hasCommissionOverride ? "Custom" : "Default"}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {data.rider.commissionPct != null ? `${data.rider.commissionPct}%` : "—"} rider share of remainder
                          </span>
                        </div>
                        {data.rider.hasCommissionOverride && (
                          <p className="text-xs text-gray-400">
                            Company default: {data.rider.companyDefaultPct != null ? `${data.rider.companyDefaultPct}%` : "—"}
                            {" · "}
                            <button
                              onClick={handleResetCommission}
                              disabled={savingCommission}
                              className="text-red-500 hover:text-red-600 underline"
                            >
                              Reset to default
                            </button>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Edit form */}
                    {editingCommission && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Rider's share of post-platform remainder (50–100%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={50}
                              max={100}
                              step={1}
                              value={commissionInput}
                              onChange={(e) => setCommissionInput(e.target.value)}
                              className="w-24 border-2 border-gray-900 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Company default is {data.rider.companyDefaultPct != null ? `${data.rider.companyDefaultPct}%` : "—"}. Leave blank to revert.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveCommission}
                            disabled={savingCommission}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                          >
                            {savingCommission ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingCommission(false); setCommissionStatus(null); }}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          {data.rider.hasCommissionOverride && (
                            <button
                              onClick={handleResetCommission}
                              disabled={savingCommission}
                              className="px-3 py-1.5 text-xs text-red-500 hover:text-red-600 border border-red-200 rounded-lg"
                            >
                              Reset to default
                            </button>
                          )}
                        </div>

                        {commissionStatus && (
                          <p className={`text-xs ${commissionStatus.ok ? "text-emerald-600" : "text-red-500"}`}>
                            {commissionStatus.msg}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── HISTORY ── */}
              {activeSection === "history" && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Last {data.recentHistory.length} deliveries</p>
                  {data.recentHistory.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No delivery history yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.recentHistory.map((order) => (
                        <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[order.status] || "bg-gray-100 text-gray-600"}`}>
                                {order.status.replace("_", " ")}
                              </span>
                              {order.delivery_type !== "normal" && (
                                <span className={`text-xs font-semibold ${order.delivery_type === "priority" ? "text-red-600" : "text-amber-600"}`}>
                                  {order.delivery_type === "priority" ? "PRIORITY" : "HIGH-VALUE"}
                                </span>
                              )}
                              {order.payment_type === "pay_on_delivery" && (
                                <span className="text-xs font-semibold text-orange-600">COD</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{fmtDate(order.created_at)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-gray-900">{fmtCurrency(order.amount_paid)}</p>
                            {order.distance_km && (
                              <p className="text-xs text-gray-400">{Number(order.distance_km).toFixed(1)} km</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── RATINGS ── */}
              {activeSection === "ratings" && (
                <div className="space-y-5">
                  {/* Rating bar chart */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-900">
                          {data.rider.average_rating > 0 ? Number(data.rider.average_rating).toFixed(1) : "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{data.rider.total_ratings || 0} reviews</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = data.ratingCounts[star] || 0;
                          const pct = data.ratingsList.length > 0 ? (count / data.ratingsList.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-4">{star}★</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-amber-400 h-2 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Individual ratings */}
                  {data.ratingsList.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No ratings yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.ratingsList.map((r, i) => (
                        <div key={i} className="p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-amber-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                            <span className="text-xs text-gray-400">{fmtDate(r.created_at)}</span>
                          </div>
                          {r.comment && <p className="text-sm text-gray-700 italic">"{r.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── COD ── */}
              {activeSection === "cod" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Collected", value: fmtCurrency(data.cod.totalCollected) },
                      { label: "Rider's Share", value: fmtCurrency(data.cod.riderShare) },
                      { label: "Company Share", value: fmtCurrency(data.cod.companyShare) },
                      { label: "COD Orders", value: data.cod.totalEntries },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-lg font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  {data.cod.totalEntries === 0 && (
                    <p className="text-center text-gray-400 py-8">No COD deliveries yet.</p>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Company Settings Panel ────────────────────────────────────────────────────

function CompanySettingsPanel({ company, onUpdate }) {
  const [profileForm, setProfileForm] = useState({
    company_name: company?.company_name || "",
    phone: company?.phone || "",
    company_address: company?.company_address || "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(company?.logo_url || null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const fd = new FormData();
    fd.append("company_name", profileForm.company_name);
    fd.append("phone", profileForm.phone);
    fd.append("company_address", profileForm.company_address);
    if (logoFile) fd.append("logo", logoFile);
    const res = await updateCompanyProfile(fd);
    setProfileSaving(false);
    if (res.success) {
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
      setLogoFile(null);
      onUpdate(res.company);
    } else {
      setProfileMsg({ type: "error", text: res.error || "Update failed." });
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    const res = await changeCompanyPassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
    setPwSaving(false);
    if (res.success) {
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPwForm({ current: "", next: "", confirm: "" });
    } else {
      setPwMsg({ type: "error", text: res.error || "Failed to change password." });
    }
  }

  return (
    <div className="space-y-8">
      {/* Company Profile */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Company Profile</h3>
        <p className="text-sm text-gray-500 mb-6">Update your company name, phone, address, and logo.</p>

        <form onSubmit={handleProfileSave} className="space-y-5">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                  </svg>
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {logoFile ? "Change" : "Upload Logo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              {logoFile && (
                <span className="text-xs text-gray-500 truncate max-w-[160px]">{logoFile.name}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={profileForm.company_name}
                onChange={e => setProfileForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
            <input
              type="text"
              value={profileForm.company_address}
              onChange={e => setProfileForm(f => ({ ...f, company_address: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {profileMsg && (
            <div className={`text-sm px-4 py-2 rounded-lg ${profileMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {profileMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
            >
              {profileSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Account Information</h3>
        <p className="text-sm text-gray-500 mb-6">These details are set during registration and cannot be changed. Contact support if you need to update them.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Email Address", value: company?.email },
            { label: "Business Registration No.", value: company?.business_registration_number || "—" },
            { label: "NIN Number", value: company?.nin_number || "—" },
            { label: "Account Status", value: company?.is_active ? "Active" : "Inactive" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className="text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
        <p className="text-sm text-gray-500 mb-6">Use a strong password you don't use elsewhere.</p>

        <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {pwMsg && (
            <div className={`text-sm px-4 py-2 rounded-lg ${pwMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {pwMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
            >
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CompanyDashboard() {
  const { company, logout, updateCompanyData } = useCompany();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'riders', 'orders', 'support', 'finance', 'reports', 'settings'
  const [riders, setRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [deliveryStats, setDeliveryStats] = useState({
    totalDeliveries: 0,
    activeRides: 0,
    completedToday: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState(null); // { id, name } or null
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedRiderDetail, setSelectedRiderDetail] = useState(null); // { id, name }

  // Fetch riders and delivery stats when component mounts
  useEffect(() => {
    if (company?.id) {
      fetchRiders();
      fetchDeliveryStats();
    }
  }, [company?.id]);

  const fetchDeliveryStats = async () => {
    if (!company?.id) return;

    setLoadingStats(true);
    try {
      const result = await getDeliveryStats(company.id);
      if (result.success) {
        setDeliveryStats(result.stats);
      } else {
        console.error("Failed to fetch delivery stats:", result.error);
      }
    } catch (error) {
      console.error("Error fetching delivery stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRiders = async () => {
    if (!company?.id) return;

    setLoadingRiders(true);
    try {
      const result = await getRiders(company.id);
      if (result.success) {
        setRiders(result.riders);
      } else {
        console.error("Failed to fetch riders:", result.error);
      }
    } catch (error) {
      console.error("Error fetching riders:", error);
    } finally {
      setLoadingRiders(false);
    }
  };

  // Fetch orders for the company's riders
  const fetchOrders = async (page = 1) => {
    if (!company?.id) return;

    setLoadingOrders(true);
    try {
      const result = await getCompanyOrders(company.id, {
        status: orderFilter,
        page,
        limit: 10,
        riderId: riderFilter?.id || null,
      });
      if (result.success) {
        setOrders(result.orders);
        setOrderPagination(result.pagination);
      } else {
        console.error("Failed to fetch orders:", result.error);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch orders when filter changes or when switching to orders tab
  useEffect(() => {
    if (company?.id && activeTab === "orders") {
      fetchOrders(1);
    }
  }, [company?.id, activeTab, orderFilter, riderFilter]);

  // Helper functions for order display
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Pending" },
      accepted: { bg: "bg-blue-100", text: "text-blue-700", label: "Accepted" },
      picked_up: { bg: "bg-purple-100", text: "text-purple-700", label: "Picked Up" },
      in_transit: { bg: "bg-amber-100", text: "text-amber-700", label: "In Transit" },
      delivered: { bg: "bg-green-100", text: "text-green-700", label: "Delivered" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const getPaymentStatusBadge = (status) => {
    const config = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
      completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
      failed: { bg: "bg-red-100", text: "text-red-700", label: "Failed" },
      refunded: { bg: "bg-gray-100", text: "text-gray-700", label: "Refunded" },
    };
    return config[status] || config.pending;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const stats = [
    {
      label: "Total Deliveries",
      value: loadingStats ? "..." : deliveryStats.totalDeliveries.toString(),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Active Rides",
      value: loadingStats ? "..." : deliveryStats.activeRides.toString(),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Completed Today",
      value: loadingStats ? "..." : deliveryStats.completedToday.toString(),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {company?.company_name}
                </h1>
                <p className="text-xs text-gray-500">Business Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                {company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt="Company Logo"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                )}
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Pending Approval Banner */}
      {(!company?.is_approved || !company?.is_active) && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-800">
                  Account Pending Approval
                </h3>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your company registration is currently under review. This typically takes 24-48 hours. You'll be notified via email once your account is approved.
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                  Under Review
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-6 py-8 ${(!company?.is_approved || !company?.is_active) ? "pointer-events-none opacity-50 select-none" : ""}`}>
        {/* Welcome Section with Account Status */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome back! 👋
              </h2>
              <p className="text-gray-600">
                Here's what's happening with your deliveries today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                  company?.is_active
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    company?.is_active ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                {company?.is_active ? "Account Active" : "Account Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Company ID Info Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
                <h3 className="text-lg font-bold">Your Company ID</h3>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 inline-block mb-3">
                <p className="text-3xl font-mono font-bold tracking-wider">
                  {company?.company_id || "Pending Assignment"}
                </p>
              </div>
              <p className="text-emerald-50 text-sm leading-relaxed mb-4">
                Register riders for your company. They will be able to login to
                the mobile app using the credentials you provide.
              </p>
              <button
                onClick={() => router.push("/company/register-rider")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Register New Rider
              </button>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-white/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "overview"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("riders")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "riders"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Registered Riders
                {riders.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {riders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "orders"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Orders
                {orderPagination.total > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {orderPagination.total}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("support")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "support"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Support
              </button>
              <button
                onClick={() => setActiveTab("finance")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "finance"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Finance
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "reports"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "settings"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`${stat.bgColor} ${stat.color} p-3 rounded-xl`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {loadingStats ? "Loading..." : `${deliveryStats.completedToday} ${deliveryStats.completedToday === 1 ? "delivery" : "deliveries"} completed today`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {deliveryStats.activeRides > 0
                        ? `${deliveryStats.activeRides} ${deliveryStats.activeRides === 1 ? "ride" : "rides"} currently active`
                        : "No active rides at the moment"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {riders.length} active riders registered
                    </p>
                    <p className="text-xs text-gray-500">
                      Click "Registered Riders" tab to view
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Riders Tab Content */}
        {activeTab === "riders" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Registered Riders
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {riders.length} rider{riders.length !== 1 ? "s" : ""} registered under your company
                </p>
              </div>
              <button
                onClick={() => router.push("/company/register-rider")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Rider
              </button>
            </div>

            {loadingRiders ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading riders...</p>
              </div>
            ) : riders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Riders Yet
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  You haven't registered any riders yet. Click the button below to add your first rider.
                </p>
                <button
                  onClick={() => router.push("/company/register-rider")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  Register First Rider
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Rider
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {riders.map((rider) => (
                      <tr
                        key={rider.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {rider.rider_photo_url ? (
                              <img
                                src={rider.rider_photo_url}
                                alt={rider.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-emerald-600 font-medium text-sm">
                                  {rider.name?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {rider.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {rider.plate_number}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{rider.phone}</p>
                          <p className="text-xs text-gray-500">{rider.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                              rider.vehicle_type === "bike"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {rider.vehicle_type === "bike" ? (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                                />
                              </svg>
                            )}
                            {rider.vehicle_type === "bike"
                              ? "Motorcycle"
                              : "Car"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {rider.average_rating > 0 ? (
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {Number(rider.average_rating).toFixed(1)} ★
                              </p>
                              <p className="text-xs text-gray-500">{rider.total_ratings} review{rider.total_ratings !== 1 ? "s" : ""}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No ratings</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              rider.status === "active" || rider.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                rider.status === "active" || rider.is_active
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            ></span>
                            {rider.status === "active" || rider.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {new Date(rider.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedRiderDetail({ id: rider.id, name: rider.name })}
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline whitespace-nowrap"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => {
                                setRiderFilter({ id: rider.id, name: rider.name });
                                setOrderFilter("all");
                                setActiveTab("orders");
                              }}
                              className="text-xs font-medium text-blue-500 hover:text-blue-700 hover:underline whitespace-nowrap"
                            >
                              Orders
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab("support");
                              }}
                              className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline whitespace-nowrap"
                              title="Report issue to admin via support ticket"
                            >
                              Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab Content */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                  <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                    {[
                      { key: "all", label: "All" },
                      { key: "active", label: "Active" },
                      { key: "completed", label: "Completed" },
                      { key: "cancelled", label: "Cancelled" },
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setOrderFilter(filter.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          orderFilter === filter.key
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  {riderFilter && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                      <span className="text-xs font-medium text-emerald-700">
                        Rider: {riderFilter.name}
                      </span>
                      <button
                        onClick={() => setRiderFilter(null)}
                        className="text-emerald-500 hover:text-emerald-700 font-bold text-sm leading-none"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Showing {orders.length} of {orderPagination.total} orders
                </p>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  {riderFilter ? `Orders — ${riderFilter.name}` : "Company Orders"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {riderFilter
                    ? `Showing orders assigned to ${riderFilter.name}`
                    : "All orders handled by your registered riders"}
                </p>
              </div>

              {loadingOrders ? (
                <div className="p-12 text-center">
                  <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {orderFilter === "all"
                      ? "Your riders haven't accepted any orders yet."
                      : `No ${orderFilter} orders found.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Rider
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => {
                          const statusBadge = getStatusBadge(order.status);
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-mono text-sm font-semibold text-gray-900">
                                  {order.order_id}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-900">{order.rider_name}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-900">{formatCurrency(order.amount_paid)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                  order.delivery_type === "priority"
                                    ? "bg-purple-100 text-purple-700"
                                    : order.delivery_type === "high-value"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {order.delivery_type || "normal"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-900">{formatDateTime(order.created_at)}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowOrderModal(true);
                                  }}
                                  className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {orderPagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Page {orderPagination.page} of {orderPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchOrders(orderPagination.page - 1)}
                          disabled={orderPagination.page === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => fetchOrders(orderPagination.page + 1)}
                          disabled={orderPagination.page === orderPagination.totalPages}
                          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Support Tab Content */}
        {activeTab === "support" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <CompanySupport riders={riders} />
          </div>
        )}

        {/* Finance Tab Content */}
        {activeTab === "finance" && <CompanyFinancePanel companyId={company?.id} />}

        {/* Reports Tab Content */}
        {activeTab === "reports" && <CompanyReportsPanel company={company} />}

        {/* Settings Tab Content */}
        {activeTab === "settings" && (
          <CompanySettingsPanel company={company} onUpdate={updateCompanyData} />
        )}

        {/* Rider Detail Modal */}
        {selectedRiderDetail && (
          <RiderDetailModal
            riderId={selectedRiderDetail.id}
            riderName={selectedRiderDetail.name}
            onClose={() => setSelectedRiderDetail(null)}
          />
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-500 font-mono mt-1">{selectedOrder.order_id}</p>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status & Payment Row */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Order Status</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadge(selectedOrder.status).bg} ${getStatusBadge(selectedOrder.status).text}`}>
                      {getStatusBadge(selectedOrder.status).label}
                    </span>
                  </div>
                  <div className="flex-1 min-w-[200px] bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Payment Status</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getPaymentStatusBadge(selectedOrder.payment_status).bg} ${getPaymentStatusBadge(selectedOrder.payment_status).text}`}>
                      {getPaymentStatusBadge(selectedOrder.payment_status).label}
                    </span>
                  </div>
                </div>

                {/* Rider & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Assigned Rider</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedOrder.rider_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Amount</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedOrder.amount_paid)}</p>
                  </div>
                </div>

                {/* Delivery Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Information
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-600 mb-1">Pickup Location</p>
                      <p className="text-sm text-gray-900">{selectedOrder.pickup_address || "N/A"}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-600 mb-1">Dropoff Location</p>
                      <p className="text-sm text-gray-900">{selectedOrder.dropoff_address || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Package Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-900">{selectedOrder.package_description || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Weight</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        selectedOrder.package_weight === "heavy"
                          ? "bg-red-100 text-red-700"
                          : selectedOrder.package_weight === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {selectedOrder.package_weight || "light"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Delivery Type</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        selectedOrder.delivery_type === "priority"
                          ? "bg-purple-100 text-purple-700"
                          : selectedOrder.delivery_type === "high-value"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedOrder.delivery_type || "normal"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Distance</p>
                      <p className="text-sm text-gray-900">{selectedOrder.distance_km ? `${selectedOrder.distance_km} km` : "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.special_instructions && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Special Instructions</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{selectedOrder.special_instructions}</p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
                      <p className="text-gray-900">{formatDateTime(selectedOrder.created_at)}</p>
                    </div>
                    {selectedOrder.picked_up_at && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Picked Up</p>
                        <p className="text-gray-900">{formatDateTime(selectedOrder.picked_up_at)}</p>
                      </div>
                    )}
                    {selectedOrder.delivered_at && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Delivered</p>
                        <p className="text-gray-900">{formatDateTime(selectedOrder.delivered_at)}</p>
                      </div>
                    )}
                    {selectedOrder.estimated_delivery && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Estimated Delivery</p>
                        <p className="text-gray-900">{formatDateTime(selectedOrder.estimated_delivery)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
