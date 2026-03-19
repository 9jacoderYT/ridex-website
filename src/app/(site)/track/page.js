"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { trackOrder } from "@/lib/server-actions/public/trackOrder";

// ── Status steps ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    sub: "Searching for a rider",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    key: "assigned",
    label: "Rider Assigned",
    sub: "A rider is heading to pick up",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 10-16 0" />
      </svg>
    ),
  },
  {
    key: "picked_up",
    label: "Package Picked Up",
    sub: "Rider has collected the package",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 10V6a2 2 0 00-2-2H5a2 2 0 00-2 2v4" />
        <path d="M3 10h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10z" />
        <path d="M12 10v12M8 14l4-4 4 4" />
      </svg>
    ),
  },
  {
    key: "in_transit",
    label: "In Transit",
    sub: "On the way to destination",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5" />
        <circle cx="16" cy="17" r="2" />
        <circle cx="10" cy="17" r="2" />
        <path d="M21 10h-5V5" />
      </svg>
    ),
  },
  {
    key: "delivered",
    label: "Delivered",
    sub: "Package delivered successfully",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusColor(status) {
  switch (status) {
    case "delivered":  return { dot: "bg-green-500",  badge: "bg-green-100 text-green-700",  label: "Delivered"   };
    case "in_transit": return { dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700",    label: "In Transit"  };
    case "picked_up":  return { dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700",label: "Picked Up"   };
    case "assigned":   return { dot: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700",label: "Rider Assigned" };
    case "cancelled":  return { dot: "bg-red-500",    badge: "bg-red-100 text-red-700",      label: "Cancelled"   };
    default:           return { dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-700",  label: "Pending"     };
  }
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Auto-search if ?number= param is present
  useEffect(() => {
    const num = searchParams?.get("number");
    if (num) {
      setInput(num);
      doSearch(num);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doSearch(tn) {
    const val = (tn ?? input).trim();
    if (!val) { setError("Please enter a tracking number."); return; }
    setError("");
    setResult(null);
    startTransition(async () => {
      const res = await trackOrder(val);
      if (res.success) {
        setResult(res.order);
        // Update URL without reload
        router.replace(`/track?number=${encodeURIComponent(res.order.tracking_number)}`, { scroll: false });
      } else {
        setError(res.error);
      }
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(input);
  };

  const sc = result ? statusColor(result.status) : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      {/* Header banner */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35M11 8v3l2 2" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Track Your Order</h1>
            <p className="text-green-100 text-sm sm:text-base">
              Enter your tracking number to see real-time delivery status
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="mt-8 flex gap-2 max-w-xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="e.g. RXTK-AB12CD"
              className="flex-1 px-4 py-3.5 rounded-xl text-gray-900 text-sm font-mono font-semibold placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3.5 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 disabled:opacity-60 transition-colors shadow-lg whitespace-nowrap text-sm"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeDasharray="32" strokeDashoffset="12" /></svg>
                  Tracking…
                </span>
              ) : "Track"}
            </button>
          </motion.form>
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-2xl mx-auto px-4 mt-8">
        <AnimatePresence mode="wait">

          {/* Error state */}
          {error && !isPending && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-500">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p className="text-red-700 font-semibold">{error}</p>
              <p className="text-red-500 text-sm mt-1">Double-check your tracking number and try again.</p>
            </motion.div>
          )}

          {/* Result */}
          {result && !isPending && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Status card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-1">{result.tracking_number}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      {result.is_bulk_order && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Bulk</span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        result.payment_type === "pay_on_delivery"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {result.payment_type === "pay_on_delivery" ? "Pay on Delivery" : "Prepaid"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">{fmt(result.created_at)}</p>
                </div>

                {/* Progress stepper */}
                {result.status !== "cancelled" ? (
                  <div className="p-5">
                    <div className="relative">
                      {STEPS.map((step, i) => {
                        const done = i <= result.step_index;
                        const active = i === result.step_index;
                        return (
                          <div key={step.key} className="flex gap-4 relative">
                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                              <div className={`absolute left-[19px] top-10 w-0.5 h-8 transition-colors ${
                                i < result.step_index ? "bg-green-500" : "bg-gray-200"
                              }`} />
                            )}
                            {/* Icon */}
                            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              done
                                ? active
                                  ? "bg-green-500 text-white ring-4 ring-green-100"
                                  : "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-400"
                            }`}>
                              {step.icon}
                            </div>
                            {/* Text */}
                            <div className={`pb-8 ${i === STEPS.length - 1 ? "pb-0" : ""}`}>
                              <p className={`text-sm font-semibold ${done ? "text-gray-900" : "text-gray-400"}`}>
                                {step.label}
                                {active && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-green-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className={`text-xs mt-0.5 ${done ? "text-gray-500" : "text-gray-300"}`}>{step.sub}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 flex items-center gap-3 text-red-600">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Order Cancelled</p>
                      <p className="text-xs text-red-400 mt-0.5">This order was cancelled and will not be delivered.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery details */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Details</p>

                <div className="space-y-3">
                  {/* Route */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center pt-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <div className="w-0.5 flex-1 bg-gray-200 my-1" style={{ minHeight: 20 }} />
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pickup</p>
                        <p className="text-sm text-gray-800 font-medium">{result.pickup_address || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Delivery</p>
                        <p className="text-sm text-gray-800 font-medium">{result.dropoff_address || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                    {result.recipient_name && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Recipient</p>
                        <p className="text-gray-800 font-medium mt-0.5">{result.recipient_name}</p>
                      </div>
                    )}
                    {result.delivery_type && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Delivery Type</p>
                        <p className="text-gray-800 font-medium mt-0.5 capitalize">{result.delivery_type.replace(/_/g, " ")}</p>
                      </div>
                    )}
                    {result.distance_km > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Distance</p>
                        <p className="text-gray-800 font-medium mt-0.5">{result.distance_km} km</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Last Updated</p>
                      <p className="text-gray-800 font-medium mt-0.5">{fmt(result.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rider info (only if assigned+) */}
              {result.rider && result.status !== "cancelled" && result.step_index >= 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Rider</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M20 21a8 8 0 10-16 0" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{result.rider.name}</p>
                      {result.rider.vehicle_type && (
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{result.rider.vehicle_type.replace(/_/g, " ")}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Track another */}
              <button
                onClick={() => { setResult(null); setInput(""); setError(""); router.replace("/track", { scroll: false }); }}
                className="w-full py-3 text-sm text-gray-500 hover:text-green-600 transition-colors font-medium"
              >
                Track a different order →
              </button>
            </motion.div>
          )}

          {/* Empty state (initial) */}
          {!result && !error && !isPending && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-400"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-300">
                  <path d="M21 10V6a2 2 0 00-2-2H5a2 2 0 00-2 2v4M3 10h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zM12 10v12M8 14l4-4 4 4" />
                </svg>
              </div>
              <p className="text-sm">Enter a tracking number above to get started</p>
              <p className="text-xs mt-1">Tracking numbers look like <span className="font-mono font-semibold text-gray-500">RXTK-AB12CD</span></p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function TrackPage() {
  return (
    <Suspense>
      <TrackContent />
    </Suspense>
  );
}
