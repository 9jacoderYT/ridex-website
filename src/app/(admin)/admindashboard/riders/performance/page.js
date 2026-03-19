"use client";

import { useState, useEffect } from "react";
import { getAllRiders, getRiderStats } from "@/lib/server-actions/admin/manageRiders";

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
      <span className="text-xs text-gray-600 ml-0.5">{n > 0 ? n.toFixed(1) : "—"}</span>
    </span>
  );
}

export default function PerformancePage() {
  const [riders, setRiders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [ridersRes, statsRes] = await Promise.all([
        getAllRiders({ limit: 200 }),
        getRiderStats(),
      ]);
      if (ridersRes.success) setRiders(ridersRes.data);
      if (statsRes.success) setStats(statsRes.stats);
      setLoading(false);
    }
    load();
  }, []);

  const sorted = [...riders].sort((a, b) => {
    if (sortBy === "rating") return (b.average_rating || 0) - (a.average_rating || 0);
    if (sortBy === "ratings_count") return (b.total_ratings || 0) - (a.total_ratings || 0);
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    return 0;
  });

  const topRated = riders.filter((r) => (r.average_rating || 0) >= 4.5).length;
  const lowRated = riders.filter((r) => (r.average_rating || 0) > 0 && (r.average_rating || 0) < 3).length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Rider Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Ratings and performance metrics for all riders</p>
      </div>

      {/* Overview stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Riders", value: stats.total, color: "text-gray-900" },
            { label: "Avg Platform Rating", value: stats.avgRating?.toFixed(2) ?? "—", color: "text-amber-600" },
            { label: "Top Rated (4.5+)", value: topRated, color: "text-green-600" },
            { label: "Low Rated (<3.0)", value: lowRated, color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sort + Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Rider Rankings</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="ratings_count">Sort by # of Ratings</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["#", "Rider", "Vehicle", "Rating", "# Ratings", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    No riders found
                  </td>
                </tr>
              ) : (
                sorted.map((rider, idx) => (
                  <tr key={rider.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                            idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-700" : "bg-green-600"
                          }`}
                        >
                          {rider.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rider.name}</p>
                          <p className="text-xs text-gray-400">{rider.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{rider.vehicle_type}</td>
                    <td className="px-4 py-3">
                      <Stars rating={rider.average_rating ?? 0} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{rider.total_ratings ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          { active: "bg-green-100 text-green-800", inactive: "bg-gray-100 text-gray-600", suspended: "bg-red-100 text-red-700" }[rider.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {rider.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
