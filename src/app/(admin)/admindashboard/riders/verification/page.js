import { Suspense } from "react";
import AllRiders from "@/components/admin/AllRiders";

export const metadata = {
  title: "Rider Verification — RideX Admin",
};

export default function VerificationPage() {
  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-0">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900">Rider Verification</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Open any rider to review their documents — rider photo, vehicle photo, and plate photo.
                Use the status actions to activate or suspend riders after verification.
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
