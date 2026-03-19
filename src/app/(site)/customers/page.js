// src/app/(site)/customers/page.js
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const features = [
  {
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
    title: "Real-time Tracking",
    description:
      "Follow your package every step of the way on a live map. Get accurate ETAs and instant status updates.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Instant Booking",
    description:
      "Request a delivery in seconds. Just enter pickup and drop-off details and a rider is on the way.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Verified Riders",
    description:
      "Every rider on the platform is background-checked and verified. Your packages are always in safe hands.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
    title: "Multiple Vehicle Types",
    description:
      "Choose from bikes, cars, or vans depending on your package size. The right vehicle for every delivery.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    title: "Secure Payments",
    description:
      "Pay with card, bank transfer, or wallet. Every transaction is encrypted and your financial data stays safe.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    title: "Live Support",
    description:
      "Need help? Our support team is available around the clock via chat and phone to resolve any issue.",
  },
];

const steps = [
  {
    number: "01",
    title: "Open the App",
    description:
      "Download and open the RideX app on your phone. Sign up in under a minute with just your phone number.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Enter Delivery Details",
    description:
      "Type in your pickup and drop-off address, describe your package, and pick the vehicle type that fits.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Track in Real-time",
    description:
      "Watch your rider on a live map as they pick up and deliver your package. Get notified at every milestone.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Package Delivered",
    description:
      "Your recipient gets the package and you get an instant confirmation. Rate your rider and you are done!",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Reusable animated section wrapper
// ---------------------------------------------------------------------------

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className={className}>
      {typeof children === "function" ? children(isInView) : children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden bg-white min-h-[80vh] flex items-center">
      {/* Animated background blobs */}
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Deliver Anything,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-700">
                Anywhere
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 px-4 sm:px-0 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Book a delivery in seconds. Track your package on a live map and
              get it delivered fast by verified riders across Nigeria.
            </motion.p>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="#download"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-full shadow-lg shadow-green-500/30 transition-all"
                >
                  <span>Download the App</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-full shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <span>How It Works</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right illustration */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative h-[350px] sm:h-[400px] lg:h-[450px] flex items-center justify-center"
          >
            <div className="w-full max-w-md mx-auto">
              <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
                {/* Phone shell */}
                <rect x="140" y="30" width="120" height="220" rx="20" fill="#f0fdf4" stroke="#16a34a" strokeWidth="3" />
                <rect x="155" y="60" width="90" height="160" rx="4" fill="white" />
                <circle cx="200" cy="250" r="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                {/* Map route */}
                <circle cx="175" cy="90" r="6" fill="#22c55e" />
                <circle cx="225" cy="170" r="6" fill="#16a34a" />
                <line x1="175" y1="96" x2="225" y2="164" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" />
                {/* Package icon */}
                <rect x="185" y="120" width="30" height="30" rx="4" fill="#22c55e" />
                <line x1="185" y1="135" x2="215" y2="135" stroke="white" strokeWidth="2" />
                <line x1="200" y1="120" x2="200" y2="150" stroke="white" strokeWidth="2" />
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
                <motion.line
                  animate={{ opacity: [0, 1, 0], x1: [105, 85, 65] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  x1="105" y1="140" x2="128" y2="140" stroke="#86efac" strokeWidth="2" strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features Grid
// ---------------------------------------------------------------------------

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
            Why Customers{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-700">
              Love RideX
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need for fast, reliable, and stress-free deliveries
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
                className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white mb-6 group-hover:shadow-lg group-hover:shadow-green-500/50 transition-shadow"
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

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="py-16 sm:py-24 bg-white relative overflow-hidden"
    >
      {/* Background dot pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="customer-steps-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="#10b981" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#customer-steps-grid)" />
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
            How It{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-700">
              Works
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Four simple steps from booking to delivery
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative group"
            >
              {/* Connecting arrow (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-6 h-0.5 z-0 -translate-x-3">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ delay: index * 0.15 + 0.5, duration: 0.6 }}
                    className="h-full bg-green-500 origin-left relative"
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rotate-45" />
                  </motion.div>
                </div>
              )}

              <div className="relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-green-500 hover:shadow-xl transition-all h-full">
                {/* Step number badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.4, type: "spring" }}
                  className="absolute -top-5 -left-5 w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg z-10 group-hover:scale-110 transition-transform"
                >
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </motion.div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 mb-6 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors"
                >
                  {step.icon}
                </motion.div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// App Download CTA
// ---------------------------------------------------------------------------

function AppDownloadSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="download"
      className="py-16 sm:py-24 bg-gray-50 relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="customer-download-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="3" fill="#10b981" />
              <circle cx="0" cy="0" r="2" fill="#059669" />
              <circle cx="80" cy="80" r="2" fill="#059669" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#customer-download-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Get the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-700">
                RideX App
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Download now and send your first package in minutes. Available on
              iOS and Android.
            </p>
          </motion.div>

          {/* Phone mockup with store buttons */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Phone illustration */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-64 h-[480px] bg-gradient-to-b from-green-50 to-white rounded-[40px] border-4 border-gray-200 shadow-2xl p-4 relative overflow-hidden">
                  {/* Status bar */}
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-4 px-2 pt-2">
                    <span className="font-semibold">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-gray-400 rounded-sm" />
                      <div className="w-4 h-2 bg-gray-400 rounded-sm" />
                      <div className="w-6 h-3 bg-green-500 rounded-sm" />
                    </div>
                  </div>
                  {/* App header */}
                  <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-2xl p-4 mb-4">
                    <p className="text-white text-xs font-medium mb-1">Welcome back</p>
                    <p className="text-white text-lg font-bold">Send a Package</p>
                  </div>
                  {/* Mock input fields */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm text-gray-500">Pickup location</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                      <span className="text-sm text-gray-500">Drop-off location</span>
                    </div>
                  </div>
                  {/* Vehicle options */}
                  <div className="flex gap-2 mb-4">
                    {["Bike", "Car", "Van"].map((v, i) => (
                      <div
                        key={v}
                        className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold ${
                          i === 0
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                  {/* CTA button */}
                  <div className="bg-gradient-to-r from-green-500 to-green-700 text-white text-center py-3 rounded-xl font-semibold text-sm">
                    Book Now
                  </div>
                  {/* Map placeholder */}
                  <div className="mt-4 h-28 bg-green-50 rounded-xl flex items-center justify-center">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
                {/* Glow behind phone */}
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-green-700/20 rounded-[50px] blur-2xl -z-10" />
              </div>
            </motion.div>

            {/* Download buttons */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-6"
            >
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Available on your favourite platform
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Join thousands of customers already using RideX to send packages
                across Nigeria. Fast sign-up, instant booking, real-time tracking.
              </p>

              <div className="space-y-4 pt-2">
                {/* App Store */}
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="#"
                  className="flex items-center gap-4 w-full px-6 py-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl transition-all shadow-md"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs font-normal text-gray-300">Download on the</div>
                    <div className="text-lg font-bold leading-tight">App Store</div>
                  </div>
                </motion.a>

                {/* Google Play */}
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="#"
                  className="flex items-center gap-4 w-full px-6 py-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl transition-all shadow-md"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs font-normal text-gray-300">GET IT ON</div>
                    <div className="text-lg font-bold leading-tight">Google Play</div>
                  </div>
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bottom CTA
// ---------------------------------------------------------------------------

function BottomCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-green-500 to-green-700 rounded-3xl p-10 sm:p-16 shadow-2xl shadow-green-500/20 relative overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Ready to Send Your First Package?
            </h2>
            <p className="text-green-50 text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of happy customers who trust RideX for fast,
              reliable deliveries every day.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="#download"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <span>Download the App</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all"
                >
                  <span>Back to Home</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function CustomersPage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AppDownloadSection />
      <BottomCTASection />
    </main>
  );
}
