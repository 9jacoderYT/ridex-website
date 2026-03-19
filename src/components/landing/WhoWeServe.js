// src/components/landing/WhoWeServe.js
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const segments = [
  {
    title: "For Customers",
    description:
      "Send packages across Nigeria with ease. Book, track, and receive deliveries right from your phone.",
    href: "/customers",
    color: "from-green-500 to-emerald-600",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
    hoverBorder: "hover:border-green-400",
    features: ["Real-time tracking", "Instant booking", "Secure deliveries"],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    title: "For Businesses",
    description:
      "Streamline your delivery operations. Send bulk orders, track fleet performance, and keep customers happy.",
    href: "/businesses",
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    features: ["Bulk deliveries", "Business dashboard", "Dedicated support"],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: "For Logistics Companies",
    description:
      "Register your company, onboard riders, and manage your entire logistics operation from one dashboard.",
    href: "/companies",
    color: "from-purple-500 to-violet-600",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
    features: ["Rider management", "Automated payments", "Analytics & reports"],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function WhoWeServe() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Who We Serve
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            RideX connects everyone in the delivery chain — from customers sending packages to the companies making it happen
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.title}
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className={`relative bg-white rounded-2xl p-8 border-2 ${segment.borderColor} ${segment.hoverBorder} transition-all shadow-sm hover:shadow-xl group`}
            >
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-16 h-16 bg-gradient-to-br ${segment.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:shadow-lg transition-shadow`}
              >
                {segment.icon}
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {segment.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {segment.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8">
                {segment.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className={`w-4 h-4 text-green-500 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={segment.href}
                className={`inline-flex items-center gap-2 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r ${segment.color} group-hover:gap-3 transition-all`}
              >
                <span>Learn More</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
