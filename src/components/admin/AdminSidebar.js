// src/components/admin/AdminSidebar.js
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import { motion, AnimatePresence } from "framer-motion";

// ── Minimal icon set ──────────────────────────────────────────────────────────

const I = {
  home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  userPlus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
  activity: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  package: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  mapPin: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>,
  scan: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h2M4 10h2M4 14h2M4 18h2M18 6h2M18 10h2M18 14h2M18 18h2M8 4v2M12 4v2M16 4v2M8 18v2M12 18v2M16 18v2M8 8h8v8H8z" />,
  xCircle: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  wallet: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  arrowDown: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 9l-7 7-7-7" />,
  coins: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  cog: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
  chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  shield: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  headset: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />,
  creditCard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  alert: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  refund: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />,
  pulse: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  gift: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />,
  bike: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16a3 3 0 100-6 3 3 0 000 6zM7 16a3 3 0 100-6 3 3 0 000 6zM7 13h4l2-4h2" />,
  pricing: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  verify: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
  car: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17l3-3 3 3 4-4" />,
  history: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

function Icon({ name, className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {I[name]}
    </svg>
  );
}

// ── Nav structure ─────────────────────────────────────────────────────────────

const ALL = ["Super Admin", "Customer Care", "HR Officer", "Finance Officer", "Operations Officer"];

const NAV = [
  {
    label: null,
    items: [
      { name: "Dashboard", path: "/admindashboard", icon: "home", roles: ALL },
    ],
  },
  {
    label: "Customers",
    items: [
      { name: "App Users", path: "/admindashboard/app-users", icon: "users", roles: ["Super Admin", "Customer Care", "Operations Officer"] },
    ],
  },
  {
    label: "Companies",
    items: [
      { name: "Companies", path: "/admindashboard/companies", icon: "building", roles: ["Super Admin", "Operations Officer", "Finance Officer"] },
    ],
  },
  {
    label: "Orders",
    items: [
      { name: "Orders", path: "/admindashboard/orders", icon: "package", roles: ["Super Admin", "Customer Care", "Operations Officer"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Wallet", path: "/admindashboard/wallet", icon: "wallet", roles: ["Super Admin", "Finance Officer"] },
      { name: "Withdrawals", path: "/admindashboard/wallet/withdrawals", icon: "arrowDown", roles: ["Super Admin", "Finance Officer"] },
      { name: "Transactions", path: "/admindashboard/wallet/transactions", icon: "creditCard", roles: ["Super Admin", "Finance Officer"] },
      { name: "Pricing", path: "/admindashboard/pricing", icon: "pricing", roles: ["Super Admin"] },
    ],
  },
  {
    label: "Riders",
    items: [
      { name: "Riders", path: "/admindashboard/riders", icon: "bike", roles: ["Super Admin", "HR Officer", "Operations Officer"] },
    ],
  },
  {
    label: "Pulse",
    items: [
      { name: "Referral Network", path: "/admindashboard/pulse", icon: "pulse", roles: ["Super Admin", "Operations Officer"] },
      { name: "Rewards", path: "/admindashboard/pulse/rewards", icon: "gift", roles: ["Super Admin"] },
      { name: "Reports", path: "/admindashboard/pulse/reports", icon: "chart", roles: ["Super Admin", "Operations Officer"] },
    ],
  },
  {
    label: "Support",
    items: [
      { name: "Tickets", path: "/admindashboard/support", icon: "headset", roles: ALL },
      { name: "Failed Payments", path: "/admindashboard/failed-payments", icon: "creditCard", roles: ALL },
    ],
  },
  {
    label: "Disputes",
    items: [
      { name: "Disputes", path: "/admindashboard/disputes", icon: "alert", roles: ["Super Admin", "Customer Care", "Finance Officer"] },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Reports", path: "/admindashboard/reports", icon: "chart", roles: ["Super Admin", "Finance Officer", "Operations Officer"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Admin Users", path: "/admindashboard/users", icon: "shield", roles: ["Super Admin"] },
      { name: "Activity Logs", path: "/admindashboard/users/activity", icon: "activity", roles: ["Super Admin"] },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useAdmin();
  const role = admin?.role;

  const visibleSections = NAV.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);

  const go = (path) => {
    router.push(path);
    if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
  };

  const NavItem = ({ item }) => {
    const active = pathname === item.path;
    return (
      <button
        onClick={() => go(item.path)}
        className={`group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
          active
            ? "bg-blue-600 text-white font-medium"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <span className={`flex-shrink-0 ${active ? "text-blue-100" : "text-gray-400 group-hover:text-gray-600"}`}>
          <Icon name={item.icon} />
        </span>
        <span className="truncate leading-none">{item.name}</span>
        {item.badge && !active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        )}
      </button>
    );
  };

  const Content = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Brand header */}
      <div className="flex items-center justify-between px-3.5 h-14 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold leading-none">R</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">RideX</span>
          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">Admin</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin">
        {visibleSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 select-none">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-2.5 py-2.5 border-t border-gray-100 shrink-0">
        <button
          onClick={() => go("/admindashboard/settings")}
          className={`group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
            pathname === "/admindashboard/settings"
              ? "bg-gray-900 text-white font-medium"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          }`}
        >
          <span className={pathname === "/admindashboard/settings" ? "text-gray-300" : "text-gray-400 group-hover:text-gray-500"}>
            <Icon name="cog" />
          </span>
          <span className="leading-none">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop */}
      <aside className="hidden lg:block w-52 flex-shrink-0 border-r border-gray-200 overflow-hidden">
        <Content />
      </aside>

      {/* Mobile */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -220 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-52 border-r border-gray-200 shadow-lg"
      >
        <Content />
      </motion.aside>
    </>
  );
}
