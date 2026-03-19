// src/components/admin/AdminDashboard.js
"use client";

import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";

export default function AdminDashboard() {
  const { admin } = useAdmin();
  const router = useRouter();

  const stats = [
    {
      label: "Total Orders",
      value: "5,423",
      change: "+16%",
      positive: true,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Active Users",
      value: "1,893",
      change: "1%",
      positive: false,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.176a6 6 0 00-12-3.466"
          />
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Active Riders",
      value: "189",
      change: "+8%",
      positive: true,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const quickActions = [
    {
      name: "Manage Orders",
      path: "/admindashboard/orders",
      roles: ["Super Admin", "Operations Officer"],
    },
    {
      name: "View Reports",
      path: "/admindashboard/reports",
      roles: ["Super Admin", "Finance Officer"],
    },
    {
      name: "Manage Riders",
      path: "/admindashboard/riders",
      roles: ["Super Admin", "HR Officer"],
    },
    {
      name: "Handle Disputes",
      path: "/admindashboard/disputes",
      roles: ["Super Admin", "Customer Care"],
    },
  ];

  const recentActivity = [
    { action: "New order #1247 created", time: "5 minutes ago", type: "order" },
    {
      action: "Rider John Doe approved",
      time: "23 minutes ago",
      type: "rider",
    },
    {
      action: "₦50,000 withdrawal processed",
      time: "1 hour ago",
      type: "payment",
    },
    { action: "Dispute #892 resolved", time: "2 hours ago", type: "dispute" },
    { action: "New user registration", time: "3 hours ago", type: "user" },
  ];

  const accessibleActions = quickActions.filter((action) =>
    action.roles.includes(admin?.role),
  );

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Hello {admin?.username} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's what's happening today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <svg
                    className={`w-4 h-4 ${stat.positive ? "text-green-600" : "text-red-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        stat.positive
                          ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      }
                    />
                  </svg>
                  <span
                    className={`text-xs font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">this month</span>
                </div>
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
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
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
                  <svg
                    className="w-4 h-4 text-gray-400 mt-2 group-hover:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors">
              View all activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
