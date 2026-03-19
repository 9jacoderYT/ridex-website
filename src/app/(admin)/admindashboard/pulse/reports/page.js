"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import { getReferralStats } from "@/lib/server-actions/admin/manageReferrals";

export default function PerformanceReportsPage() {
  const { admin, loading } = useAdmin();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/loginadminusers");
    }
  }, [admin, loading, router]);

  useEffect(() => {
    if (admin) {
      fetchStats();
    }
  }, [admin]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const result = await getReferralStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Performance Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Referral program analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Find max count in monthly breakdown for bar scaling
  const maxMonthlyCount = Math.max(
    ...(stats?.monthlyBreakdown || []).map((m) => m.count),
    1,
  );

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Performance Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Referral program analytics and performance metrics
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Referrals</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats?.totalReferrals || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {stats?.thisMonthReferrals || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Rewards Paid</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {"\u20A6"}{(stats?.totalRewardsPaid || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Referrer + Welcome bonuses
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active Referrers</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats?.uniqueReferrers || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Unique users who referred
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Monthly Referrals
          </h2>
          <p className="text-sm text-gray-500 mb-6">Last 6 months</p>

          {stats?.monthlyBreakdown && stats.monthlyBreakdown.length > 0 ? (
            <div className="space-y-4">
              {stats.monthlyBreakdown.map((month, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      {month.month}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900 font-medium">
                        {month.count} referral{month.count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        {"\u20A6"}{month.rewards.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${(month.count / maxMonthlyCount) * 100}%`,
                        minWidth: month.count > 0 ? "8px" : "0px",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No referral data yet
            </p>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Top Referrers
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Users with the most referrals
          </p>

          {stats?.topReferrers && stats.topReferrers.length > 0 ? (
            <div className="space-y-3">
              {stats.topReferrers.map((referrer, idx) => (
                <div
                  key={referrer.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Rank */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      idx === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : idx === 1
                          ? "bg-gray-100 text-gray-600"
                          : idx === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {referrer.full_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {referrer.user_id}
                      </span>
                      {referrer.email && (
                        <span className="text-xs text-gray-400 truncate">
                          {referrer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {referrer.referral_count}
                    </p>
                    <p className="text-xs text-green-600">
                      {"\u20A6"}{referrer.total_earned.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No referrers yet
            </p>
          )}
        </div>
      </div>

      {/* Summary Card */}
      {stats && stats.totalReferrals > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Program Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-200 text-sm">Avg. Referrals per User</p>
              <p className="text-2xl font-semibold mt-1">
                {stats.uniqueReferrers > 0
                  ? (stats.totalReferrals / stats.uniqueReferrers).toFixed(1)
                  : "0"}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Avg. Cost per Referral</p>
              <p className="text-2xl font-semibold mt-1">
                {"\u20A6"}
                {stats.totalReferrals > 0
                  ? (
                      stats.totalRewardsPaid / stats.totalReferrals
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : "0"}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">
                Monthly Growth Rate
              </p>
              <p className="text-2xl font-semibold mt-1">
                {(() => {
                  const mb = stats.monthlyBreakdown || [];
                  if (mb.length < 2) return "N/A";
                  const prev = mb[mb.length - 2]?.count || 0;
                  const curr = mb[mb.length - 1]?.count || 0;
                  if (prev === 0) return curr > 0 ? "+100%" : "0%";
                  const growth = ((curr - prev) / prev) * 100;
                  return `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
