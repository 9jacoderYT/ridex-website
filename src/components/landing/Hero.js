// src/components/landing/Hero.js
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

const audiences = [
  {
    key: "customers",
    label: "Customers",
    headline: "Send Packages",
    headlineAccent: "Anywhere, Anytime",
    description:
      "Book a delivery in seconds. Track your package in real-time and get it delivered fast by verified riders across Nigeria.",
    cta: { text: "Download the App", href: "#download" },
    secondaryCta: { text: "Learn More", href: "/customers" },
    color: "from-green-500 to-emerald-600",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    illustration: (
      <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
        {/* Phone with tracking */}
        <rect x="140" y="30" width="120" height="220" rx="20" fill="#f0fdf4" stroke="#16a34a" strokeWidth="3" />
        <rect x="155" y="60" width="90" height="160" rx="4" fill="white" />
        <circle cx="200" cy="250" r="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
        {/* Map dot path */}
        <circle cx="175" cy="90" r="6" fill="#22c55e" />
        <circle cx="225" cy="130" r="6" fill="#16a34a" />
        <line x1="175" y1="96" x2="225" y2="124" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" />
        {/* Package icon */}
        <rect x="195" y="150" width="30" height="30" rx="4" fill="#22c55e" />
        <line x1="195" y1="165" x2="225" y2="165" stroke="white" strokeWidth="2" />
        <line x1="210" y1="150" x2="210" y2="180" stroke="white" strokeWidth="2" />
        {/* Speed lines */}
        <motion.line
          animate={{ opacity: [0, 1, 0], x1: [110, 90, 70] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          x1="110" y1="100" x2="130" y2="100" stroke="#86efac" strokeWidth="2" strokeLinecap="round"
        />
        <motion.line
          animate={{ opacity: [0, 1, 0], x1: [100, 80, 60] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          x1="100" y1="120" x2="125" y2="120" stroke="#86efac" strokeWidth="2" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "businesses",
    label: "Businesses",
    headline: "Scale Your",
    headlineAccent: "Deliveries Effortlessly",
    description:
      "Integrate RideX into your business workflow. Send bulk orders, get dedicated riders, and delight your customers with fast delivery.",
    cta: { text: "Get Started", href: "/businesses" },
    secondaryCta: { text: "Learn More", href: "/businesses" },
    color: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    illustration: (
      <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
        {/* Dashboard mockup */}
        <rect x="80" y="40" width="240" height="200" rx="12" fill="#eff6ff" stroke="#3b82f6" strokeWidth="3" />
        <rect x="80" y="40" width="240" height="36" rx="12" fill="#3b82f6" />
        <circle cx="100" cy="58" r="5" fill="#fbbf24" />
        <circle cx="115" cy="58" r="5" fill="#22c55e" />
        <circle cx="130" cy="58" r="5" fill="#ef4444" />
        {/* Chart bars */}
        <rect x="110" y="170" width="24" height="50" rx="4" fill="#93c5fd" />
        <rect x="145" y="140" width="24" height="80" rx="4" fill="#60a5fa" />
        <rect x="180" y="110" width="24" height="110" rx="4" fill="#3b82f6" />
        <rect x="215" y="130" width="24" height="90" rx="4" fill="#60a5fa" />
        <rect x="250" y="100" width="24" height="120" rx="4" fill="#3b82f6" />
        {/* Growth arrow */}
        <motion.path
          animate={{ pathLength: [0, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          d="M110 180 L155 150 L195 120 L235 135 L270 95"
          stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none"
        />
      </svg>
    ),
  },
  {
    key: "companies",
    label: "Companies",
    headline: "Power Your",
    headlineAccent: "Logistics Company",
    description:
      "The all-in-one platform to manage riders, track deliveries, and process payments. Register your company and start growing today.",
    cta: { text: "Register Company", href: "/registration_company" },
    secondaryCta: { text: "Learn More", href: "/companies" },
    color: "from-purple-500 to-violet-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    illustration: (
      <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
        {/* Central hub */}
        <circle cx="200" cy="150" r="40" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="3" />
        <text x="200" y="155" textAnchor="middle" fill="#7c3aed" fontSize="14" fontWeight="bold">HUB</text>
        {/* Rider nodes */}
        <motion.circle
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          cx="100" cy="80" r="20" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="2"
        />
        <motion.circle
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          cx="300" cy="80" r="20" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="2"
        />
        <motion.circle
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          cx="100" cy="220" r="20" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="2"
        />
        <motion.circle
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          cx="300" cy="220" r="20" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="2"
        />
        {/* Connection lines */}
        <line x1="165" y1="125" x2="118" y2="95" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4" />
        <line x1="235" y1="125" x2="282" y2="95" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4" />
        <line x1="165" y1="175" x2="118" y2="205" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4" />
        <line x1="235" y1="175" x2="282" y2="205" stroke="#c4b5fd" strokeWidth="2" strokeDasharray="4" />
        {/* Rider icons */}
        <text x="100" y="85" textAnchor="middle" fontSize="16">🏍</text>
        <text x="300" y="85" textAnchor="middle" fontSize="16">🏍</text>
        <text x="100" y="225" textAnchor="middle" fontSize="16">🚗</text>
        <text x="300" y="225" textAnchor="middle" fontSize="16">🏍</text>
      </svg>
    ),
  },
];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % audiences.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const active = audiences[activeIndex];

  return (
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden bg-white min-h-[90vh] flex items-center">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-72 h-72 bg-green-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 w-96 h-96 bg-green-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.08, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Audience Tabs */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex bg-gray-100 rounded-full p-1.5 shadow-inner">
            {audiences.map((aud, idx) => (
              <button
                key={aud.key}
                onClick={() => setActiveIndex(idx)}
                className={`relative px-5 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeIndex === idx
                    ? "text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {activeIndex === idx && (
                  <motion.div
                    layoutId="hero-tab-bg"
                    className={`absolute inset-0 bg-gradient-to-r ${active.color} rounded-full`}
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{aud.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
              >
                {active.headline}{" "}
                <span
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${active.color}`}
                >
                  {active.headlineAccent}
                </span>
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 px-4 sm:px-0 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                {active.description}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href={active.cta.href}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r ${active.color} text-white font-semibold rounded-full shadow-lg transition-all`}
                  >
                    <span>{active.cta.text}</span>
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
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href={active.secondaryCta.href}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-full shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <span>{active.secondaryCta.text}</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Right Illustration */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative h-[350px] sm:h-[400px] lg:h-[450px] flex items-center justify-center"
            >
              <div className="w-full max-w-md mx-auto">
                {active.illustration}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Auto-rotate progress */}
        <div className="flex justify-center gap-2 mt-10">
          {audiences.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="relative h-1.5 rounded-full overflow-hidden bg-gray-200"
              style={{ width: activeIndex === idx ? "48px" : "24px" }}
            >
              {activeIndex === idx && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${active.color} rounded-full`}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
