// src/app/(site)/businesses/page.js
"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";

// ─── Reusable scroll-animated section wrapper ────────────────────────────────
function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section ref={ref} className={className}>
      {typeof children === "function" ? children(isInView) : children}
    </section>
  );
}

// ─── Animated counter (mirrors Stats.js pattern) ─────────────────────────────
function AnimatedCounter({ end, duration = 2, suffix = "", isInView }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    title: "Bulk Order Management",
    description:
      "Upload hundreds of delivery orders at once via CSV or our intuitive dashboard. Assign riders automatically and manage everything from a single screen.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: "Business Dashboard",
    description:
      "A powerful real-time dashboard built for operations teams. Monitor active deliveries, rider performance, and revenue at a glance.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
  },
  {
    title: "API Integration",
    description:
      "Connect your e-commerce platform, ERP, or custom system directly to RideX. Trigger deliveries automatically when orders are placed.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  {
    title: "Dedicated Account Manager",
    description:
      "Every business account gets a dedicated account manager to help with onboarding, optimization, and scaling your delivery operations.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    title: "Volume Pricing",
    description:
      "The more you ship, the more you save. Unlock tiered discounts and custom pricing plans tailored to your delivery volume.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Delivery Reports",
    description:
      "Detailed weekly and monthly reports covering delivery times, success rates, costs, and rider performance. Export to CSV or PDF anytime.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Create Business Account",
    description:
      "Sign up with your business details and get verified within 24 hours. Our team reviews every application to ensure quality.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Upload Bulk Orders",
    description:
      "Import orders via CSV, API, or manual entry. Set pickup and delivery locations, package details, and preferred time windows.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Track All Deliveries",
    description:
      "Monitor every delivery in real-time from your dashboard. Get instant notifications on pickups, in-transit status, and successful deliveries.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Review Reports",
    description:
      "Access comprehensive delivery reports. Analyze performance metrics, optimize routes, and reduce costs with data-driven insights.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

const benefits = [
  { label: "Faster Deliveries", value: 40, suffix: "%", description: "average delivery time reduction" },
  { label: "Cost Savings", value: 30, suffix: "%", description: "lower logistics costs" },
  { label: "Orders per Day", value: 10000, suffix: "+", description: "processed by businesses on RideX" },
  { label: "Uptime", value: 99.9, suffix: "%", description: "platform reliability" },
];

// ─── Page Component ──────────────────────────────────────────────────────────

export default function BusinessesPage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ─── FEATURES GRID ─────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ─── BENEFITS / METRICS ────────────────────────────────────────── */}
      <BenefitsSection />

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <CTASection />
    </main>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="relative py-20 sm:py-32 overflow-hidden bg-white"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.09, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Built for businesses that move fast
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Streamline Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                Business Deliveries
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              From bulk orders to real-time tracking, RideX gives your business
              the logistics infrastructure it needs to deliver faster, cheaper,
              and more reliably.
            </motion.p>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/registration_company"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 transition-all"
                >
                  <span>Create Business Account</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-full shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <span>See How It Works</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right illustration */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative h-[350px] sm:h-[400px] lg:h-[450px] flex items-center justify-center"
          >
            <div className="w-full max-w-md mx-auto">
              <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
                {/* Dashboard mockup */}
                <rect x="60" y="30" width="280" height="220" rx="16" fill="#eff6ff" stroke="#3b82f6" strokeWidth="3" />
                <rect x="60" y="30" width="280" height="40" rx="16" fill="#3b82f6" />
                <rect x="60" y="54" width="280" height="16" fill="#3b82f6" />
                <circle cx="84" cy="50" r="6" fill="#fbbf24" />
                <circle cx="102" cy="50" r="6" fill="#22c55e" />
                <circle cx="120" cy="50" r="6" fill="#ef4444" />
                {/* Sidebar */}
                <rect x="60" y="70" width="60" height="180" fill="#e0e7ff" />
                <rect x="72" y="85" width="36" height="6" rx="3" fill="#818cf8" />
                <rect x="72" y="100" width="36" height="6" rx="3" fill="#c7d2fe" />
                <rect x="72" y="115" width="36" height="6" rx="3" fill="#c7d2fe" />
                <rect x="72" y="130" width="36" height="6" rx="3" fill="#c7d2fe" />
                {/* Chart bars */}
                <rect x="140" y="190" width="28" height="40" rx="4" fill="#93c5fd" />
                <rect x="178" y="165" width="28" height="65" rx="4" fill="#60a5fa" />
                <rect x="216" y="135" width="28" height="95" rx="4" fill="#3b82f6" />
                <rect x="254" y="155" width="28" height="75" rx="4" fill="#60a5fa" />
                <rect x="292" y="120" width="28" height="110" rx="4" fill="#3b82f6" />
                {/* KPI cards row */}
                <rect x="135" y="80" width="55" height="38" rx="6" fill="white" stroke="#e0e7ff" strokeWidth="1" />
                <rect x="200" y="80" width="55" height="38" rx="6" fill="white" stroke="#e0e7ff" strokeWidth="1" />
                <rect x="265" y="80" width="55" height="38" rx="6" fill="white" stroke="#e0e7ff" strokeWidth="1" />
                <text x="162" y="97" textAnchor="middle" fill="#6366f1" fontSize="8" fontWeight="bold">1,240</text>
                <text x="162" y="110" textAnchor="middle" fill="#9ca3af" fontSize="6">Orders</text>
                <text x="227" y="97" textAnchor="middle" fill="#6366f1" fontSize="8" fontWeight="bold">98.5%</text>
                <text x="227" y="110" textAnchor="middle" fill="#9ca3af" fontSize="6">Success</text>
                <text x="292" y="97" textAnchor="middle" fill="#6366f1" fontSize="8" fontWeight="bold">24 min</text>
                <text x="292" y="110" textAnchor="middle" fill="#9ca3af" fontSize="6">Avg Time</text>
                {/* Growth arrow */}
                <motion.path
                  animate={{ pathLength: [0, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  d="M148 210 L190 185 L228 155 L266 165 L306 130"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ────────────────────────────────────────────────────────

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful tools designed to help businesses manage deliveries at scale
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-shadow"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works Section ────────────────────────────────────────────────────

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="py-16 sm:py-24 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="biz-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="#3b82f6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#biz-grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Get your business deliveries running in four simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative group"
            >
              {/* Connecting arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-6 h-0.5 z-0 -translate-x-3">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ delay: index * 0.15 + 0.5, duration: 0.6 }}
                    className="h-full bg-blue-500 origin-left relative"
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rotate-45" />
                  </motion.div>
                </div>
              )}

              <div className="relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-blue-500 hover:shadow-xl transition-all h-full">
                {/* Step number */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.4, type: "spring" }}
                  className="absolute -top-6 -left-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg z-10 group-hover:scale-110 transition-transform"
                >
                  <span className="text-white font-bold text-xl">
                    {step.number}
                  </span>
                </motion.div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-14 h-14 mb-5 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors"
                >
                  {step.icon}
                </motion.div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Benefits / Metrics Section ──────────────────────────────────────────────

function BenefitsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-black/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Results That Speak
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
            Businesses on RideX see measurable improvements from day one
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.label}
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="inline-block"
              >
                <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-2 font-mono">
                  <AnimatedCounter
                    end={benefit.value}
                    suffix={benefit.suffix}
                    isInView={isInView}
                  />
                </div>
                <div className="text-base sm:text-lg text-white font-semibold mb-1">
                  {benefit.label}
                </div>
                <div className="text-sm text-blue-200">
                  {benefit.description}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl px-8 py-16 sm:px-16 sm:py-20 overflow-hidden"
        >
          {/* Background decoration inside the card */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/10 rounded-full blur-2xl"
            />
          </div>

          <div className="relative z-10">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Ready to Transform Your Deliveries?
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
            >
              Join hundreds of businesses already using RideX to power their
              delivery operations. Set up your account in minutes.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/registration_company"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-semibold rounded-full shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all"
                >
                  <span>Get Started Free</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="#"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>Talk to Sales</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
