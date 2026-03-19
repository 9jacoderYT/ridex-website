import { Suspense } from "react";
import AllRiders from "@/components/admin/AllRiders";

export const metadata = {
  title: "Rider Vehicles — RideX Admin",
};

export default function VehiclesPage() {
  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-0">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16a3 3 0 100-6 3 3 0 000 6zM7 16a3 3 0 100-6 3 3 0 000 6zM7 13h4l2-4h2" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-800">Vehicle Registry</p>
              <p className="text-sm text-gray-500 mt-0.5">
                View all rider vehicles. Click any rider to see their vehicle photo, plate number, and license details.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Suspense>
        <AllRiders />
      </Suspense>
    </div>
  );
}
