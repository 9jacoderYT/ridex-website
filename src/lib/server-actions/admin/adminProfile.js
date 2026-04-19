"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { getSession } from "@/lib/utils/session";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function isSuperAdminEnv(session) {
  return session?.id === "super-admin-env";
}

// ─── Send OTP to admin's email ────────────────────────────────────────────────

export async function sendAdminPasswordOTP() {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };
  if (isSuperAdminEnv(session)) {
    return { success: false, error: "Super admin password is managed via environment variables" };
  }

  const adminId = session.id;

  const { data: adminUser, error: fetchErr } = await supabaseAdmin
    .from("admin_users")
    .select("email, full_name, username")
    .eq("id", adminId)
    .single();

  if (fetchErr || !adminUser) return { success: false, error: "Admin account not found" };

  const email = adminUser.email;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Invalidate any existing unused OTPs for this admin
  await supabaseAdmin
    .from("admin_otps")
    .update({ used: true })
    .eq("admin_id", adminId)
    .eq("used", false);

  const { error: insertErr } = await supabaseAdmin.from("admin_otps").insert({
    admin_id: adminId,
    email,
    code,
    expires_at: expiresAt,
  });

  if (insertErr) return { success: false, error: "Failed to generate verification code" };

  const name = adminUser.full_name || adminUser.username || "Admin";

  const { error: emailErr } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: "RideX Admin — Password Change Verification Code",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Password Change Verification</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#0f172a;padding:20px 32px;">
          <span style="color:#3b82f6;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Ride<span style="color:#fff;">X</span></span>
          <span style="color:#94a3b8;font-size:13px;margin-left:12px;">Admin Portal</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Password Change Request</p>
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;">Hi ${name},</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
            We received a request to change the password for your RideX admin account.
            Use the verification code below to proceed.
          </p>

          <div style="background:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
            <p style="margin:0;font-size:40px;font-weight:800;color:#1e40af;letter-spacing:8px;font-family:monospace;">${code}</p>
          </div>

          <div style="background:#fef9c3;border-left:4px solid #eab308;border-radius:6px;padding:14px 16px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:#854d0e;">
              <strong>⏱ This code expires in 10 minutes.</strong> If you didn't request a password change, you can safely ignore this email — your account remains secure.
            </p>
          </div>

          <p style="margin:0;font-size:13px;color:#94a3b8;">For security, never share this code with anyone, including RideX staff.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated message from RideX Admin Portal. Do not reply.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
  });

  if (emailErr) {
    console.error("sendAdminPasswordOTP email error:", emailErr);
    return { success: false, error: "Failed to send verification email. Please try again." };
  }

  return { success: true, email };
}

// ─── Verify OTP and change password ──────────────────────────────────────────

export async function verifyOTPAndChangePassword(code, newPassword) {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };
  if (isSuperAdminEnv(session)) {
    return { success: false, error: "Super admin password is managed via environment variables" };
  }

  if (!code || !newPassword) return { success: false, error: "Code and new password are required" };
  if (newPassword.length < 8) return { success: false, error: "Password must be at least 8 characters" };

  const adminId = session.id;

  const { data: otp, error: otpErr } = await supabaseAdmin
    .from("admin_otps")
    .select("id")
    .eq("admin_id", adminId)
    .eq("code", code.trim())
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (otpErr || !otp) {
    return { success: false, error: "Invalid or expired verification code" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const { error: updateErr } = await supabaseAdmin
    .from("admin_users")
    .update({ password_hash: passwordHash })
    .eq("id", adminId);

  if (updateErr) return { success: false, error: "Failed to update password. Please try again." };

  await supabaseAdmin.from("admin_otps").update({ used: true }).eq("id", otp.id);

  return { success: true };
}

// ─── Update avatar style ──────────────────────────────────────────────────────

export async function updateAdminAvatar(avatarStyle) {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };
  if (isSuperAdminEnv(session)) return { success: false, error: "Not applicable for super admin" };

  const validStyles = ["blue", "purple", "amber"];
  if (!validStyles.includes(avatarStyle)) return { success: false, error: "Invalid avatar style" };

  const { error } = await supabaseAdmin
    .from("admin_users")
    .update({ avatar_style: avatarStyle })
    .eq("id", session.id);

  if (error) return { success: false, error: "Failed to update avatar" };
  return { success: true };
}
