// src/components/admin/AdminDashboard.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import { getDashboardStats } from "@/lib/server-actions/admin/getDashboardStats";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ACTIVITY_COLORS = {
  order: "bg-blue-500",
  user: "bg-green-500",
  rider: "bg-purple-500",
  payment: "bg-amber-500",
  dispute: "bg-red-500",
};

function getActivityHref(item) {
  switch (item.type) {
    case "order":   return `/admindashboard/orders?id=${item.id}`;
    case "user":    return `/admindashboard/app-users?id=${item.id}`;
    case "rider":   return `/admindashboard/riders?id=${item.id}`;
    case "payment": return `/admindashboard/wallet/withdrawals?id=${item.id}`;
    default:        return null;
  }
}

export default function AdminDashboard() {
  const { admin } = useAdmin();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((res) => {
      if (res.success) setData(res);
      setIsLoading(false);
    });
  }, []);

  const quickActions = [
    { name: "Manage Orders", path: "/admindashboard/orders", roles: ["Super Admin", "Operations Officer", "Customer Care"] },
    { name: "View Reports", path: "/admindashboard/reports", roles: ["Super Admin", "Finance Officer"] },
    { name: "Manage Riders", path: "/admindashboard/riders", roles: ["Super Admin", "HR Officer", "Operations Officer"] },
    { name: "Tickets & Disputes", path: "/admindashboard/support", roles: ["Super Admin", "Customer Care", "Operations Officer"] },
    { name: "Wallet & Withdrawals", path: "/admindashboard/wallet", roles: ["Super Admin", "Finance Officer"] },
    { name: "Staff Management", path: "/admindashboard/users", roles: ["Super Admin"] },
  ];

  const accessibleActions = quickActions.filter((a) => a.roles.includes(admin?.role));

  const stats = data?.stats;

  const statCards = [
    {
      label: "Total Orders",
      value: stats ? stats.totalOrders.toLocaleString() : "—",
      change: stats ? `${stats.orderChange >= 0 ? "+" : ""}${stats.orderChange}%` : null,
      positive: stats ? stats.orderChange >= 0 : true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Total Users",
      value: stats ? stats.totalUsers.toLocaleString() : "—",
      change: stats ? `${stats.userChange >= 0 ? "+" : ""}${stats.userChange}%` : null,
      positive: stats ? stats.userChange >= 0 : true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.176a6 6 0 00-12-3.466" />
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Active Riders",
      value: stats ? stats.activeRiders.toLocaleString() : "—",
      change: stats ? `${stats.riderChange >= 0 ? "+" : ""}${stats.riderChange}%` : null,
      positive: stats ? stats.riderChange >= 0 : true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Hello {admin?.fullName || admin?.username} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening today</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {admin?.role}
          </span>
          {admin?.email && (
            <span className="text-xs text-gray-400">{admin.email}</span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                )}
                {stat.change && !isLoading && (
                  <div className="flex items-center gap-1 mt-2">
                    <svg
                      className={`w-4 h-4 ${stat.positive ? "text-green-600" : "text-red-600"}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={stat.positive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                      />
                    </svg>
                    <span className={`text-xs font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500">this month</span>
                  </div>
                )}
                {isLoading && (
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mt-2"></div>
                )}
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-2.5 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {accessibleActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(action.path)}
                  className="p-4 text-left rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {action.name}
                  </p>
                  <svg className="w-4 h-4 text-gray-400 mt-2 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mt-2 flex-shrink-0"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-full"></div>
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (data?.activity ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {(data?.activity ?? []).map((item, idx) => {
                  const href = getActivityHref(item);
                  return (
                    <div
                      key={idx}
                      onClick={() => href && router.push(href)}
                      className={`flex items-start gap-3 px-2 py-2 rounded-lg transition-colors ${href ? "cursor-pointer hover:bg-gray-50 group" : ""}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${ACTIVITY_COLORS[item.type] || "bg-gray-400"}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${href ? "text-gray-900 group-hover:text-blue-600" : "text-gray-900"}`}>{item.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{timeAgo(item.time)}</p>
                      </div>
                      {href && (
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
