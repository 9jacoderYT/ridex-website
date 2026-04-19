// app/(admin)/admindashboard/pricing/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPricingSettings,
  updatePricingSettings,
  getAreaScores,
  overrideAreaMultiplier,
  resetAreaMultiplier,
  getOrderCutoffSettings,
  updateOrderCutoffSettings,
} from "@/lib/server-actions/pricing/managePricing";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return Number(n).toLocaleString("en-NG");
}

function pct(n) {
  return `${((Number(n) - 1) * 100).toFixed(0)}%`;
}

// Preview how much a sample delivery would cost given the current form values
function calcPreview(form) {
  const dist = 10; // 10 km sample
  const base = Number(form.baseFee) || 0;
  const distFee = dist * (Number(form.ratePerKm) || 0);
  const subtotal = base + distFee;
  return {
    normal_light: Math.max(
      Math.round(subtotal * Number(form.weightMultLight) * Number(form.typeMultNormal)),
      Number(form.minDeliveryFee)
    ),
    priority_medium: Math.max(
      Math.round(subtotal * Number(form.weightMultMedium) * Number(form.typeMultPriority)),
      Number(form.minDeliveryFee)
    ),
    highvalue_heavy: Math.max(
      Math.round(subtotal * Number(form.weightMultHeavy) * Number(form.typeMultHighValue)),
      Number(form.minDeliveryFee)
    ),
  };
}

// ── Small reusable components ─────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function NumInput({ value, onChange, min = 0, step = 1, prefix }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${prefix ? "pl-8 pr-3" : "px-3"}`}
      />
    </div>
  );
}

