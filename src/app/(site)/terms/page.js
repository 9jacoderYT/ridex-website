// src/app/(site)/terms/page.js
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `Welcome to RIDEX ("we", "our", "us"). RIDEX is a delivery logistics platform connecting customers, riders, and logistics companies across Nigeria, starting with Ilorin.

By registering, accessing, or using the RIDEX platform — including our mobile apps and website — you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform.

These Terms apply to all users of the platform, including:
• Customers (users sending packages)
• Riders (individuals delivering packages)
• Logistics Companies (businesses managing riders and fulfilling deliveries)`,
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: `To use RIDEX, you must:
• Be at least 18 years of age
• Provide accurate, complete, and current registration information
• Have the legal authority to accept these Terms on behalf of yourself or your organisation

RIDEX is not intended for use by persons under the age of 18. By creating an account, you represent that you meet these requirements.`,
  },
  {
    id: "accounts",
    title: "3. User Accounts",
    content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to:
• Provide truthful and accurate information during registration
• Keep your account details up to date
• Not share your account with others or allow unauthorised access
• Notify RIDEX immediately if you suspect unauthorised use of your account

RIDEX reserves the right to suspend or terminate accounts that violate these Terms, contain false information, or are associated with fraudulent activity.`,
  },
  {
    id: "delivery-services",
    title: "4. Delivery Services",
    content: `RIDEX provides a technology platform that connects senders with riders or logistics companies for the purpose of package delivery.

When you place a delivery order:
• You confirm that the contents of the package are legal and do not violate any applicable laws
• You agree to provide accurate pickup and delivery address information
• You understand that delivery timelines are estimates and may vary due to traffic, weather, or other factors
• You accept that RIDEX is not liable for delays caused by inaccurate information provided by the sender

RIDEX reserves the right to refuse, cancel, or suspend delivery requests that involve illegal items, hazardous materials, or violations of these Terms.`,
  },
  {
    id: "payments",
    title: "5. Payments & Transactions",
    content: `All payments on RIDEX are processed or recorded within the platform.

Prepaid Payments:
• Payments made before delivery are processed through our integrated payment gateway (Flutterwave)
• Delivery fees are calculated based on distance, vehicle type, and platform pricing
• Once a delivery order is confirmed and a rider is matched, cancellation may result in non-refundable processing fees

Wallet:
• RIDEX provides an in-app wallet for prepaid users
• Wallet funds can be used to pay for deliveries
• Wallet refunds are issued in accordance with our cancellation and refund policy

All transactions are tracked and recorded within the RIDEX platform.`,
  },
  {
    id: "pay-on-delivery",
    title: "6. Pay on Delivery (COD)",
    content: `Pay on Delivery (COD) on RIDEX operates as a bank transfer system — it is NOT cash payment.

Eligibility for COD:
• COD is available exclusively to verified Business accounts
• Accounts must maintain a rating of 3.5 or above
• New business accounts must complete a trial period before COD eligibility is granted

How COD Works:
• The RIDEX platform provides a bank account number for payment
• The payer (either sender at pickup or receiver at drop-off) transfers the COD amount to the provided account
• The rider confirms receipt within the platform
• RIDEX distributes the COD amount according to the agreed revenue split

Riders act as collection agents on behalf of RIDEX for COD transactions. All COD payments are tracked and verified within the system.`,
  },
  {
    id: "revenue-split",
    title: "7. Revenue & Earnings",
    content: `RIDEX operates on a revenue-sharing model:

Riders:
• Riders earn a percentage of each delivery fee completed on the platform
• Earnings are credited to the rider's in-app wallet after successful delivery confirmation
• Withdrawals are subject to minimum thresholds and daily limits

Logistics Companies:
• Companies earn a share of delivery fees fulfilled through their registered riders
• Company earnings are credited to the company wallet
• Withdrawals are processed through the platform

Platform:
• RIDEX retains a platform fee from each completed transaction
• Fee structures are subject to change with prior notice to users

RIDEX reserves the right to adjust revenue split percentages through platform settings with appropriate notice.`,
  },
  {
    id: "rider-obligations",
    title: "8. Rider Obligations",
    content: `By registering as a rider on RIDEX, you agree to:
• Provide accurate identity, vehicle, and contact information
• Complete the KYC (Know Your Customer) verification process
• Maintain professional conduct during all deliveries
• Handle packages with care and deliver them to the correct recipient
• Not tamper with, open, or damage packages
• Confirm deliveries accurately within the platform
• Report any issues (accidents, lost packages, disputes) to RIDEX support immediately

Riders who violate these obligations may have their accounts suspended, earnings withheld, or permanently banned from the platform.`,
  },
  {
    id: "company-obligations",
    title: "9. Logistics Company Obligations",
    content: `By registering as a logistics company on RIDEX, you agree to:
• Provide accurate business registration and identity documents
• Ensure all riders registered under your company are verified and compliant
• Manage your riders responsibly and ethically
• Maintain the quality and reliability of deliveries fulfilled through your company
• Not engage in fraudulent manipulation of orders, payments, or ratings
• Comply with all applicable Nigerian business and labour laws

Companies found in violation of these obligations may have their accounts suspended pending investigation, and may be permanently removed from the platform.`,
  },
  {
    id: "tracking",
    title: "10. Tracking & Verification",
    content: `RIDEX provides live tracking and verification features including:
• Real-time rider location tracking during active deliveries
• Unique tracking codes (format: RXTK-XXXXXX) for each delivery
• QR code verification at the point of delivery

The tracking number and QR code are issued to the receiver for verification purposes. Riders do not have access to the tracking number or QR code. Delivery is only confirmed when the verification step is completed correctly within the platform.`,
  },
  {
    id: "prohibited",
    title: "11. Prohibited Activities",
    content: `Users of RIDEX must not:
• Use the platform to deliver illegal, counterfeit, or hazardous items
• Provide false information during registration or order placement
• Manipulate ratings, reviews, or platform metrics
• Harass, threaten, or abuse other users, riders, or RIDEX staff
• Attempt to circumvent platform payments by transacting directly with riders outside the app
• Reverse-engineer, copy, or exploit any part of the RIDEX platform
• Create multiple accounts to abuse promotions, bonuses, or referral systems

Violations may result in immediate account suspension and legal action where applicable.`,
  },
  {
    id: "ratings",
    title: "12. Ratings & Reviews",
    content: `RIDEX operates a two-way rating system:
• Customers can rate riders after delivery completion
• Riders can rate businesses after COD deliveries

Ratings must be honest and based on genuine delivery experiences. Attempts to manipulate ratings — including self-rating, incentivising ratings, or submitting false reviews — are prohibited and may result in account suspension.

RIDEX may use rating data to determine COD eligibility, rider visibility, and platform standing.`,
  },
  {
    id: "data-privacy",
    title: "13. Data & Privacy",
    content: `RIDEX collects and processes personal data to operate the platform. This includes:
• Name, phone number, email address, and account details
• Real-time location data (for riders during active deliveries)
• Payment and transaction records
• Device information and usage data

Your data is used to process deliveries, manage payments, prevent fraud, and improve our services.

Data Retention:
• Standard delivery and transaction data is retained for 60–90 days
• Data may be retained longer for legal compliance, dispute resolution, or fraud prevention

RIDEX will not sell your personal data to third parties. Data may be shared with trusted service providers (payment processors, hosting, analytics) necessary to operate the platform.

For full details, please read our Privacy Policy at ridex.app/privacy.`,
  },
  {
    id: "account-deletion",
    title: "14. Account Deletion",
    content: `You may request deletion of your RIDEX account at any time through:
• In-App: Go to Settings → Delete Account
• Support: Contact RIDEX support through official channels

Upon deletion:
• Your account will be deactivated immediately
• Data will be scheduled for deletion within 60–90 days, or anonymised where necessary
• Some records may be retained longer for legal, financial, or fraud-prevention purposes

Riders and companies must withdraw any available earnings before requesting deletion. RIDEX may delay deletion requests where there are active disputes, fraud investigations, or outstanding financial obligations.

Account deletion is irreversible.`,
  },
  {
    id: "disputes",
    title: "15. Disputes & Resolution",
    content: `In the event of a dispute between users, riders, or companies:
• Report the issue to RIDEX support through in-app channels as soon as possible
• RIDEX will investigate disputes and may review platform data, tracking records, and transaction logs
• RIDEX's decision on disputes is final and binding within the platform

RIDEX is not liable for disputes arising from inaccurate information provided by users, third-party service failures, or events beyond our reasonable control.`,
  },
  {
    id: "liability",
    title: "16. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law:
• RIDEX provides the platform on an "as-is" basis
• RIDEX does not guarantee uninterrupted, error-free, or completely secure operation of the platform
• RIDEX is not liable for indirect, incidental, or consequential damages arising from use of the platform
• RIDEX's total liability to any user for any claim arising from these Terms shall not exceed the total fees paid by that user in the preceding 30 days

RIDEX is not responsible for the actions of riders, companies, or third parties. We act as a technology intermediary between parties.`,
  },
  {
    id: "changes",
    title: "17. Changes to These Terms",
    content: `RIDEX may update these Terms and Conditions from time to time. When we do:
• We will update the "Last Updated" date at the top of this page
• For significant changes, we may notify users through the app or email

Continued use of the RIDEX platform after changes are published constitutes your acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the platform.`,
  },
  {
    id: "governing-law",
    title: "18. Governing Law",
    content: `These Terms and Conditions are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms that cannot be resolved through RIDEX's internal dispute resolution process shall be subject to the jurisdiction of the courts of Nigeria.`,
  },
  {
    id: "contact",
    title: "19. Contact Us",
    content: `For questions, concerns, or complaints about these Terms and Conditions, please contact RIDEX support:

• In-App Support: Open the RIDEX app → Support → Send a message
• Email: support@ridex.app
• Operating Region: Ilorin, Nigeria (expanding soon)

Our support team aims to respond within 24 hours for standard enquiries, and faster for urgent delivery or payment issues.`,
  },
];

export default function TermsPage() {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Legal
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Terms &amp; Conditions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These Terms govern your use of the RIDEX platform. Please read them carefully before using our services.
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
                <p className="text-gray-700 font-semibold mb-2">Questions about these Terms?</p>
                <p className="text-sm text-gray-500 mb-4">Our support team is here to help.</p>
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
