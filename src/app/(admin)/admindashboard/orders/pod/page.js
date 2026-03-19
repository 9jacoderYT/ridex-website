import { Suspense } from "react";
import AllOrders from "@/components/admin/AllOrders";

export const metadata = {
  title: "POD Verification — RideX Admin",
};

export default function PODPage() {
  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-0">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900">Proof of Delivery (POD)</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Showing all delivered orders. Recipients verify delivery by scanning the QR code with the tracking number.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Suspense>
        <AllOrders presetStatus="delivered" />
      </Suspense>
    </div>
  );
}