function MultInput({ value, onChange, label }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-1">{label}</p>
      <div className="relative">
        <input
          type="number"
          min={1}
          step={0.01}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
          ×{Number(value).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [form, setForm] = useState({
    baseFee: 1000,
    ratePerKm: 300,
    minDeliveryFee: 1500,
    weightMultLight: 1.0,
    weightMultMedium: 1.3,
    weightMultHeavy: 1.6,
    typeMultNormal: 1.0,
    typeMultPriority: 1.35,
    typeMultHighValue: 1.75,
    typeMultSensitive: 1.5,
    areaDifficultyEnabled: true,
    areaMaxMultiplier: 1.3,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { ok: bool, msg: string }
  const [loading, setLoading] = useState(true);

  // Order cutoff hours
  const [cutoff, setCutoff] = useState({ enabled: false, hour: 18 });
  const [savingCutoff, setSavingCutoff] = useState(false);
  const [cutoffStatus, setCutoffStatus] = useState(null);

  // Area scores
  const [areas, setAreas] = useState([]);
  const [areaPage, setAreaPage] = useState(1);
  const [areaTotal, setAreaTotal] = useState(0);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);
  const [editingArea, setEditingArea] = useState(null); // { latGrid, lngGrid, value }
  const [areaActionStatus, setAreaActionStatus] = useState(null);

  // Load pricing + cutoff settings on mount
  useEffect(() => {
    Promise.all([getPricingSettings(), getOrderCutoffSettings()]).then(
      ([pricingRes, cutoffRes]) => {
        setLoading(false);
        if (pricingRes.success && pricingRes.pricing) {
          const p = pricingRes.pricing;
          setForm({
            baseFee: p.base_fee ?? 1000,
            ratePerKm: p.rate_per_km ?? 300,
            minDeliveryFee: p.min_delivery_fee ?? 1500,
            weightMultLight: p.weight_mult_light ?? 1.0,
            weightMultMedium: p.weight_mult_medium ?? 1.3,
            weightMultHeavy: p.weight_mult_heavy ?? 1.6,
            typeMultNormal: p.type_mult_normal ?? 1.0,
            typeMultPriority: p.type_mult_priority ?? 1.35,
            typeMultHighValue: p.type_mult_high_value ?? 1.75,
            typeMultSensitive: p.type_mult_sensitive ?? 1.5,
            areaDifficultyEnabled: p.area_difficulty_enabled ?? true,
            areaMaxMultiplier: p.area_max_multiplier ?? 1.3,
          });
        }
        if (cutoffRes.success) {
          setCutoff({ enabled: cutoffRes.cutoffEnabled, hour: cutoffRes.cutoffHour });
        }
      }
    );
  }, []);

  const loadAreas = useCallback(async (page = 1) => {
    setAreasLoading(true);
    setAreasError(null);
    const res = await getAreaScores({ page, limit: 20 });
    setAreasLoading(false);
    if (res.success) {
      setAreas(res.areas);
      setAreaTotal(res.total);
      setAreaPage(page);
    } else {
      setAreasError(res.error || "Failed to load area scores");
    }
  }, []);

  useEffect(() => {
    loadAreas(1);
  }, [loadAreas]);

  function set(key) {
    return (val) => setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const res = await updatePricingSettings({
      baseFee: Number(form.baseFee),
      ratePerKm: Number(form.ratePerKm),
      minDeliveryFee: Number(form.minDeliveryFee),
      weightMultLight: Number(form.weightMultLight),
      weightMultMedium: Number(form.weightMultMedium),
      weightMultHeavy: Number(form.weightMultHeavy),
      typeMultNormal: Number(form.typeMultNormal),
      typeMultPriority: Number(form.typeMultPriority),
      typeMultHighValue: Number(form.typeMultHighValue),
      typeMultSensitive: Number(form.typeMultSensitive),
      areaDifficultyEnabled: form.areaDifficultyEnabled,
      areaMaxMultiplier: Number(form.areaMaxMultiplier),
    });
    setSaving(false);
    setStatus(res.success ? { ok: true, msg: "Pricing updated successfully" } : { ok: false, msg: res.error });
  }

  async function handleAreaOverride(latGrid, lngGrid, val) {
    const res = await overrideAreaMultiplier(latGrid, lngGrid, Number(val));
    if (res.success) {
      setEditingArea(null);
      setAreaActionStatus({ ok: true, msg: "Area multiplier updated" });
      loadAreas(areaPage);
    } else {
      setAreaActionStatus({ ok: false, msg: res.error });
    }
  }

  async function handleAreaReset(latGrid, lngGrid) {
    const res = await resetAreaMultiplier(latGrid, lngGrid);
    if (res.success) {
      setAreaActionStatus({ ok: true, msg: "Area reset to 1.0" });
      loadAreas(areaPage);
    } else {
      setAreaActionStatus({ ok: false, msg: res.error });
    }
  }

  async function handleSaveCutoff() {
    setSavingCutoff(true);
    setCutoffStatus(null);
    const res = await updateOrderCutoffSettings({
      cutoffEnabled: cutoff.enabled,
      cutoffHour: cutoff.hour,
    });
    setSavingCutoff(false);
    setCutoffStatus(
      res.success
        ? { ok: true, msg: "Order hours saved" }
        : { ok: false, msg: res.error }
    );
  }

  // Nigeria time = UTC+1 (WAT, no DST)
  const nigeriaHour = (new Date().getUTCHours() + 1) % 24;
  const ordersCurrentlyOpen =
    !cutoff.enabled || (nigeriaHour >= 6 && nigeriaHour < cutoff.hour);

  const CUTOFF_OPTIONS = [
    { value: 15, label: "3:00 PM" },
    { value: 16, label: "4:00 PM" },
    { value: 17, label: "5:00 PM" },
    { value: 18, label: "6:00 PM" },
    { value: 19, label: "7:00 PM" },
    { value: 20, label: "8:00 PM" },
    { value: 21, label: "9:00 PM" },
  ];

  const preview = calcPreview(form);
  const AREA_LIMIT = 20;
  const totalPages = Math.ceil(areaTotal / AREA_LIMIT);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Delivery Pricing</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure base fees, per-km rates, weight/type surcharges, and area difficulty controls
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          Save Changes
        </button>
      </div>

      {/* Status banner */}
      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            status.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
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

      {/* Formula banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-blue-700 mb-1">Pricing Formula</p>
        <code className="text-[12px] text-blue-800 leading-relaxed">
          Total = MAX( (Base Fee + Distance × Rate/km) × Weight Multiplier × Type Multiplier × Area Multiplier, Min Fee )
        </code>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Base fees */}
        <SectionCard title="Base Fees" subtitle="Core price building blocks">
          <div className="space-y-4">
            <Field label="Base Fee (₦)" hint="Applied to every order before distance calculation">
              <NumInput value={form.baseFee} onChange={set("baseFee")} min={0} step={50} prefix="₦" />
            </Field>
            <Field label="Rate Per KM (₦)" hint="Added for each kilometer of distance">
              <NumInput value={form.ratePerKm} onChange={set("ratePerKm")} min={0} step={10} prefix="₦" />
            </Field>
            <Field label="Minimum Delivery Fee (₦)" hint="Floor price — no order can cost less than this">
              <NumInput value={form.minDeliveryFee} onChange={set("minDeliveryFee")} min={0} step={100} prefix="₦" />
            </Field>
          </div>
        </SectionCard>

        {/* Preview */}
        <SectionCard title="Price Preview" subtitle="Sample 10 km delivery with current settings">
          <div className="space-y-3">
            {[
              { label: "Normal · Light", val: preview.normal_light, color: "text-gray-700" },
              { label: "Priority · Medium", val: preview.priority_medium, color: "text-amber-700" },
              { label: "High-Value · Heavy", val: preview.highvalue_heavy, color: "text-red-700" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>₦{fmt(val)}</span>
              </div>
            ))}
            <p className="text-[11px] text-gray-400 mt-2">
              * Excludes area difficulty surcharge. Actual price may be higher in flagged areas.
            </p>
          </div>
        </SectionCard>

        {/* Weight multipliers */}
        <SectionCard
          title="Weight Multipliers"
          subtitle="Applied based on package weight category"
        >
          <div className="space-y-4">
            <MultInput value={form.weightMultLight} onChange={set("weightMultLight")} label="Light packages" />
            <MultInput value={form.weightMultMedium} onChange={set("weightMultMedium")} label="Medium packages" />
            <MultInput value={form.weightMultHeavy} onChange={set("weightMultHeavy")} label="Heavy packages" />
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <p className="text-[11px] text-gray-500">
                A multiplier of <span className="font-medium text-gray-700">1.3</span> adds a{" "}
                <span className="font-medium text-gray-700">30% surcharge</span> to the subtotal.
                Light must be ≥ 1.0.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Delivery type multipliers */}
        <SectionCard
          title="Delivery Type Multipliers"
          subtitle="Applied based on urgency and handling requirements"
        >
          <div className="space-y-4">
            <MultInput value={form.typeMultNormal} onChange={set("typeMultNormal")} label="Normal delivery" />
            <MultInput value={form.typeMultPriority} onChange={set("typeMultPriority")} label="Priority delivery (same-day)" />
            <MultInput value={form.typeMultHighValue} onChange={set("typeMultHighValue")} label="High-value delivery (insured)" />
            <MultInput value={form.typeMultSensitive} onChange={set("typeMultSensitive")} label="Sensitive delivery (fragile/special care)" />
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <p className="text-[11px] text-gray-500">
                High-value at <span className="font-medium text-gray-700">×{Number(form.typeMultHighValue).toFixed(2)}</span> means a{" "}
                <span className="font-medium text-gray-700">{pct(form.typeMultHighValue)}</span> premium over normal price.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Area difficulty */}
      <SectionCard
        title="Area Difficulty Surcharge"
        subtitle="Controls how much flagged or hard-to-reach areas affect the delivery price"
      >
        <div className="space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">Enable area difficulty pricing</p>
              <p className="text-xs text-gray-400 mt-0.5">
                When off, all area multipliers are treated as 1.0 (no surcharge)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, areaDifficultyEnabled: !f.areaDifficultyEnabled }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.areaDifficultyEnabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.areaDifficultyEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Max cap */}
          <div className={form.areaDifficultyEnabled ? "" : "opacity-40 pointer-events-none"}>
            <Field
              label="Maximum Area Multiplier Cap"
              hint={`Even the worst-rated area will not apply more than a ${pct(form.areaMaxMultiplier)} surcharge. Range: 1.0 – 3.0`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1.0}
                  max={3.0}
                  step={0.05}
                  value={form.areaMaxMultiplier}
                  onChange={(e) => set("areaMaxMultiplier")(e.target.value)}
                  className="flex-1 accent-blue-600"
                />
                <div className="w-20">
                  <NumInput
                    value={form.areaMaxMultiplier}
                    onChange={set("areaMaxMultiplier")}
                    min={1.0}
                    step={0.05}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>1.0 — No surcharge</span>
                <span className="font-medium text-blue-600">
                  Current cap: +{pct(form.areaMaxMultiplier)}
                </span>
                <span>3.0 — +200%</span>
              </div>
            </Field>

            {/* Explanation */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { range: "1.0 – 1.1", label: "Mild", desc: "Slightly delayed areas", color: "bg-green-50 border-green-200 text-green-700" },
                { range: "1.1 – 1.3", label: "Moderate", desc: "Poor roads or traffic", color: "bg-amber-50 border-amber-200 text-amber-700" },
                { range: "1.3 – 2.0+", label: "Severe", desc: "High-risk or inaccessible areas", color: "bg-red-50 border-red-200 text-red-700" },
              ].map(({ range, label, desc, color }) => (
                <div key={range} className={`rounded-lg border px-3 py-2.5 ${color}`}>
                  <p className="text-xs font-semibold">{label} <span className="font-normal opacity-70">({range})</span></p>
                  <p className="text-[11px] opacity-80 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Order Hours */}
      <SectionCard
        title="Order Cutoff Hours"
        subtitle="Pause new order placements after a set time each day. Orders automatically resume at 6:00 AM (Nigeria time)."
      >
        <div className="space-y-5">
          {/* Current status pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  ordersCurrentlyOpen ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                Orders are currently{" "}
                <span
                  className={
                    ordersCurrentlyOpen ? "text-green-600" : "text-red-600"
                  }
                >
                  {ordersCurrentlyOpen ? "OPEN" : "CLOSED"}
                </span>
              </span>
              <span className="text-xs text-gray-400">
                (Nigeria time: {String(nigeriaHour).padStart(2, "0")}:00)
              </span>
            </div>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Enable daily order cutoff
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                When on, new orders cannot be placed after the selected time
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setCutoff((c) => ({ ...c, enabled: !c.enabled }))
              }
              className={`relative w-10 h-5 rounded-full transition-colors ${
                cutoff.enabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  cutoff.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Cutoff time selector */}
          <div className={cutoff.enabled ? "" : "opacity-40 pointer-events-none"}>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Stop accepting orders at
            </label>
            <div className="grid grid-cols-7 gap-2">
              {CUTOFF_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCutoff((c) => ({ ...c, hour: opt.value }))}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                    cutoff.hour === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Orders will be paused at{" "}
                <strong>
                  {CUTOFF_OPTIONS.find((o) => o.value === cutoff.hour)?.label}
                </strong>{" "}
                and resume at <strong>6:00 AM</strong> the next day. Users will see a message informing them of the cutoff.
              </span>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSaveCutoff}
              disabled={savingCutoff}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {savingCutoff ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Save Order Hours
            </button>

            {cutoffStatus && (
              <span
                className={`text-xs ${
                  cutoffStatus.ok ? "text-green-600" : "text-red-600"
                }`}
              >
                {cutoffStatus.msg}
              </span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Area scores table */}
      <SectionCard
        title="Area Scores"
        subtitle="Difficulty ratings aggregated from rider feedback — sorted by worst areas first. Override or reset individual areas."
      >
        {areaActionStatus && (
          <div
            className={`mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              areaActionStatus.ok
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {areaActionStatus.msg}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-gray-500">
          <span className="font-medium text-gray-600">Rider scores 1–5:</span>
          {["1 = Best", "3 = Average", "5 = Worst"].map((l) => (
            <span key={l} className="bg-gray-100 rounded px-1.5 py-0.5">{l}</span>
          ))}
          <span className="ml-auto text-gray-400">
            🛣️ Road · 🚦 Traffic · 📍 Navigation · 🏢🏠 Complexity
          </span>
        </div>

        {areasLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : areasError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <span className="font-medium">Error loading area scores:</span> {areasError}
          </div>
        ) : areas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No area scores yet. Scores are generated from rider difficulty ratings after deliveries.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="px-3 py-2.5 text-left font-medium">Location</th>
                    <th className="px-3 py-2.5 text-left font-medium">🛣️ Road</th>
                    <th className="px-3 py-2.5 text-left font-medium">🚦 Traffic</th>
                    <th className="px-3 py-2.5 text-left font-medium">📍 Nav</th>
                    <th className="px-3 py-2.5 text-left font-medium">🏢🏠 Complexity</th>
                    <th className="px-3 py-2.5 text-left font-medium">Reports</th>
                    <th className="px-3 py-2.5 text-left font-medium">Difficulty ×</th>
                    <th className="px-3 py-2.5 text-left font-medium">Surcharge</th>
                    <th className="px-3 py-2.5 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {areas.map((area) => {
                    const isEditing =
                      editingArea?.latGrid === area.lat_grid &&
                      editingArea?.lngGrid === area.lng_grid;
                    const mult = Number(area.difficulty_multiplier);
                    const multBadge =
                      mult >= 1.3
                        ? "bg-red-100 text-red-700"
                        : mult >= 1.1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700";

                    // Score dot: green(1-2) → amber(3) → red(4-5)
                    const scoreDot = (val) => {
                      if (val === null || val === undefined) return <span className="text-gray-300">—</span>;
                      const n = Number(val);
                      const color = n >= 4 ? "bg-red-500" : n >= 3 ? "bg-amber-400" : "bg-green-500";
                      return (
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />
                          <span className="text-gray-900">{n.toFixed(1)}</span>
                        </span>
                      );
                    };

                    const lastUpdated = area.last_updated
                      ? new Date(area.last_updated).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
                      : null;

                    return (
                      <tr key={`${area.lat_grid}-${area.lng_grid}`} className="hover:bg-gray-50/50">
                        {/* Location */}
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-[11px] text-gray-500 leading-tight block">
                            {Number(area.lat_grid).toFixed(3)}, {Number(area.lng_grid).toFixed(3)}
                          </span>
                          {lastUpdated && (
                            <span className="text-[10px] text-gray-400">{lastUpdated}</span>
                          )}
                        </td>
                        {/* Rider scores */}
                        <td className="px-3 py-2.5">{scoreDot(area.avg_road_quality)}</td>
                        <td className="px-3 py-2.5">{scoreDot(area.avg_traffic)}</td>
                        <td className="px-3 py-2.5">{scoreDot(area.avg_reliability)}</td>
                        <td className="px-3 py-2.5">{scoreDot(area.avg_complexity)}</td>
                        {/* Report count */}
                        <td className="px-3 py-2.5 text-gray-500 font-medium">
                          {area.total_ratings ?? 0}
                        </td>
                        {/* Multiplier */}
                        <td className="px-3 py-2.5">
                          {isEditing ? (
                            <input
                              type="number"
                              min={1.0}
                              max={3.0}
                              step={0.05}
                              value={editingArea.value}
                              onChange={(e) =>
                                setEditingArea((a) => ({ ...a, value: e.target.value }))
                              }
                              className="w-20 border border-blue-300 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${multBadge}`}>
                              ×{mult.toFixed(3)}
                            </span>
                          )}
                        </td>
                        {/* Surcharge */}
                        <td className="px-3 py-2.5 text-gray-500">
                          +{((mult - 1) * 100).toFixed(1)}%
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleAreaOverride(area.lat_grid, area.lng_grid, editingArea.value)
                                  }
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingArea(null)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    setEditingArea({
                                      latGrid: area.lat_grid,
                                      lngGrid: area.lng_grid,
                                      value: mult.toFixed(3),
                                    })
                                  }
                                  className="text-gray-500 hover:text-blue-600"
                                >
                                  Override
                                </button>
                                {mult !== 1.0 && (
                                  <button
                                    onClick={() => handleAreaReset(area.lat_grid, area.lng_grid)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    Reset
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">
                  Showing {(areaPage - 1) * AREA_LIMIT + 1}–{Math.min(areaPage * AREA_LIMIT, areaTotal)} of {areaTotal} areas
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadAreas(areaPage - 1)}
                    disabled={areaPage === 1}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500 px-2">
                    {areaPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => loadAreas(areaPage + 1)}
                    disabled={areaPage === totalPages}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}
