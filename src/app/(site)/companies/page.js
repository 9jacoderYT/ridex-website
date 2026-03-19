// src/app/(site)/companies/page.js
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

// ─── Reusable animated section wrapper ───────────────────────────────────────
function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className={className}>
      {typeof children === "function" ? children(isInView) : children}
    </section>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden bg-white min-h-[80vh] flex items-center">
      {/* Animated background blobs */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-10 w-96 h-96 bg-violet-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.08, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-400 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-sm font-semibold mb-6"
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              For Logistics Companies
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Power Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-violet-600">
                Logistics Company
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 px-4 sm:px-0 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              The all-in-one platform to manage your riders, track every
              delivery in real-time, and automate payments. Register your
              company on RideX and start scaling today.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/registration_company"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 transition-all"
                >
                  <span>Register Your Company</span>
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

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-full shadow-sm hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <span>See How It Works</span>
                </a>
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free to register</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Verified in 24-48 hrs</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Unlimited riders</span>
              </div>
            </motion.div>
          </div>

          {/* Right illustration */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative h-[350px] sm:h-[400px] lg:h-[450px] flex items-center justify-center"
          >
            <div className="w-full max-w-md mx-auto">
              <svg
                viewBox="0 0 400 300"
                fill="none"
                className="w-full h-full"
              >
                {/* Central hub */}
                <circle
                  cx="200"
                  cy="150"
                  r="45"
                  fill="#f3e8ff"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                />
                <text
                  x="200"
                  y="145"
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="11"
                  fontWeight="bold"
                >
                  YOUR
                </text>
                <text
                  x="200"
                  y="162"
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="11"
                  fontWeight="bold"
                >
                  COMPANY
                </text>

                {/* Rider nodes */}
                <motion.circle
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  cx="100"
                  cy="70"
                  r="22"
                  fill="#ede9fe"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                <motion.circle
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                  cx="310"
                  cy="70"
                  r="22"
                  fill="#ede9fe"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                <motion.circle
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  cx="80"
                  cy="230"
                  r="22"
                  fill="#ede9fe"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                <motion.circle
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                  cx="320"
                  cy="230"
                  r="22"
                  fill="#ede9fe"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                <motion.circle
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.6 }}
                  cx="200"
                  cy="270"
                  r="22"
                  fill="#ede9fe"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />

                {/* Connection lines */}
                <line
                  x1="160"
                  y1="120"
                  x2="118"
                  y2="88"
                  stroke="#c4b5fd"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
                <line
                  x1="240"
                  y1="120"
                  x2="292"
                  y2="88"
                  stroke="#c4b5fd"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
                <line
                  x1="160"
                  y1="180"
                  x2="100"
                  y2="212"
                  stroke="#c4b5fd"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
                <line
                  x1="240"
                  y1="180"
                  x2="302"
                  y2="212"
                  stroke="#c4b5fd"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
                <line
                  x1="200"
                  y1="195"
                  x2="200"
                  y2="248"
                  stroke="#c4b5fd"
                  strokeWidth="2"
                  strokeDasharray="4"
                />

                {/* Rider labels */}
                <text
                  x="100"
                  y="74"
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="10"
                  fontWeight="600"
                >
                  Rider 1
                </text>
                <text
                  x="310"
                  y="74"
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="10"
                  fontWeight="600"
                >
                  Rider 2
                </text>
                <text
                  x="80"
                  y="234"
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="10"
                  fontWeight="600"
                >
                  Rider 3
                </text>
                <text
                  x="320"
                  y="234"
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="10"
                  fontWeight="600"
                >
                  Rider 4
                </text>
                <text
                  x="200"
                  y="274"
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="10"
                  fontWeight="600"
                >
                  Rider 5
                </text>

                {/* Animated pulse on hub */}
                <motion.circle
                  animate={{ r: [45, 55, 45], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  cx="200"
                  cy="150"
                  r="45"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Features Grid Section ───────────────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      title: "Unlimited Rider Management",
      description:
        "Onboard and manage an unlimited number of riders. Set individual commission rates, track performance metrics, and approve new riders directly from your dashboard.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Real-time Analytics",
      description:
        "Track delivery performance, revenue breakdowns, and rider statistics in real-time. Make data-driven decisions to grow and optimize your business.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      title: "Automated Payments",
      description:
        "Automatic commission calculations and payouts to your riders. Transparent payment tracking for both you and every rider in your fleet.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: "Company Verification",
      description:
        "Our verification process ensures quality and reliability on the platform. Build trust with customers and riders through a verified company badge.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
      title: "Live Tracking",
      description:
        "Monitor all active deliveries across your fleet in real-time. Provide customers with accurate ETAs and improve delivery efficiency company-wide.",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      title: "24/7 Support",
      description:
        "Dedicated support team available around the clock. Get help with onboarding, technical issues, or strategic guidance whenever you need it.",
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-violet-600">
              Succeed
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful tools designed specifically for logistics companies to
            manage, grow, and scale their delivery operations.
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
                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-shadow"
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

  const steps = [
    {
      number: "01",
      title: "Register Your Company",
      description:
        "Submit your company details and business documentation through our simple registration form. It only takes a few minutes to get started.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Get Verified",
      description:
        "Our team reviews and verifies your company within 24-48 hours. Once approved, you receive your verified company badge and full dashboard access.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Onboard Riders",
      description:
        "Add riders through your dashboard or share your company ID so riders can self-register. Set commission rates and approve riders as they join.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Start Accepting Deliveries",
      description:
        "Your riders go live on the RideX platform for customers to book. Track deliveries in real-time, manage payments, and scale your operations.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
  ];

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
            <pattern
              id="companies-steps-grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="30" cy="30" r="2" fill="#8b5cf6" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#companies-steps-grid)"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">
            Getting Started
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Launch in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-violet-600">
              4 Simple Steps
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            From registration to your first delivery -- get your logistics
            company up and running on RideX in no time.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
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
                <div className="hidden lg:block absolute top-20 left-full w-8 h-0.5 z-0 -translate-x-4">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{
                      delay: index * 0.15 + 0.5,
                      duration: 0.6,
                    }}
                    className="h-full bg-purple-500 origin-left relative"
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rotate-45" />
                  </motion.div>
                </div>
              )}

              <div className="relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-purple-500 hover:shadow-xl transition-all h-full">
                {/* Step number */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{
                    delay: index * 0.15 + 0.3,
                    duration: 0.4,
                    type: "spring",
                  }}
                  className="absolute -top-5 -left-5 w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg z-10 group-hover:scale-110 transition-transform"
                >
                  <span className="text-white font-bold text-xl">
                    {step.number}
                  </span>
                </motion.div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-14 h-14 mb-5 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors"
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

