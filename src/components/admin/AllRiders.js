"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  getAllRiders,
  getRiderDetail,
  getRiderOrders,
  updateRiderStatus,
  getRiderStats,
} from "@/lib/server-actions/admin/manageRiders";
import {
  getTrustScore,
  setTrustScore,
  recomputeTrustScore,
} from "@/lib/server-actions/admin/manageTrustScore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-700",
  suspended: "bg-red-100 text-red-800",
};

function fmt(n) {
  return `\u20A6${Number(n || 0).toLocaleString()}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stars({ rating }) {
  const n = Number(rating) || 0;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(n) ? "text-amber-400 fill-current" : "text-gray-200 fill-current"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-0.5">{n > 0 ? n.toFixed(1) : "No ratings"}</span>
    </span>
  );
}

// ─── Rider Detail Modal ───────────────────────────────────────────────────────

function RiderModal({ riderId, onClose, onStatusChange }) {
  const [rider, setRider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordersError, setOrdersError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Trust score state
  const [trustData, setTrustData]       = useState(null);
  const [trustLoading, setTrustLoading] = useState(false);
  const [trustEditing, setTrustEditing] = useState(false);
  const [editScore, setEditScore]       = useState("");
  const [editReason, setEditReason]     = useState("");
  const [trustSaving, setTrustSaving]   = useState(false);
  const [trustRecomputing, setTrustRecomputing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getRiderDetail(riderId);
      if (cancelled) return;
      if (res.success) setRider(res.data);
      else setError(res.error);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [riderId]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    const res = await getRiderOrders(riderId, { limit: 20 });
    if (res.success) setOrders(res.data);
    else {
      setOrdersError(res.error);
      console.error("Rider orders error:", res.error);
    }
    setOrdersLoading(false);
  }, [riderId]);

  const loadTrust = useCallback(async () => {
    setTrustLoading(true);
    const res = await getTrustScore("rider", riderId);
    if (res.success) setTrustData(res);
    setTrustLoading(false);
  }, [riderId]);

  useEffect(() => {
    if (tab === "orders") loadOrders();
    if (tab === "trust")  loadTrust();
  }, [tab, loadOrders, loadTrust]);

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Set rider status to "${newStatus}"?`)) return;
    setStatusUpdating(true);
    const res = await updateRiderStatus(riderId, newStatus);
    if (res.success) {
      setRider((prev) => ({ ...prev, status: newStatus, is_active: newStatus === "active" }));
      onStatusChange?.();
    } else {
      alert(res.error || "Failed to update status");
    }
    setStatusUpdating(false);
  };

  const handleTrustSave = async () => {
    const val = parseInt(editScore, 10);
    if (isNaN(val) || val < 0 || val > 100) { alert("Score must be 0–100"); return; }
    setTrustSaving(true);
    const res = await setTrustScore("rider", riderId, val, editReason);
    if (res.success) {
      setTrustEditing(false);
      setEditScore(""); setEditReason("");
      await loadTrust();
    } else {
      alert(res.error || "Failed to update score");
    }
    setTrustSaving(false);
  };

  const handleTrustRecompute = async () => {
    if (!confirm("Recompute score from last 30 days of activity?")) return;
    setTrustRecomputing(true);
    const res = await recomputeTrustScore("rider", riderId);
    if (res.success) await loadTrust();
    else alert(res.error || "Failed to recompute");
    setTrustRecomputing(false);
  };

  const TABS = [
    { key: "profile",  label: "Profile"     },
    { key: "orders",   label: "Orders"      },
    { key: "ratings",  label: "Ratings"     },
    { key: "trust",    label: "TrustScore"  },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {rider?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{rider?.name ?? "Loading…"}</h2>
              {rider && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      STATUS_COLORS[rider.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {rider.status}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{rider.vehicle_type}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-sm">{error}</div>
          ) : rider ? (
            <>
              {/* Profile Tab */}
              {tab === "profile" && (
                <div className="space-y-5">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Total Deliveries", value: rider.order_stats?.total ?? 0, color: "text-gray-900" },
                      { label: "Completed", value: rider.order_stats?.completed ?? 0, color: "text-green-600" },
                      { label: "Cancelled", value: rider.order_stats?.cancelled ?? 0, color: "text-red-500" },
                      { label: "Active", value: rider.order_stats?.active ?? 0, color: "text-blue-600" },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rating + Earnings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1.5">Rating</p>
                      <Stars rating={rider.average_rating ?? 0} />
                      <p className="text-xs text-gray-400 mt-1">
                        {rider.total_ratings ?? 0} rating{rider.total_ratings !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-gray-900 mb-1">Wallet Balance</p>
                      <p className="text-lg font-semibold text-green-700">{fmt(rider.wallet_balance ?? 0)}</p>
                      <p className="text-xs text-gray-900 mt-0.5">Total earned: {fmt(rider.total_earned ?? 0)}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Contact</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <InfoRow label="Email" value={rider.email} />
                      <InfoRow label="Phone" value={rider.phone} />
                      <InfoRow label="Member Since" value={fmtDate(rider.created_at)} />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Company</p>
                    {rider.company ? (
                      <button
                        onClick={() => {
                          window.open(`/admindashboard/companies?open=${rider.company.id}`, "_blank");
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-xl transition-colors group text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {rider.company.company_name?.charAt(0)?.toUpperCase() ?? "C"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{rider.company.company_name}</p>
                          <p className="text-xs text-gray-500">
                            {rider.company.company_id && (
                              <span className="mr-2 font-mono">{rider.company.company_id}</span>
                            )}
                            {rider.company.email}
                            {rider.company.is_active === false && (
                              <span className="ml-2 text-red-500">· Inactive</span>
                            )}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          View
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                    ) : (
                      <p className="text-sm text-gray-400 pl-1">No company assigned</p>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Vehicle</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <InfoRow label="Type" value={rider.vehicle_type} />
                      <InfoRow label="Plate Number" value={rider.plate_number} />
                      <InfoRow label="License Number" value={rider.driver_license_number} />
                    </div>
                  </div>

                  {/* Guarantor */}
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Guarantor</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <InfoRow label="Name" value={rider.guarantor_name} />
                      <InfoRow label="Phone" value={rider.guarantor_phone} />
                    </div>
                  </div>

                  {/* Photos */}
                  {(rider.rider_photo_url || rider.vehicle_photo_url || rider.plate_photo_url) && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Photos</p>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { url: rider.rider_photo_url, label: "Rider" },
                          { url: rider.vehicle_photo_url, label: "Vehicle" },
                          { url: rider.plate_photo_url, label: "Plate" },
                        ]
                          .filter((p) => p.url)
                          .map((p) => (
                            <a key={p.label} href={p.url} target="_blank" rel="noreferrer">
                              <img
                                src={p.url}
                                alt={p.label}
                                className="w-24 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                              />
                              <p className="text-xs text-center text-gray-500 mt-1">{p.label}</p>
                            </a>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Status actions */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Actions</p>
                    <div className="flex gap-2">
                      {rider.status !== "active" && (
                        <button
                          onClick={() => handleStatusChange("active")}
                          disabled={statusUpdating}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                      {rider.status !== "inactive" && (
                        <button
                          onClick={() => handleStatusChange("inactive")}
                          disabled={statusUpdating}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          Set Inactive
                        </button>
                      )}
                      {rider.status !== "suspended" && (
                        <button
                          onClick={() => handleStatusChange("suspended")}
                          disabled={statusUpdating}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {tab === "orders" && (
                <div>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-red-500 mb-2">{ordersError}</p>
                      <button onClick={loadOrders} className="text-xs text-blue-600 hover:underline">
                        Retry
                      </button>
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No deliveries yet</p>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((order) => (
                        <div key={order.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-medium text-gray-800">
                                {order.order_id ?? order.id?.slice(0, 8)}
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                  {
                                    delivered: "bg-green-100 text-green-700",
                                    cancelled: "bg-red-100 text-red-700",
                                    pending: "bg-yellow-100 text-yellow-700",
                                  }[order.status] ?? "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {order.status}
                              </span>
                              {order.payment_type === "pay_on_delivery" && (
                                <span className="text-[11px] font-medium text-orange-600">COD</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{order.pickup_address ?? "—"} → {order.dropoff_address ?? "—"}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium text-gray-800">
                              {fmt(
                                (parseFloat(order.base_fee) || 0) +
                                  (parseFloat(order.distance_fee) || 0) +
                                  (parseFloat(order.weight_fee) || 0) +
                                  (parseFloat(order.delivery_type_fee) || 0) ||
                                  order.amount_paid
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{fmtDate(order.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ratings Tab */}
              {tab === "ratings" && (
                <div>
                  {rider.recent_ratings?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No ratings yet</p>
                  ) : (
                    <div className="space-y-3">
                      {rider.recent_ratings?.map((r) => (
                        <div key={r.id ?? r.order_id} className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-1.5">
                            <Stars rating={r.rating} />
                            <span className="text-xs text-gray-400">{fmtDate(r.created_at)}</span>
                          </div>
                          {r.comment && <p className="text-sm text-gray-600 italic">"{r.comment}"</p>}
                          {r.order_id && (
                            <p className="text-xs text-gray-400 mt-1.5">Order: {r.order_id}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Trust Tab */}
              {tab === "trust" && (
                <div>
                  {trustLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : trustData ? (
                    <TrustScorePanel
                      score={trustData.scores.rider}
                      log={trustData.log}
                      editing={trustEditing}
                      editScore={editScore}
                      editReason={editReason}
                      saving={trustSaving}
                      recomputing={trustRecomputing}
                      onEditOpen={() => { setEditScore(String(trustData.scores.rider)); setEditReason(""); setTrustEditing(true); }}
                      onEditClose={() => setTrustEditing(false)}
                      onScoreChange={setEditScore}
                      onReasonChange={setEditReason}
                      onSave={handleTrustSave}
                      onRecompute={handleTrustRecompute}
                    />
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-10">Could not load trust data.</p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800 font-medium mt-0.5">{value ?? "—"}</p>
    </div>
  );
}

// ─── Inline trust badge for list rows ────────────────────────────────────────

function TrustBadge({ score }) {
  const n = Number(score ?? 60);
  let cls;
  if      (n >= 85) cls = "bg-green-100 text-green-800";
  else if (n >= 70) cls = "bg-blue-100 text-blue-800";
  else if (n >= 50) cls = "bg-yellow-100 text-yellow-800";
  else if (n >= 30) cls = "bg-orange-100 text-orange-800";
  else              cls = "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {n}
    </span>
  );
}

// ─── Shared TrustScore Panel (admin-only) ─────────────────────────────────────

const TRUST_BAND = [
  { min: 85, label: "Low Risk",    bg: "bg-green-100",  text: "text-green-800",  bar: "bg-green-500"  },
  { min: 70, label: "Normal",      bg: "bg-blue-100",   text: "text-blue-800",   bar: "bg-blue-500"   },
  { min: 50, label: "Medium Risk", bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-yellow-500" },
  { min: 30, label: "High Risk",   bg: "bg-orange-100", text: "text-orange-800", bar: "bg-orange-500" },
  { min: 0,  label: "Critical",    bg: "bg-red-100",    text: "text-red-800",    bar: "bg-red-500"    },
];

function trustBand(score) {
  return TRUST_BAND.find((b) => score >= b.min) ?? TRUST_BAND[4];
}

function fmtTs(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function TrustScorePanel({
  score, log, editing, editScore, editReason, saving, recomputing,
  onEditOpen, onEditClose, onScoreChange, onReasonChange, onSave, onRecompute,
}) {
  const n    = Number(score ?? 60);
  const band = trustBand(n);

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="bg-gray-50 rounded-xl p-5">
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-3">TrustScore</p>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-gray-900">{n}</div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${band.bg} ${band.text}`}>
              {band.label}
            </span>
            <p className="text-xs text-gray-400 mt-1">Range 0–100 · Resets if no activity in 30 days</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${band.bar}`} style={{ width: `${n}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>0 Critical</span><span>30 High</span><span>50 Medium</span><span>70 Normal</span><span>85+ Low</span>
        </div>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-700">Override TrustScore</p>
          <div>
            <label className="text-xs text-gray-500 block mb-1">New Score (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={editScore}
              onChange={(e) => onScoreChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Reason (optional)</label>
            <input
              type="text"
              value={editReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g. Multiple customer complaints"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={onEditClose} className="px-4 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={onEditOpen} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Score
          </button>
          <button
            onClick={onRecompute}
            disabled={recomputing}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {recomputing ? "Recomputing…" : "Recompute from 30-day history"}
          </button>
        </div>
      )}

      {/* Admin log */}
      <div>
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Change History</p>
        {log.length === 0 ? (
          <p className="text-xs text-gray-400">No changes recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {log.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg text-xs">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-700">
                    {entry.old_score ?? "—"} → {entry.new_score}
                  </span>
                  {entry.reason && <span className="text-gray-500 ml-2">· {entry.reason}</span>}
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${entry.source === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"}`}>
                    {entry.source}
                  </span>
                </div>
                <span className="text-gray-400 whitespace-nowrap shrink-0">{fmtTs(entry.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LIMIT = 25;

export default function AllRiders({ presetStatus = "all", presetVehicle = "all" }) {
  const searchParams = useSearchParams();
  const [riders, setRiders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(presetStatus);
  const [vehicleType, setVehicleType] = useState(presetVehicle);

  const [stats, setStats] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState(null);

  // Auto-open a rider when navigated from another page with ?open=riderId
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (openId) setSelectedRiderId(openId);
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, vehicleType]);

  const loadRiders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getAllRiders({
      page,
      limit: LIMIT,
      search: debouncedSearch,
      status,
      vehicleType,
    });
    if (res.success) {
      setRiders(res.data);
      setTotal(res.total);
    } else {
      setError(res.error);
      console.error("Riders load error:", res.error);
    }
    setLoading(false);
  }, [page, debouncedSearch, status, vehicleType]);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  // Load stats once
  useEffect(() => {
    getRiderStats().then((res) => {
      if (res.success) setStats(res.stats);
    });
  }, []);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">All Riders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage rider accounts, statuses, and performance</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Active", value: stats.active, color: "text-green-600" },
            { label: "Inactive", value: stats.inactive, color: "text-gray-500" },
            { label: "Suspended", value: stats.suspended, color: "text-red-600" },
            { label: "Bikes", value: stats.bikes, color: "text-blue-600" },
            { label: "Cars", value: stats.cars, color: "text-indigo-600" },
            { label: "Avg Rating", value: stats.avgRating?.toFixed(1) ?? "—", color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, phone, plate number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="px-3 py-2 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Vehicles</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* ── Mobile card list ── */}
        <div className="sm:hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-red-500 mb-2">{error}</p>
              <button onClick={loadRiders} className="text-xs text-blue-600 hover:underline">Retry</button>
            </div>
          ) : riders.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">
              {search || status !== "all" ? "No riders match your filters" : "No riders yet"}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {riders.map((rider) => (
                <button
                  key={rider.id}
                  onClick={() => setSelectedRiderId(rider.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {rider.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{rider.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${STATUS_COLORS[rider.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {rider.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{rider.phone}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-600 capitalize">{rider.vehicle_type} · {rider.plate_number}</span>
                        {rider.average_rating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-amber-600">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            {Number(rider.average_rating).toFixed(1)}
                          </span>
                        )}
                        <TrustBadge score={rider.rider_trust_score} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Rider", "Contact", "Vehicle", "Status", "Rating", "Trust", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-500 mb-2">{error}</p>
                    <button onClick={loadRiders} className="text-xs text-blue-600 hover:underline">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    {search || status !== "all" ? "No riders match your filters" : "No riders yet"}
                  </td>
                </tr>
              ) : (
                riders.map((rider) => (
                  <tr
                    key={rider.id}
                    onClick={() => setSelectedRiderId(rider.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {rider.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rider.name}</p>
                          <p className="text-xs text-gray-400">{rider.id?.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{rider.email}</p>
                      <p className="text-xs text-gray-400">{rider.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 capitalize">{rider.vehicle_type}</p>
                      <p className="text-xs text-gray-400">{rider.plate_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[rider.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {rider.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {rider.average_rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-700">{Number(rider.average_rating).toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({rider.total_ratings ?? 0})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No ratings</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TrustBadge score={rider.rider_trust_score} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(rider.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} riders
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {!loading && !error && riders.length > 0 && totalPages <= 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {riders.length} of {total} riders</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedRiderId && (
        <RiderModal
          riderId={selectedRiderId}
          onClose={() => setSelectedRiderId(null)}
          onStatusChange={loadRiders}
        />
      )}
    </div>
  );
}
