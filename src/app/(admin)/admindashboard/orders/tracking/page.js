"use client";

import { useState } from "react";
import { getOrderByTracking } from "@/lib/server-actions/admin/manageOrders";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_STEPS = ["pending", "accepted", "picked_up", "in_transit", "delivered"];

function StepLabel(s) {
  return {
    pending: "Pending",
    accepted: "Accepted",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    delivered: "Delivered",
  }[s] ?? s;
}

function fmt(n) {
  return `\u20A6${Number(n || 0).toLocaleString()}`;
}

function totalFee(order) {
  const breakdown =
    (parseFloat(order.base_fee) || 0) +
    (parseFloat(order.distance_fee) || 0) +
    (parseFloat(order.weight_fee) || 0) +
    (parseFloat(order.delivery_type_fee) || 0);
  return breakdown > 0 ? breakdown : parseFloat(order.amount_paid) || 0;
}

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);
    const res = await getOrderByTracking(query.trim());
    if (res.success) setOrder(res.data);
    else setError(res.error);
    setLoading(false);
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Order Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search for an order by tracking number (e.g. RXTK-A1B2C3)
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Enter tracking number or order ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* No result */}
      {searched && !loading && !error && !order && (
        <div className="text-center py-10 text-gray-400 text-sm">No order found for "{query}"</div>
      )}

      {/* Result */}
      {order && !loading && (
        <div className="space-y-5">
          {/* Status header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  #{order.order_id ?? order.id?.slice(0, 8)}
                </p>
                <p className="text-sm font-mono text-gray-500 mt-0.5">{order.tracking_number}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {order.status?.replace("_", " ")}
              </span>
            </div>

            {/* Progress tracker */}
            {!isCancelled ? (
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  const last = idx === STATUS_STEPS.length - 1;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            done ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {done ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-center leading-tight max-w-12">
                          {StepLabel(step)}
                        </p>
                      </div>
                      {!last && (
                        <div
                          className={`flex-1 h-0.5 mx-1 transition-colors ${
                            idx < currentStep ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Order Cancelled
              </div>
            )}
          </div>

          {/* Route */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Route</h3>
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="w-px flex-1 bg-gray-200 min-h-[24px]" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Pickup</p>
                  <p className="text-sm text-gray-800">{order.pickup_address ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-gray-400">Drop-off</p>
                  <p className="text-sm text-gray-800">{order.dropoff_address ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Details</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Recipient", order.recipient_name ?? "—"],
                ["Recipient Phone", order.recipient_phone ?? "—"],
                ["Weight", order.package_weight ? `${order.package_weight} kg` : "—"],
                ["Distance", order.distance_km ? `${parseFloat(order.distance_km).toFixed(1)} km` : "—"],
                ["Delivery Type", order.delivery_type ?? "—"],
                ["Payment", order.payment_type === "pay_on_delivery" ? "Pay on Delivery" : "Prepaid"],
                ["Delivery Fee", fmt(totalFee(order))],
                ...(order.payment_type === "pay_on_delivery"
                  ? [
                      ["COD Amount", fmt(order.cod_amount)],
                      ["COD Collected", order.cod_collected ? "Yes" : "No"],
                    ]
                  : []),
                ["Placed On", order.created_at ? new Date(order.created_at).toLocaleString("en-NG") : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