// ─── Dashboard Preview Section ───────────────────────────────────────────────
function DashboardPreviewSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const dashboardFeatures = [
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      title: "Fleet Overview",
      description:
        "See all your active, idle, and offline riders at a glance with an interactive map and status indicators.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Revenue Analytics",
      description:
        "Detailed charts showing daily, weekly, and monthly revenue. Track commission earnings and identify your top-performing riders.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Delivery History",
      description:
        "Complete log of every delivery -- pickup, drop-off, rider, duration, and payment. Export reports for your records.",
    },
    {
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      title: "Company Settings",
      description:
        "Manage your company profile, set default commission rates, configure notifications, and control rider approval workflows.",
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left -- Dashboard mockup */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
                    dashboard.ridex.ng/company
                  </div>
                </div>
              </div>

              {/* Dashboard content mock */}
              <div className="p-6">
                {/* Header bar */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full" />
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="h-3 w-16 bg-purple-200 rounded mb-2" />
                    <div className="text-lg font-bold text-purple-700">
                      247
                    </div>
                    <div className="h-2 w-12 bg-purple-100 rounded mt-1" />
                  </div>
                  <div className="bg-violet-50 rounded-lg p-3">
                    <div className="h-3 w-16 bg-violet-200 rounded mb-2" />
                    <div className="text-lg font-bold text-violet-700">
                      1,842
                    </div>
                    <div className="h-2 w-12 bg-violet-100 rounded mt-1" />
                  </div>
                  <div className="bg-fuchsia-50 rounded-lg p-3">
                    <div className="h-3 w-16 bg-fuchsia-200 rounded mb-2" />
                    <div className="text-lg font-bold text-fuchsia-700">
                      98%
                    </div>
                    <div className="h-2 w-12 bg-fuchsia-100 rounded mt-1" />
                  </div>
                </div>

                {/* Chart placeholder */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
                  <div className="flex items-end gap-2 h-24">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                      (h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={
                            isInView ? { height: `${h}%` } : { height: 0 }
                          }
                          transition={{
                            delay: 0.8 + i * 0.05,
                            duration: 0.4,
                          }}
                          className="flex-1 bg-gradient-to-t from-purple-500 to-violet-400 rounded-t"
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Table rows */}
                <div className="space-y-2">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-full" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                        <div className="h-2 w-16 bg-gray-100 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-purple-100 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-violet-600/20 rounded-3xl blur-2xl -z-10" />
          </motion.div>

          {/* Right -- Feature list */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full mb-4">
              Company Dashboard
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Your Command Center for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-violet-600">
                Every Delivery
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              The RideX company dashboard gives you complete visibility and
              control over your entire logistics operation, all from one
              place.
            </p>

            <div className="space-y-6">
              {dashboardFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ x: 30, opacity: 0 }}
                  animate={isInView ? { x: 0, opacity: 1 } : {}}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="flex gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-violet-600 group-hover:text-white transition-all">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-purple-800" />

          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-2xl"
            />
            {/* Grid pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-10"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="cta-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="20" cy="20" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-grid)" />
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 px-6 sm:px-12 py-14 sm:py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-6"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Join the RideX Network
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
            >
              Ready to Grow Your
              <br />
              Logistics Business?
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg sm:text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Register your company today and get access to the tools,
              riders, and customers you need to scale. Verification is fast,
              onboarding is simple, and growth is limitless.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/registration_company"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-purple-700 font-bold rounded-full shadow-lg shadow-purple-900/30 hover:bg-purple-50 transition-all"
                >
                  <span>Register Your Company</span>
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

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                >
                  <span>Learn More</span>
                </a>
              </motion.div>
            </motion.div>

            {/* Bottom trust indicators */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-purple-200"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Quick verification</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Dedicated support</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function CompaniesPage() {
  return (
    <main className="min-h-screen bg-white pt-20">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <CTASection />
    </main>
  );
}
