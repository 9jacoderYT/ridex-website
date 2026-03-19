import { Suspense } from "react";
import AllOrders from "@/components/admin/AllOrders";

export const metadata = {
  title: "Failed Deliveries — RideX Admin",
};

export default function FailedDeliveriesPage() {
  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-0">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-900">Failed &amp; Cancelled Deliveries</p>
              <p className="text-sm text-red-700 mt-0.5">
                Prepaid orders cancelled after 2 hours are automatically refunded to the customer's wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Suspense>
        <AllOrders presetStatus="cancelled" />
      </Suspense>
    </div>
  );
}
