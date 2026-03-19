import { Suspense } from "react";
import AllRiders from "@/components/admin/AllRiders";

export const metadata = {
  title: "Rider Onboarding — RideX Admin",
};

export default function OnboardingPage() {
  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-0">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900">Rider Onboarding</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Newly added riders are created by companies via the admin portal. Click any rider to review their profile and documents.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Suspense>
        <AllRiders presetStatus="inactive" />
      </Suspense>
    </div>
  );
}
