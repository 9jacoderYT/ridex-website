"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import {
  sendAdminPasswordOTP,
  verifyOTPAndChangePassword,
  updateAdminAvatar,
} from "@/lib/server-actions/admin/adminProfile";

const AVATAR_OPTIONS = [
  {
    key: "blue",
    label: "Ocean",
    gradient: "from-blue-600 to-blue-700",
    ring: "ring-blue-500",
    preview: "bg-gradient-to-br from-blue-600 to-blue-700",
  },
  {
    key: "purple",
    label: "Violet",
    gradient: "from-purple-500 to-violet-700",
    ring: "ring-purple-500",
    preview: "bg-gradient-to-br from-purple-500 to-violet-700",
  },
  {
    key: "amber",
    label: "Ember",
    gradient: "from-amber-500 to-orange-600",
    ring: "ring-amber-500",
    preview: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
];

// Password strength checker
function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  if (score <= 2) return { label: "Fair", color: "bg-amber-500", width: "w-2/4" };
  if (score <= 3) return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
  return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
}

export default function ProfileSettingsModal({ onClose }) {
  const { admin, updateAdminData } = useAdmin();
  const isSuperAdmin = admin?.id === "super-admin-env";

  // Avatar state
  const [selectedAvatar, setSelectedAvatar] = useState(admin?.avatarStyle || "blue");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);

  // Password change state
  const [pwStep, setPwStep] = useState("idle"); // idle | sending | code_sent | verifying | done
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const strength = getPasswordStrength(newPassword);

  async function handleSendOTP() {
    setPwStep("sending");
    setPwError("");
    const res = await sendAdminPasswordOTP();
    if (!res.success) {
      setPwError(res.error);
      setPwStep("idle");
      return;
    }
    setSentEmail(res.email);
    setPwStep("code_sent");
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    if (!code.trim()) {
      setPwError("Please enter the verification code");
      return;
    }
    setPwStep("verifying");
    const res = await verifyOTPAndChangePassword(code.trim(), newPassword);
    if (!res.success) {
      setPwError(res.error);
      setPwStep("code_sent");
      return;
    }
    setPwStep("done");
  }

  async function handleSaveAvatar() {
    if (selectedAvatar === (admin?.avatarStyle || "blue")) {
      setAvatarMsg({ type: "info", text: "No change made" });
      return;
    }
    setAvatarSaving(true);
    setAvatarMsg(null);
    const res = await updateAdminAvatar(selectedAvatar);
    setAvatarSaving(false);
    if (!res.success) {
      setAvatarMsg({ type: "error", text: res.error });
      return;
    }
    updateAdminData({ avatarStyle: selectedAvatar });
    setAvatarMsg({ type: "success", text: "Avatar updated!" });
  }

  const initial = admin?.username?.charAt(0).toUpperCase() || "A";
  const currentOption = AVATAR_OPTIONS.find((o) => o.key === selectedAvatar) || AVATAR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${currentOption.gradient} flex items-center justify-center shadow-sm`}>
              <span className="text-white text-sm font-bold">{initial}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Profile Settings</h2>
              <p className="text-xs text-gray-500">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* ── Avatar Section ─────────────────────────────────────────── */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Choose Avatar</h3>
            <p className="text-xs text-gray-500 mb-4">Pick a color theme for your profile icon</p>

            <div className="flex items-center gap-4 mb-4">
              {AVATAR_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSelectedAvatar(option.key)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${option.preview} flex items-center justify-center shadow-md transition-all duration-200 ${
                      selectedAvatar === option.key
                        ? `ring-3 ring-offset-2 ${option.ring} scale-110`
                        : "hover:scale-105 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span className="text-white text-xl font-bold">{initial}</span>
                    {selectedAvatar === option.key && (
                      <div className="absolute">
                        {/* active indicator handled by ring */}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      selectedAvatar === option.key ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>

            {isSuperAdmin ? (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Avatar changes are not supported for the super admin account.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAvatar}
                  disabled={avatarSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {avatarSaving ? "Saving…" : "Save Avatar"}
                </button>
                {avatarMsg && (
                  <span
                    className={`text-xs font-medium ${
                      avatarMsg.type === "success"
                        ? "text-emerald-600"
                        : avatarMsg.type === "error"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {avatarMsg.text}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Change Password Section ────────────────────────────────── */}
          <div className="px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Change Password</h3>

            {isSuperAdmin ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-medium mb-1">Super admin account</p>
                <p className="text-xs text-amber-700">
                  The super admin password is managed via environment variables and cannot be changed here.
                </p>
              </div>
            ) : pwStep === "done" ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Password changed successfully!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Your new password is active. You&apos;ll use it on your next login.</p>
                </div>
              </div>
            ) : pwStep === "idle" ? (
              <div>
                <p className="text-xs text-gray-500 mb-4">
                  We&apos;ll send a 6-digit verification code to <span className="font-medium text-gray-700">{admin?.email}</span> before making any changes.
                </p>
                <button
                  onClick={handleSendOTP}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Verification Code
                </button>
                {pwError && <p className="text-xs text-red-600 mt-2">{pwError}</p>}
              </div>
            ) : pwStep === "sending" ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Sending code to {admin?.email}…
              </div>
            ) : (
              /* code_sent or verifying */
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-blue-800">
                    Code sent to <strong>{sentEmail}</strong>. Expires in 10 minutes.{" "}
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="underline font-medium hover:text-blue-900"
                    >
                      Resend
                    </button>
                  </p>
                </div>

                {/* Code input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPassword && strength && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                      </div>
                      <p className={`text-xs mt-1 font-medium ${strength.color.replace("bg-", "text-")}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords don&apos;t match</p>
                  )}
                </div>

                {pwError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-700">{pwError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwStep === "verifying" || !code || !newPassword || !confirmPassword}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {pwStep === "verifying" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Changing Password…
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
