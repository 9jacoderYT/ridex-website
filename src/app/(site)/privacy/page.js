// src/app/(site)/privacy/page.js
"use client";

import { motion } from "framer-motion";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `RIDEX ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use the RIDEX platform — including our mobile apps and website.

By using RIDEX, you agree to the collection and use of information in accordance with this Policy. This Policy applies to all users: Customers, Riders, and Logistics Companies.`,
  },
  {
    id: "information-collected",
    title: "2. Information We Collect",
    content: `We collect the following types of information:

Account Information:
• Full name, email address, and phone number
• Profile photo (optional)
• Government-issued ID (for riders and company directors)

Location Data:
• Real-time GPS location of riders during active deliveries
• Pickup and drop-off addresses entered when placing orders

Payment & Transaction Data:
• Delivery fee payments and wallet top-ups
• COD transaction records
• Withdrawal requests and bank account details

Device & Usage Data:
• Device type, operating system, and app version
• Push notification tokens (Expo push tokens)
• Usage logs and in-app activity

Business / Company Data:
• Company name, CAC registration details
• Business address and contact information
• Rider roster and earnings data`,
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: `We use your information to:

• Create and manage your account
• Process delivery orders and match riders
• Calculate and collect delivery fees
• Enable real-time tracking during deliveries
• Send push notifications for order updates
• Process payments and manage in-app wallets
• Verify identities and prevent fraud
• Resolve disputes and respond to support requests
• Improve platform performance and user experience
• Comply with legal and regulatory obligations

We do not use your information for unrelated marketing purposes without your consent.`,
  },
  {
    id: "location-data",
    title: "4. Location Data",
    content: `RIDEX collects real-time location data from riders during active deliveries. This data is used to:

• Show customers live tracking of their delivery
• Calculate accurate ETAs
• Verify delivery routes and completion

Rider location is only tracked when a delivery is active. Location tracking stops once the delivery is confirmed or cancelled. Customers can see the rider's approximate location during delivery but do not have access to historical location data.`,
  },
  {
    id: "data-sharing",
    title: "5. How We Share Your Information",
    content: `We do not sell your personal data. We may share your information with:

Service Providers:
• Payment processors (Flutterwave) to handle transactions
• Cloud infrastructure and database providers (Supabase)
• Push notification services (Expo) to deliver order alerts

Within the Platform:
• Rider names and vehicle info are shared with customers during active deliveries
• Business sender info is visible to assigned riders for COD deliveries
• Company admins can view rider profiles and earnings within their company

Legal & Compliance:
• We may disclose data to law enforcement or regulatory bodies if required by Nigerian law or court order
• We may share data to investigate fraud, abuse, or safety threats

All third-party providers are bound by data processing agreements and may only use your data to provide services to RIDEX.`,
  },
  {
    id: "data-retention",
    title: "6. Data Retention",
    content: `We retain your data for as long as necessary to provide our services:

• Active account data: retained while your account is active
• Delivery and transaction records: 60–90 days after completion
• Financial records: may be retained longer for tax and legal compliance
• Fraud or dispute records: retained as long as necessary for resolution

When you delete your account, personal data is scheduled for deletion within 60–90 days, or anonymised where full deletion is not possible (e.g. financial audit trails).`,
  },
  {
    id: "data-security",
    title: "7. Data Security",
    content: `We take appropriate technical and organisational measures to protect your personal information, including:

• Encrypted data transmission (HTTPS/TLS)
• Secure database access controls via Supabase Row-Level Security
• Server-side payment verification (no raw card data stored on our servers)
• Regular security reviews and access audits

While we implement strong safeguards, no system is completely immune to breaches. In the event of a data breach affecting your rights and freedoms, we will notify affected users and relevant authorities as required by law.`,
  },
  {
    id: "your-rights",
    title: "8. Your Rights",
    content: `You have the following rights regarding your personal data:

• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate or incomplete data
• Deletion: Request deletion of your account and associated data (see Account Deletion in our Terms)
• Portability: Request your data in a portable format where technically feasible
• Objection: Object to certain types of data processing

To exercise any of these rights, contact RIDEX support through the app or at support@ridex.app. We will respond within 30 days.`,
  },
  {
    id: "push-notifications",
    title: "9. Push Notifications",
    content: `RIDEX uses Expo push notifications to send you order updates, delivery status alerts, and important account notifications.

• You can manage notification preferences within your device settings
• Disabling notifications will not affect your ability to use the app, but you may miss important delivery updates
• Push notification tokens are stored securely and used solely to deliver relevant in-app communications`,
  },
  {
    id: "children",
    title: "10. Children's Privacy",
    content: `RIDEX is not intended for use by anyone under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has created an account, we will delete the account and associated data promptly.

If you believe a minor has provided us with personal information, please contact support@ridex.app.`,
  },
  {
    id: "changes",
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. When we do:

• The "Last Updated" date will be revised
• For significant changes, we will notify users through the app or email

Continued use of RIDEX after changes are published means you accept the updated Policy. If you do not agree, you should stop using the platform and request account deletion.`,
  },
  {
    id: "contact",
    title: "12. Contact Us",
    content: `If you have questions, concerns, or requests related to this Privacy Policy, please contact us:

• In-App: Open the RIDEX app → Support → Send a message
• Email: support@ridex.app
• Operating Region: Ilorin, Nigeria (expanding soon)

We aim to respond to all privacy-related requests within 30 days.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-700 text-sm font-semibold mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Legal
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              How RIDEX collects, uses, and protects your personal information.
            </p>
            <p className="text-sm text-gray-400 mt-4">Last Updated: April 2026</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Sticky Table of Contents */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contents</p>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-xs text-gray-500 hover:text-green-600 py-1 transition-colors leading-snug"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-10">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.03, duration: 0.4 }}
                  className="scroll-mt-28"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
                    {section.title}
                  </h2>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </motion.div>
              ))}

              {/* Bottom CTA */}
              <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
                <p className="text-gray-700 font-semibold mb-2">Questions about your privacy?</p>
                <p className="text-sm text-gray-500 mb-4">Our support team is happy to help.</p>
                <a
                  href="mailto:support@ridex.app"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-colors text-sm"
                >
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
