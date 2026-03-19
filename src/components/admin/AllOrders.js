"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  getAllOrders,
  getOrderDetail,
  getOrderStats,
} from "@/lib/server-actions/admin/manageOrders";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  picked_up: "bg-indigo-100 text-indigo-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

function totalFee(order) {
  const breakdown =
    (parseFloat(order.base_fee) || 0) +
    (parseFloat(order.distance_fee) || 0) +
    (parseFloat(order.weight_fee) || 0) +
    (parseFloat(order.delivery_type_fee) || 0);
  if (breakdown > 0) return breakdown;
  return parseFloat(order.amount_paid) || parseFloat(order.cod_amount) || 0;
}

function fmt(n) {
  return `\u20A6${Number(n || 0).toLocaleString()}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const goToUser = (userId) => {
    window.open(`/admindashboard/app-users?open=${userId}`, "_blank");
  };

  const goToRider = (riderId) => {
    window.open(`/admindashboard/riders?open=${riderId}`, "_blank");
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getOrderDetail(orderId);
      if (cancelled) return;
      if (res.success) setOrder(res.data);
      else setError(res.error);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
            {order && (
              <p className="text-xs text-gray-500 mt-0.5">
                #{order.order_id ?? order.id?.slice(0, 8)}
              </p>
            )}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-sm">{error}</div>
          ) : order ? (
            <>
              {/* Status + Tracking */}
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={order.status} />
                {order.payment_type === "pay_on_delivery" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    COD
                  </span>
                )}
                {order.is_bulk_order && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800">
                    Bulk
                  </span>
                )}
                {order.tracking_number && (
                  <span className="text-xs font-mono text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                    {order.tracking_number}
                  </span>
                )}
              </div>

              {/* Pickup / Dropoff */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="w-px flex-1 bg-gray-300 min-h-[20px]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">Pickup</p>
                      <p className="text-sm text-gray-800">{order.pickup_address ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">Drop-off</p>
                      <p className="text-sm text-gray-800">{order.dropoff_address ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Package</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Row label="Recipient" value={order.recipient_name ?? "—"} />
                  <Row label="Recipient Phone" value={order.recipient_phone ?? "—"} />
                  <Row label="Weight" value={order.package_weight ? `${order.package_weight} kg` : "—"} />
                  <Row label="Delivery Type" value={order.delivery_type ?? "—"} />
                  <Row label="Distance" value={order.distance_km ? `${parseFloat(order.distance_km).toFixed(1)} km` : "—"} />
                </div>
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Payment</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Row label="Delivery Fee" value={fmt(totalFee(order))} />
                  <Row
                    label="Payment Type"
                    value={order.payment_type === "pay_on_delivery" ? "Pay on Delivery (COD)" : "Prepaid"}
                  />
                  {order.payment_type === "pay_on_delivery" && (
                    <>
                      <Row label="COD Amount" value={fmt(order.cod_amount)} />
                      <Row label="COD Payer" value={order.cod_payer ?? "—"} />
                      <Row label="COD Collected" value={order.cod_collected ? "Yes" : "No"} />
                    </>
                  )}
                </div>
              </div>

              {/* User */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Customer</p>
                {order.user ? (
                  <button
                    onClick={() => goToUser(order.user.user_id)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-xl transition-colors group text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {order.user.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{order.user.full_name ?? "—"}</p>
                      <p className="text-xs text-gray-500">
                        {order.user.user_id} · {order.user.phone ?? "—"}
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
                  <p className="text-sm text-gray-400 pl-1">User data unavailable</p>
                )}
              </div>

              {/* Rider */}
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-2">Rider</p>
                {!order.rider_id ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-400">
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16a3 3 0 100-6 3 3 0 000 6zM7 16a3 3 0 100-6 3 3 0 000 6zM7 13h4l2-4h2" />
                    </svg>
                    Rider not yet assigned
                  </div>
                ) : order.rider ? (
                  <button
                    onClick={() => goToRider(order.rider.id)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-xl transition-colors group text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {order.rider.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{order.rider.name}</p>
                      <p className="text-xs text-gray-500">
                        {order.rider.vehicle_type} · {order.rider.plate_number} · {order.rider.phone}
                      </p>
                    </div>
                    {order.rider.average_rating > 0 && (
                      <div className="flex items-center gap-1 text-sm font-medium text-amber-600 flex-shrink-0">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {Number(order.rider.average_rating).toFixed(1)}
                      </div>
                    )}
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      View
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => goToRider(order.rider_id)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-xl transition-colors group text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16a3 3 0 100-6 3 3 0 000 6zM7 16a3 3 0 100-6 3 3 0 000 6zM7 13h4l2-4h2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">Rider Assigned</p>
                      <p className="text-xs text-gray-400 truncate">ID: {order.rider_id}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      View
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>

              {/* Timestamps */}
              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Row label="Created" value={fmtDate(order.created_at)} />
                  {order.updated_at && <Row label="Updated" value={fmtDate(order.updated_at)} />}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800 font-medium mt-0.5">{value}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STATUSES = ["all", "pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"];
const LIMIT = 25;

export default function AllOrders({ presetStatus = "all" }) {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(presetStatus);
  const [paymentType, setPaymentType] = useState("all");

  const [stats, setStats] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Auto-open order from ?open= query param (e.g. navigated from support ticket)
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (openId) setSelectedOrderId(openId);
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, paymentType]);

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getAllOrders({
      page,
      limit: LIMIT,
      search: debouncedSearch,
      status,
      paymentType,
    });
    if (res.success) {
      setOrders(res.data);
      setTotal(res.total);
    } else {
      setError(res.error);
      console.error("Orders load error:", res.error);
    }
    setLoading(false);
  }, [page, debouncedSearch, status, paymentType]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Load stats once
  useEffect(() => {
    getOrderStats().then((res) => {
      if (res.success) setStats(res.stats);
    });
  }, []);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">All Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and view all delivery orders</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Pending", value: stats.pending, color: "text-yellow-600" },
            { label: "Active", value: stats.active, color: "text-blue-600" },
            { label: "Delivered", value: stats.delivered, color: "text-green-600" },
            { label: "Cancelled", value: stats.cancelled, color: "text-red-600" },
            { label: "COD Orders", value: stats.codOrders, color: "text-orange-600" },
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
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by order ID, tracking #, user, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : STATUS_LABEL[s] ?? s}
              </option>
            ))}
          </select>

          {/* Payment type */}
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="px-3 py-2 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payment Types</option>
            <option value="prepaid">Prepaid</option>
            <option value="pay_on_delivery">Pay on Delivery (COD)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Order ID", "User", "Pickup → Dropoff", "Status", "Type", "Fee", "Date"].map((h) => (
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
                    <button onClick={loadOrders} className="text-xs text-blue-600 hover:underline">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    {search || status !== "all" ? "No orders match your filters" : "No orders yet"}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-medium text-gray-900">
                        {order.order_id ?? order.id?.slice(0, 8)}
                      </p>
                      {order.tracking_number && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{order.tracking_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{order.user_id ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      <p className="text-xs text-gray-700 truncate">{order.pickup_address ?? "—"}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">→ {order.dropoff_address ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={order.status} />
                        {order.payment_type === "pay_on_delivery" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 w-fit">
                            COD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                      {order.delivery_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {fmt(totalFee(order))}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
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
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} orders
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

        {/* Row count */}
        {!loading && !error && orders.length > 0 && totalPages <= 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {orders.length} of {total} orders</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedOrderId && (
        <OrderModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
