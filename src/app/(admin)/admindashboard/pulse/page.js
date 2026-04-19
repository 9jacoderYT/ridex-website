"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import { getAllReferrals } from "@/lib/server-actions/admin/manageReferrals";

export default function ReferralNetworkPage() {
  const { admin, loading } = useAdmin();
  const router = useRouter();
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/loginadminusers");
    }
  }, [admin, loading, router]);

  useEffect(() => {
    if (admin) {
      fetchReferrals();
    }
  }, [admin]);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      const result = await getAllReferrals();
      if (result.success) {
        setReferrals(result.referrals);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort
  const filteredReferrals = referrals
    .filter((r) => {
      const term = searchTerm.toLowerCase();
      return (
        r.referrer_name?.toLowerCase().includes(term) ||
        r.referred_name?.toLowerCase().includes(term) ||
        r.referrer_user_id?.toLowerCase().includes(term) ||
        r.referred_user_id?.toLowerCase().includes(term) ||
        r.referrer_email?.toLowerCase().includes(term) ||
        r.referred_email?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "highest_reward")
        return b.referrer_reward + b.referred_reward - (a.referrer_reward + a.referred_reward);
      return 0;
    });

  // Stats
  const stats = {
    total: referrals.length,
    totalReferrerRewards: referrals.reduce(
      (sum, r) => sum + (parseFloat(r.referrer_reward) || 0),
      0,
    ),
    totalReferredRewards: referrals.reduce(
      (sum, r) => sum + (parseFloat(r.referred_reward) || 0),
      0,
    ),
    uniqueReferrers: new Set(referrals.map((r) => r.referrer_user_id)).size,
  };

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Referral Network
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage all referral relationships across the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Referrals</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Referrer Rewards Paid</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {"\u20A6"}{stats.totalReferrerRewards.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Welcome Bonuses Paid</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {"\u20A6"}{stats.totalReferredRewards.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Unique Referrers</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.uniqueReferrers}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, user ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_reward">Highest Reward</option>
          </select>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referrer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referred User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referrer Reward
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Welcome Bonus
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "No referrals match your search"
                      : "No referrals yet"}
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-semibold">
                            {referral.referrer_name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {referral.referrer_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {referral.referrer_user_id}
                            </span>
                            {referral.referrer_email && (
                              <span className="text-xs text-gray-500">
                                {referral.referrer_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-semibold">
                            {referral.referred_name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {referral.referred_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {referral.referred_user_id}
                            </span>
                            {referral.referred_email && (
                              <span className="text-xs text-gray-500">
                                {referral.referred_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-green-600">
                        {"\u20A6"}{parseFloat(referral.referrer_reward).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-blue-600">
                        {"\u20A6"}{parseFloat(referral.referred_reward).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(referral.created_at).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with count */}
        {!isLoading && filteredReferrals.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {filteredReferrals.length} of {referrals.length} referrals
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
