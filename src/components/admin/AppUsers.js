"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import {
  getAppUsers,
  getAppUserDetail,
  getUserOrderHistory,
  getUserRatingsGiven,
  getUserBusinessRatings,
} from "@/lib/server-actions/admin/manageAppUsers";
import {
  getTrustScore,
  setTrustScore,
  recomputeTrustScore,
} from "@/lib/server-actions/admin/manageTrustScore";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtMoney(n) {
  return `₦${(n ?? 0).toLocaleString()}`;
}

/** Compute the total delivery fee from fee breakdown columns */
function totalFee(order) {
  const prepaid = (order.base_fee ?? 0) + (order.distance_fee ?? 0) +
    (order.weight_fee ?? 0) + (order.delivery_type_fee ?? 0);
  if (prepaid > 0) return prepaid;
  // Fallback for COD or missing breakdown
  return order.amount_paid ?? order.cod_amount ?? 0;
}

const STATUS_PILL = {
  pending:    "bg-amber-100 text-amber-700",
  searching:  "bg-sky-100 text-sky-700",
  assigned:   "bg-indigo-100 text-indigo-700",
  picked_up:  "bg-purple-100 text-purple-700",
  in_transit: "bg-violet-100 text-violet-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

function Stars({ rating, size = "sm" }) {
  const cls = size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={`inline-flex gap-0.5 ${cls}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppUsers() {
  const { admin, loading: authLoading } = useAdmin();
  const searchParams = useSearchParams();

  // List
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Detail modal
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Ratings tab
  const [ratingsGiven, setRatingsGiven] = useState([]);
  const [ratingsReceived, setRatingsReceived] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  // Trust tab
  const [trustData, setTrustData]             = useState(null);
  const [trustLoading, setTrustLoading]       = useState(false);
  const [trustEditing, setTrustEditing]       = useState(false);
  const [editScore, setEditScore]             = useState("");
  const [editReason, setEditReason]           = useState("");
  const [trustSaving, setTrustSaving]         = useState(false);
  const [trustRecomputing, setTrustRecomputing] = useState(false);

  const LIMIT = 20;
  const ORDERS_LIMIT = 15;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const res = await getAppUsers({ page, limit: LIMIT, search, role: roleFilter });
    if (res.success) { setUsers(res.data); setTotal(res.total); }
    else setFetchError(res.error);
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => { if (!authLoading && admin) fetchUsers(); }, [admin, authLoading, fetchUsers]);

  // Open user detail modal
  const openUser = async (user) => {
    setSelected(user);
    setDetail(null);
    setActiveTab("profile");
    setOrders([]); setOrdersTotal(0); setOrdersPage(1); setOrdersError(null);
    setRatingsGiven([]); setRatingsReceived([]);
    setTrustData(null); setTrustEditing(false); setEditScore(""); setEditReason("");
    setDetailLoading(true);
    const res = await getAppUserDetail(user.user_id);
    if (res.success) setDetail(res.data);
    setDetailLoading(false);
  };

  const closeModal = () => { setSelected(null); setDetail(null); };

  // Auto-open a user when navigated from another page with ?open=userId
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (!openId || !admin) return;
    // Open the user directly by ID without needing them to be in the current list page
    openUser({ user_id: openId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, admin]);

  // Load orders tab
  const loadOrders = useCallback(async (uid, p = 1) => {
    setOrdersLoading(true);
    setOrdersError(null);
    const res = await getUserOrderHistory(uid, { page: p, limit: ORDERS_LIMIT });
    if (res.success) {
      setOrders(res.data);
      setOrdersTotal(res.total);
      setOrdersPage(p);
    } else {
      console.error("[AppUsers] loadOrders error:", res.error);
      setOrdersError(res.error);
    }
    setOrdersLoading(false);
  }, []);

  // Load ratings tab
  const loadRatings = useCallback(async (uid, role) => {
    setRatingsLoading(true);
    const [given, received] = await Promise.all([
      getUserRatingsGiven(uid),
      role === "business" ? getUserBusinessRatings(uid) : Promise.resolve({ success: true, data: [] }),
    ]);
    if (given.success) setRatingsGiven(given.data);
    if (received.success) setRatingsReceived(received.data);
    setRatingsLoading(false);
  }, []);

  const loadTrust = useCallback(async (userId) => {
    setTrustLoading(true);
    const res = await getTrustScore("user", userId);
    if (res.success) setTrustData(res);
    setTrustLoading(false);
  }, []);

  const handleTrustSave = async () => {
    const val = parseInt(editScore, 10);
    if (isNaN(val) || val < 0 || val > 100) { alert("Score must be 0–100"); return; }
    setTrustSaving(true);
    const userId = detail?.user_id || selected?.user_id;
    const res = await setTrustScore("user", userId, val, editReason);
    if (res.success) {
      setTrustEditing(false); setEditScore(""); setEditReason("");
      await loadTrust(userId);
    } else {
      alert(res.error || "Failed to update score");
    }
    setTrustSaving(false);
  };

  const handleTrustRecompute = async () => {
    const userId = detail?.user_id || selected?.user_id;
    if (!confirm("Recompute trust score from last 30 days of activity?")) return;
    setTrustRecomputing(true);
    const res = await recomputeTrustScore("user", userId);
    if (res.success) await loadTrust(userId);
    else alert(res.error || "Failed to recompute");
    setTrustRecomputing(false);
  };

  const handleTab = (tab) => {
    setActiveTab(tab);
    const uid = detail?.user_id || selected?.user_id;
    const role = detail?.role || selected?.role;
    // Always reload orders when switching to tab (fresh data, no stale cache)
    if (tab === "orders" && uid) loadOrders(uid, 1);
    // Only load ratings once per modal open (no side-effects from re-clicking)
    if (tab === "ratings" && ratingsGiven.length === 0 && ratingsReceived.length === 0 && uid) loadRatings(uid, role);
    // Load trust data once per modal open
    if (tab === "trust" && !trustData && uid) loadTrust(uid);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const ordersTotalPages = Math.ceil(ordersTotal / ORDERS_LIMIT);
  const uid = detail?.user_id || selected?.user_id;
  const userRole = detail?.role || selected?.role;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">App Users</h1>
        <p className="text-gray-500 mt-1 text-sm">Browse all registered customers, their orders, and ratings.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email, phone or ID…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
        />
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-400">Type:</span>
          {["all", "individual", "business"].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                roleFilter === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-400">{total.toLocaleString()} users</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 font-semibold mb-1">Failed to load users</p>
            <p className="text-xs text-red-400 font-mono bg-red-50 rounded p-3 text-left break-all mt-2">{fetchError}</p>
            <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No users found.</div>
        ) : (
          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-gray-100">
            {users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => openUser(u)}
                className="w-full text-left p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{u.full_name || "—"}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    u.role === "business" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role === "business" ? "Business" : "Individual"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{u.phone || "—"}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs font-medium text-gray-700">{fmtMoney(u.wallet_balance)}</span>
                  <UserTrustBadge score={u.user_trust_score} />
                  <span className="text-xs text-gray-400 ml-auto">{fmtShort(u.created_at)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["User", "Phone", "Email", "Type", "Wallet", "Trust", "Joined", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{u.full_name || "—"}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{u.user_id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{u.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        u.role === "business" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role === "business" ? "Business" : "Individual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{fmtMoney(u.wallet_balance)}</td>
                    <td className="px-4 py-3"><UserTrustBadge score={u.user_trust_score} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtShort(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openUser(u)} className="text-blue-600 text-sm font-medium hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
            Next
          </button>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl flex flex-col" style={{ maxHeight: "92vh" }}>

            {/* Modal header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900">
                    {detail?.full_name || selected.full_name || "User Profile"}
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    userRole === "business" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {userRole === "business" ? "Business" : "Individual"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selected.user_id}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none ml-4 shrink-0">
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 shrink-0 px-5">
              {[
                { key: "profile", label: "Profile" },
                { key: "orders", label: `Orders${detail ? ` (${detail.order_stats?.total ?? 0})` : ""}` },
                { key: "ratings", label: "Ratings" },
                { key: "trust", label: "TrustScore" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleTab(key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto min-h-0">

              {/* ── Profile ── */}
              {activeTab === "profile" && (
                <div className="p-5">
                  {detailLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : detail ? (
                    <div className="space-y-4">
                      {/* Personal */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Information</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {[
                            ["Full Name", detail.full_name],
                            ["Phone", detail.phone],
                            ["Email", detail.email],
                            ["Account ID", detail.user_id],
                            ["Account Type", detail.role],
                            ["Member Since", fmtShort(detail.created_at)],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <p className="text-xs text-gray-400">{label}</p>
                              <p className="text-gray-800 font-medium capitalize mt-0.5">{value || "—"}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Wallet */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Wallet</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-400">Wallet Balance</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">{fmtMoney(detail.wallet_balance)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Promo Balance</p>
                            <p className="text-xl font-bold text-gray-700 mt-0.5">{fmtMoney(detail.promo_balance)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Order stats */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Statistics</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "Total", value: detail.order_stats?.total ?? 0, color: "text-gray-900" },
                            { label: "Completed", value: detail.order_stats?.completed ?? 0, color: "text-green-600" },
                            { label: "Cancelled", value: detail.order_stats?.cancelled ?? 0, color: "text-red-500" },
                            { label: "Active", value: detail.order_stats?.in_progress ?? 0, color: "text-blue-600" },
                          ].map((s) => (
                            <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Business info */}
                      {detail.role === "business" && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                          <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-3">Business Account</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-purple-400">Business Rating</p>
                              {(detail.business_rating ?? 0) > 0 ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Stars rating={detail.business_rating} />
                                  <span className="font-semibold text-gray-700">{Number(detail.business_rating).toFixed(1)}</span>
                                  <span className="text-xs text-gray-400">({detail.business_total_ratings ?? 0} reviews)</span>
                                </div>
                              ) : (
                                <p className="text-gray-500 mt-0.5">No ratings yet</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-purple-400">COD Trials Remaining</p>
                              <p className="text-gray-800 font-semibold mt-0.5">{detail.cod_trial_remaining ?? 5}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8 text-sm">Could not load user details.</p>
                  )}
                </div>
              )}

              {/* ── Orders ── */}
              {activeTab === "orders" && (
                <div className="p-5">
                  {ordersLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : ordersError ? (
                    <div className="py-6">
                      <p className="text-red-600 font-semibold text-sm mb-1">Failed to load orders</p>
                      <p className="text-xs text-red-400 font-mono bg-red-50 rounded p-3 break-all">{ordersError}</p>
                      <button
                        onClick={() => loadOrders(uid, 1)}
                        className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">No orders found.</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-3">{ordersTotal} total orders</p>
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-mono text-xs font-bold text-blue-600">
                                  {order.tracking_number || order.order_id}
                                </p>
                                <p className="text-xs text-gray-400">{fmt(order.created_at)}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_PILL[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                                  {(order.status ?? "").replace(/_/g, " ")}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  order.payment_type === "pay_on_delivery" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                }`}>
                                  {order.payment_type === "pay_on_delivery" ? "COD" : "Prepaid"}
                                </span>
                                {order.is_bulk_order && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">Bulk</span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><span className="text-gray-400">From:</span> {order.pickup_address || "—"}</p>
                              <p><span className="text-gray-400">To:</span> {order.dropoff_address || "—"}</p>
                              {order.recipient_name && (
                                <p><span className="text-gray-400">Recipient:</span> {order.recipient_name}
                                  {order.recipient_phone ? ` · ${order.recipient_phone}` : ""}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-1.5 pt-1.5 border-t border-gray-200">
                                <p><span className="text-gray-400">Fee: </span>
                                  <span className="font-semibold text-gray-700">{fmtMoney(totalFee(order))}</span>
                                </p>
                                {order.payment_type === "pay_on_delivery" && (
                                  <p><span className="text-gray-400">COD: </span>
                                    <span className="font-semibold text-amber-700">{fmtMoney(order.cod_amount)}</span>
                                    {order.cod_payer && <span className="text-gray-400"> ({order.cod_payer})</span>}
                                  </p>
                                )}
                                {order.distance_km > 0 && (
                                  <p><span className="text-gray-400">Distance: </span>{order.distance_km} km</p>
                                )}
                                <p><span className="text-gray-400">Weight: </span>{order.package_weight || "—"}</p>
                                <p><span className="text-gray-400">Type: </span>{order.delivery_type || "—"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {ordersTotalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                          <button onClick={() => loadOrders(uid, ordersPage - 1)} disabled={ordersPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                            Previous
                          </button>
                          <span className="px-3 py-1.5 text-sm text-gray-500">Page {ordersPage} of {ordersTotalPages}</span>
                          <button onClick={() => loadOrders(uid, ordersPage + 1)} disabled={ordersPage === ordersTotalPages}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Ratings ── */}
              {activeTab === "ratings" && (
                <div className="p-5">
                  {ratingsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Ratings given to riders */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          Ratings given to riders
                          <span className="ml-2 text-xs font-normal text-gray-400">({ratingsGiven.length})</span>
                        </h3>
                        {ratingsGiven.length === 0 ? (
                          <p className="text-xs text-gray-400 py-3 pl-1">No ratings given yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {ratingsGiven.map((r) => (
                              <div key={r.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Stars rating={r.rating} />
                                    <span className="text-sm font-semibold text-gray-700">{r.rating}/5</span>
                                    <span className="text-xs text-gray-400">
                                      for rider <span className="font-mono">{r.rider_id}</span>
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">{fmtShort(r.created_at)}</span>
                                </div>
                                {r.comment && (
                                  <p className="text-xs text-gray-600 mt-1.5 italic">"{r.comment}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Business ratings received (business only) */}
                      {userRole === "business" && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Business ratings received from riders
                            <span className="ml-2 text-xs font-normal text-gray-400">({ratingsReceived.length})</span>
                          </h3>
                          {ratingsReceived.length === 0 ? (
                            <p className="text-xs text-gray-400 py-3 pl-1">No business ratings yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {ratingsReceived.map((r) => (
                                <div key={r.id} className="border border-purple-200 rounded-xl p-3 bg-purple-50">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <Stars rating={r.rating} />
                                      <span className="text-sm font-semibold text-gray-700">{r.rating}/5</span>
                                      <span className="text-xs text-gray-400">
                                        by rider <span className="font-mono">{r.rider_id}</span>
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400">{fmtShort(r.created_at)}</span>
                                  </div>
                                  {r.comment && (
                                    <p className="text-xs text-gray-600 mt-1.5 italic">"{r.comment}"</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {ratingsGiven.length === 0 && (userRole !== "business" || ratingsReceived.length === 0) && (
                        <p className="text-center text-gray-400 py-4 text-sm">No ratings data available.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Trust ── */}
              {activeTab === "trust" && (
                <div className="p-5">
                  {trustLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : trustData ? (
                    <div className="space-y-5">
                      <UserTrustCard
                        label="TrustScore"
                        score={trustData.scores.user}
                        log={trustData.log.filter((l) => l.entity_type === "user")}
                        editing={trustEditing}
                        editScore={editScore}
                        editReason={editReason}
                        saving={trustSaving}
                        recomputing={trustRecomputing}
                        onEditOpen={() => { setEditScore(String(trustData.scores.user)); setEditReason(""); setTrustEditing(true); }}
                        onEditClose={() => setTrustEditing(false)}
                        onScoreChange={setEditScore}
                        onReasonChange={setEditReason}
                        onSave={handleTrustSave}
                        onRecompute={handleTrustRecompute}
                        canRecompute
                      />
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8 text-sm">Could not load trust data.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline trust badge for user list rows ────────────────────────────────────

function UserTrustBadge({ score }) {
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

// ─── Trust helpers (user modal) ───────────────────────────────────────────────

const TRUST_BAND_USER = [
  { min: 85, label: "Low Risk",    bg: "bg-green-100",  text: "text-green-800",  bar: "bg-green-500"  },
  { min: 70, label: "Normal",      bg: "bg-blue-100",   text: "text-blue-800",   bar: "bg-blue-500"   },
  { min: 50, label: "Medium Risk", bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-yellow-500" },
  { min: 30, label: "High Risk",   bg: "bg-orange-100", text: "text-orange-800", bar: "bg-orange-500" },
  { min: 0,  label: "Critical",    bg: "bg-red-100",    text: "text-red-800",    bar: "bg-red-500"    },
];

function userTrustBand(score) {
  const n = Number(score ?? 60);
  return TRUST_BAND_USER.find((b) => n >= b.min) ?? TRUST_BAND_USER[4];
}

function fmtTsUser(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function UserTrustCard({
  label, score, log, editing, editScore, editReason, saving, recomputing,
  canRecompute, onEditOpen, onEditClose, onScoreChange, onReasonChange, onSave, onRecompute,
}) {
  const n = Number(score ?? 60);
  const band = userTrustBand(n);
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide">{label}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-gray-900">{n}</div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${band.bg} ${band.text}`}>
          {band.label}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${n}%` }} />
      </div>

      {editing ? (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">New Score (0–100)</label>
            <input type="number" min={0} max={100} value={editScore} onChange={(e) => onScoreChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Reason (optional)</label>
            <input type="text" value={editReason} onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Reason for change"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900" />
          </div>
          <div className="flex gap-2">
            <button onClick={onSave} disabled={saving}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={onEditClose} className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <button onClick={onEditOpen} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit
          </button>
          {canRecompute && (
            <button onClick={onRecompute} disabled={recomputing}
              className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
              {recomputing ? "Recomputing…" : "Recompute"}
            </button>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">Recent changes</p>
          {log.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{entry.old_score ?? "—"} → {entry.new_score}</span>
              {entry.reason && <span>· {entry.reason}</span>}
              <span className="ml-auto whitespace-nowrap shrink-0">{fmtTsUser(entry.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
