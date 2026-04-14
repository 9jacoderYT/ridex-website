// src/components/landing/ProblemSolution.js
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className={className}>
      {typeof children === "function" ? children(isInView) : children}
    </div>
  );
}

const problems = [
  { icon: "❌", text: "Riders cancel last minute" },
  { icon: "⏰", text: "Packages arrive late" },
  { icon: "😤", text: "Customers lose trust" },
  { icon: "💸", text: "Businesses lose money" },
];

const solutions = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Speed",
    desc: "Your delivery starts immediately — no long wait.",
    color: "bg-green-500",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Live Tracking",
    desc: "Know exactly where your package is at all times.",
    color: "bg-blue-500",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Reliable System",
    desc: "No stories. No excuses. Just delivery.",
    color: "bg-purple-500",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Smart Payments",
    desc: "Pay securely — before or at delivery — all tracked inside RIDEX.",
    color: "bg-orange-500",
  },
];

const trustPoints = [
  { icon: "🔒", text: "All payments are tracked inside RIDEX" },
  { icon: "✅", text: "Riders are accountable for every delivery" },
  { icon: "📍", text: "Deliveries are monitored from start to finish" },
  { icon: "⚖️", text: "Disputes are handled through the platform" },
];

export default function ProblemSolution() {
  return (
    <>
      {/* ── PROBLEM SECTION ── */}
      <section className="py-16 sm:py-24 bg-gray-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            {(isInView) => (
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-block px-4 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold rounded-full mb-6">
                    The Real Problem
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                    The Problem Isn&apos;t Delivery…
                    <br />
                    <span className="text-red-400">It&apos;s Delay.</span>
                  </h2>
                  <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
                    Every business that relies on delivery knows the pain. And every delay costs you something.
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                  {problems.map((p, i) => (
                    <motion.div
                      key={p.text}
                      initial={{ y: 40, opacity: 0 }}
                      animate={isInView ? { y: 0, opacity: 1 } : {}}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                      className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 text-center"
                    >
                      <div className="text-3xl mb-3">{p.icon}</div>
                      <p className="text-gray-300 text-sm font-medium">{p.text}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-green-500/20 border border-green-500/40 rounded-2xl"
                >
                  <span className="text-2xl">✅</span>
                  <p className="text-xl font-bold text-green-400">RIDEX fixes that.</p>
                </motion.div>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ── SOLUTION SECTION ── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            {(isInView) => (
              <>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-14"
                >
                  <span className="inline-block px-4 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-full mb-6">
                    The Solution
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    Move Smart. Move Fast.{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                      Stay in Control.
                    </span>
                  </h2>
                  <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                    RIDEX gives you everything you need for reliable delivery — from the moment you book to the second it arrives.
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {solutions.map((s, i) => (
                    <motion.div
                      key={s.title}
                      initial={{ y: 50, opacity: 0 }}
                      animate={isInView ? { y: 0, opacity: 1 } : {}}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                      whileHover={{ y: -6 }}
                      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all text-center group"
                    >
                      <div className={`w-14 h-14 ${s.color} rounded-xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        {s.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-green-600 to-emerald-700 text-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            {(isInView) => (
              <div className="max-w-5xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ x: -40, opacity: 0 }}
                    animate={isInView ? { x: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="inline-block px-4 py-1.5 bg-white/20 border border-white/30 text-white text-sm font-semibold rounded-full mb-6">
                      Built on Trust
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                      Built for Trust.{" "}
                      <span className="text-green-200">Designed for Control.</span>
                    </h2>
                    <p className="text-green-100 text-lg leading-relaxed">
                      Every delivery on RIDEX is monitored, every payment is tracked, and every dispute is handled — so you can focus on what matters.
                    </p>
                  </motion.div>

                  <div className="space-y-4">
                    {trustPoints.map((point, i) => (
                      <motion.div
                        key={point.text}
                        initial={{ x: 40, opacity: 0 }}
                        animate={isInView ? { x: 0, opacity: 1 } : {}}
                        transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                        className="flex items-center gap-4 bg-white/10 border border-white/20 rounded-xl px-5 py-4 backdrop-blur-sm"
                      >
                        <span className="text-2xl flex-shrink-0">{point.icon}</span>
                        <p className="text-white font-medium">{point.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ── LOCAL SEO SECTION ── */}
      <section className="py-12 sm:py-16 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            {(isInView) => (
              <div className="max-w-3xl mx-auto text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-2xl">📍</span>
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ilorin, Nigeria</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Delivery in Ilorin — Done Right
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Looking for a dispatch rider in Ilorin? Need a fast delivery service? Want to send a package across Ilorin today?
                    RIDEX is the reliable delivery platform for same-day delivery and real-time tracking in Ilorin.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {["Dispatch Rider Ilorin", "Same-Day Delivery", "Real-Time Tracking", "Fast & Reliable"].map((tag) => (
                      <span key={tag} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 font-medium shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
