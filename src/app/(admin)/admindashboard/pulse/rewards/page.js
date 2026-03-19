"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import {
  getReferralSettings,
  updateReferralSettings,
} from "@/lib/server-actions/admin/manageReferrals";

export default function RewardsManagementPage() {
  const { admin, loading } = useAdmin();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [settings, setSettings] = useState({
    referrerReward: 500,
    referredReward: 250,
    isActive: true,
  });

  // Edit form state
  const [formData, setFormData] = useState({
    referrerReward: 500,
    referredReward: 250,
    isActive: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/loginadminusers");
    }
  }, [admin, loading, router]);

  useEffect(() => {
    if (admin) {
      fetchSettings();
    }
  }, [admin]);

  useEffect(() => {
    setHasChanges(
      formData.referrerReward !== settings.referrerReward ||
        formData.referredReward !== settings.referredReward ||
        formData.isActive !== settings.isActive,
    );
  }, [formData, settings]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const result = await getReferralSettings();
      if (result.success && result.settings) {
        const s = {
          referrerReward: result.settings.referrer_reward_amount,
          referredReward: result.settings.referred_reward_amount,
          isActive: result.settings.is_active,
        };
        setSettings(s);
        setFormData(s);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (formData.referrerReward < 0 || formData.referredReward < 0) {
      setMessage({ type: "error", text: "Reward amounts cannot be negative" });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const result = await updateReferralSettings({
        referrerReward: parseFloat(formData.referrerReward),
        referredReward: parseFloat(formData.referredReward),
        isActive: formData.isActive,
      });

      if (result.success) {
        const s = {
          referrerReward: result.settings.referrer_reward_amount,
          referredReward: result.settings.referred_reward_amount,
          isActive: result.settings.is_active,
        };
        setSettings(s);
        setFormData(s);
        setMessage({
          type: "success",
          text: "Referral settings updated successfully",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update settings",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to update settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    setMessage(null);
  };

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Rewards Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure referral reward amounts and program status
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Program Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Program Status
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enable or disable the referral program. When disabled, no new
                  referrals can be processed.
                </p>
              </div>
              <button
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  formData.isActive ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    formData.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  formData.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    formData.isActive ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                {formData.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Reward Configuration */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Reward Configuration
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Set the promo credit amounts awarded when a referral is completed
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referrer Reward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referrer Reward ({"\u20A6"})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Amount credited to the user who shared their referral code
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {"\u20A6"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.referrerReward}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referrerReward: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full pl-8 pr-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Referred User Reward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New User Welcome Bonus ({"\u20A6"})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Amount credited to the new user who joins using a referral
                  code
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {"\u20A6"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.referredReward}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referredReward: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full pl-8 pr-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              Preview
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                When a user refers someone, the <strong>referrer</strong> will
                receive{" "}
                <strong>
                  {"\u20A6"}{parseFloat(formData.referrerReward).toLocaleString()}
                </strong>{" "}
                in promo credits.
              </p>
              <p>
                The <strong>new user</strong> who joins with a referral code
                will receive{" "}
                <strong>
                  {"\u20A6"}{parseFloat(formData.referredReward).toLocaleString()}
                </strong>{" "}
                as a welcome bonus.
              </p>
              <p>
                Total cost per referral:{" "}
                <strong>
                  {"\u20A6"}
                  {(
                    parseFloat(formData.referrerReward) +
                    parseFloat(formData.referredReward)
                  ).toLocaleString()}
                </strong>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Discard Changes
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasChanges && !isSaving
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
