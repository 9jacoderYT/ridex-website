"use client";

import { useState, useEffect } from "react";
import {
  getOrderCutoffSettings,
  updateOrderCutoffSettings,
} from "@/lib/server-actions/pricing/managePricing";

const CUTOFF_OPTIONS = [
  { value: 15, label: "3:00 PM" },
  { value: 16, label: "4:00 PM" },
  { value: 17, label: "5:00 PM" },
  { value: 18, label: "6:00 PM" },
  { value: 19, label: "7:00 PM" },
  { value: 20, label: "8:00 PM" },
  { value: 21, label: "9:00 PM" },
];

export default function OrderHoursPage() {
  const [cutoff, setCutoff] = useState({ enabled: false, hour: 18 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { ok, msg }

  // Nigeria time = UTC+1 (WAT, no DST)
  const nigeriaHour = (new Date().getUTCHours() + 1) % 24;
  const nigeriaMinute = new Date().getUTCMinutes();
  const nigeriaTimeLabel = `${String(nigeriaHour).padStart(2, "0")}:${String(nigeriaMinute).padStart(2, "0")}`;
  const ordersCurrentlyOpen =
    !cutoff.enabled || (nigeriaHour >= 6 && nigeriaHour < cutoff.hour);

  useEffect(() => {
    getOrderCutoffSettings().then((res) => {
      setLoading(false);
      if (res.success) {
        setCutoff({ enabled: res.cutoffEnabled, hour: res.cutoffHour });
      }
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const res = await updateOrderCutoffSettings({
      cutoffEnabled: cutoff.enabled,
      cutoffHour: cutoff.hour,
    });
    setSaving(false);
    setStatus(
      res.success
        ? { ok: true, msg: "Order hours saved successfully." }
        : { ok: false, msg: res.error || "Failed to save." }
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Order Hours</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Set a daily cutoff time after which new orders cannot be placed. Orders always resume at 6:00 AM (Nigeria time).
        </p>
      </div>

      {/* Status banner */}
      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            status.ok
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.ok ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {status.msg}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Daily Cutoff Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Controls when the ordering window closes each day
          </p>
        </div>

        <div className="p-5 space-y-6">
          {/* Live status */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
            <span
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                ordersCurrentlyOpen ? "bg-green-500" : "bg-red-500"
              } shadow-sm`}
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Orders are currently{" "}
                <span className={ordersCurrentlyOpen ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {ordersCurrentlyOpen ? "OPEN" : "CLOSED"}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Nigeria time: {nigeriaTimeLabel} WAT
              </p>
            </div>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable daily order cutoff</p>
              <p className="text-xs text-gray-400 mt-0.5">
                When on, users cannot place new orders after the selected time
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCutoff((c) => ({ ...c, enabled: !c.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                cutoff.enabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  cutoff.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Cutoff time picker */}
          <div className={cutoff.enabled ? "" : "opacity-40 pointer-events-none"}>
            <p className="text-sm font-medium text-gray-700 mb-3">Stop accepting orders at</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {CUTOFF_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCutoff((c) => ({ ...c, hour: opt.value }))}
                  className={`py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                    cutoff.hour === opt.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline graphic */}
          <div className={`rounded-lg border border-gray-100 p-4 ${cutoff.enabled ? "" : "opacity-40"}`}>
            <p className="text-xs font-medium text-gray-500 mb-3">Daily ordering window</p>
            <div className="flex items-center gap-2">
              {/* Open block */}
              <div className="flex items-center gap-1.5 flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[11px] font-semibold text-green-700">OPEN</p>
                  <p className="text-[10px] text-green-600">6:00 AM – {CUTOFF_OPTIONS.find((o) => o.value === cutoff.hour)?.label ?? "—"}</p>
                </div>
              </div>

              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>

              {/* Closed block */}
              <div className="flex items-center gap-1.5 flex-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <div>
                  <p className="text-[11px] font-semibold text-red-600">CLOSED</p>
                  <p className="text-[10px] text-red-500">
                    {CUTOFF_OPTIONS.find((o) => o.value === cutoff.hour)?.label ?? "—"} – 6:00 AM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              All times are in <strong>Nigeria time (WAT, UTC+1)</strong>. When orders are closed, users in the app will see a message letting them know and will be asked to come back at 6:00 AM. Already placed orders are not affected.
            </span>
          </div>

          {/* Save button */}
          <div className="pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Save Order Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
