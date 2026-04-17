// src/app/(site)/faq/page.js
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const categories = [
  {
    key: "customers",
    label: "Customers",
    color: "from-green-500 to-emerald-600",
    faqs: [
      {
        question: "How do I book a delivery?",
        answer:
          "Download the RideX app from the App Store or Google Play. Sign up, enter your pickup and delivery locations, choose a vehicle type, and confirm your order. A rider will be assigned within minutes.",
      },
      {
        question: "How can I track my package?",
        answer:
          "Once your delivery is confirmed, you'll see real-time tracking on the app. You can follow your rider's location, get ETA updates, and receive notifications at every stage — picked up, in transit, and delivered.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept card payments, bank transfers, and cash on delivery. You can also fund your RideX wallet for faster checkout on future orders.",
      },
      {
        question: "What if my package is damaged or lost?",
        answer:
          "All deliveries on RideX are covered by basic insurance. If your package is damaged or lost, contact support immediately through the app or at support@ridex.ng. We'll investigate and process your claim within 48 hours.",
      },
      {
        question: "Can I schedule a delivery for later?",
        answer:
          "Yes! When booking, you can select a future date and time for pickup. Scheduled deliveries are available up to 7 days in advance.",
      },
      {
        question: "How are delivery fees calculated?",
        answer:
          "Fees are based on distance, package weight, vehicle type, and delivery speed (standard or priority). You'll see the exact price before confirming your order — no hidden charges.",
      },
    ],
  },
  {
    key: "businesses",
    label: "Businesses",
    color: "from-blue-500 to-indigo-600",
    faqs: [
      {
        question: "How do I set up a business account?",
        answer:
          "Setting up a business account is just like creating a regular customer account — download the RideX app, sign up, and you're ready to start sending deliveries right away. No special onboarding or approvals required.",
      },
      {
        question: "Can I send bulk orders?",
        answer:
          "Absolutely. Our business dashboard lets you upload bulk orders via CSV or through our API. You can schedule hundreds of deliveries at once and track them all from one screen.",
      },
      {
        question: "Do you offer volume discounts?",
        answer:
          "Yes. The app provides promotions and volume discounts automatically. The more you ship, the better the deals available to you — no need to negotiate or contact anyone.",
      },
      {
        question: "Can I integrate RideX with my e-commerce platform?",
        answer:
          "Yes. We provide REST APIs and webhooks that integrate with popular platforms like Shopify, WooCommerce, and custom systems. Our developer docs make integration straightforward.",
      },
      {
        question: "Do I get a dedicated account manager?",
        answer:
          "Business accounts with regular volume get a dedicated account manager who handles onboarding, resolves issues, and optimizes your delivery operations.",
      },
      {
        question: "How do I receive delivery reports?",
        answer:
          "Your business dashboard provides real-time analytics and downloadable reports. You can track delivery success rates, average delivery times, costs, and rider performance — daily, weekly, or monthly.",
      },
    ],
  },
  {
    key: "companies",
    label: "Logistics Companies",
    color: "from-purple-500 to-violet-600",
    faqs: [
      {
        question: "How long does company verification take?",
        answer:
          "Company verification typically takes 24-48 hours. Our team reviews your documentation to ensure all requirements are met. You'll receive an email notification once your account is approved.",
      },
      {
        question: "How many riders can I add to my company?",
        answer:
          "There's no limit! You can onboard unlimited riders to your company. Each rider can be managed individually with custom commission rates and performance tracking.",
      },
      {
        question: "What documents do I need for registration?",
        answer:
          "You'll need your company's CAC registration certificate, valid government-issued ID of the company director, proof of business address, and any relevant transportation licenses.",
      },
      {
        question: "How does payment processing work?",
        answer:
          "RideX handles all customer payments. Your earnings (delivery fees minus platform commission) are automatically calculated and transferred to your registered bank account on a weekly basis.",
      },
      {
        question: "Can riders work for multiple companies?",
        answer:
          "No, riders are exclusively associated with one logistics company at a time to ensure accountability and service quality. They must complete any active deliveries before switching companies.",
      },
      {
        question: "What's the platform commission?",
        answer:
          "RideX charges a small platform fee on each successful delivery. The exact percentage depends on your company's delivery volume and service tier. Contact our sales team for detailed pricing.",
      },
      {
        question: "Do you provide rider insurance?",
        answer:
          "Basic insurance coverage is included for all active deliveries through the platform. We recommend companies obtain additional comprehensive insurance for their riders.",
      },
      {
        question: "Which cities are you currently operating in?",
        answer:
          "We're currently active in 20+ major Nigerian cities including Lagos, Abuja, Port Harcourt, Kano, Ibadan, and more. We're constantly expanding based on demand.",
      },
    ],
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("customers");
  const [openIndex, setOpenIndex] = useState(null);

  const activeData = categories.find((c) => c.key === activeCategory);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Find answers to common questions about using RideX as a customer,
              business, or logistics company
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 rounded-full p-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setOpenIndex(null);
                  }}
                  className={`relative px-5 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeCategory === cat.key
                      ? "text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {activeCategory === cat.key && (
                    <motion.div
                      layoutId="faq-tab-bg"
                      className={`absolute inset-0 bg-gradient-to-r ${cat.color} rounded-full`}
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto">
            {activeData.faqs.map((faq, index) => (
              <motion.div
                key={`${activeCategory}-${index}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="mb-4"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-all border border-gray-200 hover:border-green-500 group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.div>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openIndex === index ? "auto" : 0,
                      opacity: openIndex === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-gray-600 mt-4 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Still have questions */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mt-16 max-w-2xl mx-auto p-8 bg-green-50 rounded-2xl border border-green-200"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you 24/7
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:support@ridex.ng"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-full shadow-lg transition-all hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </a>
              <a
                href="tel:+2348007433964"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
