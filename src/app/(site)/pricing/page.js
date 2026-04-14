// src/app/(site)/pricing/page.js
"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className={className}>
      {typeof children === "function" ? children(isInView) : children}
    </section>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const deliveryTypes = [
  {
    name: "Normal",
    icon: "📦",
    color: "from-gray-500 to-gray-600",
    badge: "bg-gray-100 text-gray-700",
    description: "Standard delivery for everyday packages",
    eta: "24 – 48 hours",
    multiplier: "1.0×",
    best: "Documents, clothing, small items",
  },
  {
    name: "Priority",
    icon: "⚡",
    color: "from-red-500 to-rose-600",
    badge: "bg-red-100 text-red-700",
    description: "Faster handling and dispatch for urgent deliveries",
    eta: "12 – 24 hours",
    multiplier: "1.5×",
    best: "Time-sensitive items, same-day needs",
  },
  {
    name: "High Value",
    icon: "💎",
    color: "from-amber-500 to-yellow-600",
    badge: "bg-amber-100 text-amber-700",
    description: "Extra security and care for expensive items",
    eta: "24 – 48 hours",
    multiplier: "2.0×",
    best: "Electronics, jewellery, luxury goods",
  },
  {
    name: "Sensitive",
    icon: "🧪",
    color: "from-teal-500 to-emerald-600",
    badge: "bg-teal-100 text-teal-700",
    description: "Specialist handling for fragile or delicate packages",
    eta: "24 – 36 hours",
    multiplier: "1.5×",
    best: "Glassware, medical supplies, artwork",
  },
];

const vehicleTypes = [
  {
    name: "Motorcycle",
    icon: "🏍️",
    maxWeight: "20 kg",
    coverage: "City-wide",
    color: "border-blue-200 bg-blue-50",
    tag: "Most popular",
    tagColor: "bg-blue-100 text-blue-700",
    description: "Fast and agile — ideal for documents, parcels, and everyday deliveries across the city.",
  },
  {
    name: "Car",
    icon: "🚗",
    maxWeight: "50 kg",
    coverage: "City & suburbs",
    color: "border-purple-200 bg-purple-50",
    tag: "Best for bulk",
    tagColor: "bg-purple-100 text-purple-700",
    description: "More space for larger or heavier packages — great for multiple items or suburb deliveries.",
  },
];

const paymentOptions = [
  {
    name: "Prepaid (Card / Bank Transfer)",
    icon: "💳",
    description:
      "Pay before your order is picked up using your RideX wallet, card, or bank transfer. Refunded automatically if the order is cancelled.",
    available: "All account types",
  },
  {
    name: "Cash on Delivery (COD)",
    icon: "🏦",
    description:
      "Pay via bank transfer at pickup (sender) or dropoff (receiver). COD is a bank transfer — our rider provides account details at the door.",
    available: "Business accounts only (3.5★+ rating)",
  },
];

const faqs = [
  {
    q: "How is my delivery fee calculated?",
    a: "Your fee is calculated using: base rate + (distance × per-km rate) × delivery type multiplier. You always see the exact price before confirming — no hidden charges.",
  },
  {
    q: "Are there extra charges for waiting time?",
    a: "If a rider waits more than 10 minutes at pickup or dropoff, a waiting charge may apply. This will be shown clearly in the app.",
  },
  {
    q: "Do prices change based on time of day?",
    a: "Surge pricing may apply during peak hours or high-demand periods. You'll always be shown the final price before you confirm your order.",
  },
  {
    q: "Is COD available to individual customers?",
    a: "COD (Cash on Delivery via bank transfer) is currently available to verified business accounts with a rating of 3.5 stars or above. Individual customers pay upfront.",
  },
  {
    q: "Can I get a refund?",
    a: "If your order is cancelled before pickup, your payment is automatically refunded to your RideX wallet. Wallet balances can be withdrawn at any time.",
  },
  {
    q: "Do businesses get discounted rates?",
    a: "Yes. Businesses and companies with high delivery volumes can qualify for custom pricing. Contact our sales team to discuss a plan.",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 opacity-90" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 mb-6">
              Transparent Pricing
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Simple, honest pricing.<br />No surprises.
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              See exactly what you'll pay before you confirm. Pricing adjusts by distance, vehicle, and delivery type — always shown upfront.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/customers"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Get the App
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-colors"
              >
                Read FAQ
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How pricing works */}
      <AnimatedSection className="max-w-5xl mx-auto px-6 py-16">
        {(isInView) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">How pricing works</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Our pricing is dynamic — the quote you see in the app is calculated in real time based on several factors. You always see the exact price before confirming your order. No hidden charges.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: "Distance", desc: "The route between your pickup and dropoff location is the primary driver of your delivery cost.", icon: "📍" },
                { title: "Vehicle Type", desc: "Motorcycles and cars are priced differently based on capacity and operating costs.", icon: "🚗" },
                { title: "Delivery Type", desc: "Standard, priority, high-value, and sensitive deliveries each carry different handling requirements.", icon: "📦" },
                { title: "Your Location", desc: "Pricing may vary by area depending on local demand, distance zones, and rider availability.", icon: "🗺️" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                >
                  <span className="text-3xl mb-4 block">{item.icon}</span>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <p className="text-sm text-blue-800">
                The final price is always displayed before you confirm — what you see is exactly what you pay.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatedSection>

      {/* Vehicle Types */}
      <section className="bg-gray-50 py-16">
        <AnimatedSection className="max-w-5xl mx-auto px-6">
          {(isInView) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Choose your vehicle</h2>
                <p className="text-gray-500 max-w-xl mx-auto">Pick the right vehicle for your package size. Your price is shown in the app before you confirm.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {vehicleTypes.map((v, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className={`rounded-2xl border p-6 ${v.color}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">{v.icon}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v.tagColor}`}>{v.tag}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{v.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{v.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        Up to {v.maxWeight}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {v.coverage}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatedSection>
      </section>

      {/* Delivery Types */}
      <AnimatedSection className="max-w-5xl mx-auto px-6 py-16">
        {(isInView) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Delivery types</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Choose how your package is handled — each type applies a multiplier to the base price.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {deliveryTypes.map((d, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex gap-4"
                >
                  <span className="text-3xl flex-shrink-0">{d.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{d.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.badge}`}>{d.multiplier}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{d.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>⏱ ETA: <strong className="text-gray-700">{d.eta}</strong></span>
                      <span>✔ Best for: <strong className="text-gray-700">{d.best}</strong></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatedSection>

      {/* Payment Options */}
      <section className="bg-gray-50 py-16">
        <AnimatedSection className="max-w-5xl mx-auto px-6">
          {(isInView) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Payment options</h2>
                <p className="text-gray-500 max-w-xl mx-auto">Multiple ways to pay — choose what works for you.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paymentOptions.map((p, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: idx * 0.15 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{p.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">{p.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{p.description}</p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {p.available}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatedSection>
      </section>

      {/* FAQ */}
      <AnimatedSection className="max-w-3xl mx-auto px-6 py-16">
        {(isInView) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Pricing FAQs</h2>
              <p className="text-gray-500">Common questions about how we charge.</p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: idx * 0.07 }}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 text-sm pr-4">{faq.q}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 bg-white">
                      <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatedSection>

      {/* CTA */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to send your first package?
            </h2>
            <p className="text-gray-400 mb-8">
              Download the RideX app and get an instant price quote before you commit.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/customers"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/businesses"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-colors"
              >
                Business Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
