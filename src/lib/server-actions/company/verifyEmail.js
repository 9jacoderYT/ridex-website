// Path: lib/server-actions/company/verifyEmail.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@ridex.com";
const OTP_EXPIRY_MINUTES = 15;

// ── Step 1: Send verification code ────────────────────────────────────────────

export async function sendVerificationCode(email) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return { success: false, error: "Email is required" };

    // Check if email is already registered
    const { data: existing } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      return {
        success: false,
        error: "This email is already registered. Please use a different email or log in.",
      };
    }

    // Invalidate any previous unused codes for this email
    await supabaseAdmin
      .from("password_reset_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("password_reset_codes")
      .insert({ email: normalizedEmail, code, expires_at: expiresAt });

    if (insertError) {
      console.error("Error inserting verification code:", insertError);
      return { success: false, error: "Failed to generate code. Please try again." };
    }

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: "Verify your RideX Business email",
      html: buildVerifyEmailHtml(code),
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return { success: false, error: "Failed to send verification email. Please try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("sendVerificationCode error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// ── Step 2: Verify code ────────────────────────────────────────────────────────

export async function verifyEmailCode(email, code) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !code) {
      return { success: false, error: "Email and code are required" };
    }

    const { data: record, error } = await supabaseAdmin
      .from("password_reset_codes")
      .select("id, code, expires_at, used")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !record) {
      return { success: false, error: "Invalid or expired code. Please request a new one." };
    }

    if (record.code !== code.trim()) {
      return { success: false, error: "Incorrect code. Please check and try again." };
    }

    // Mark as used
    await supabaseAdmin
      .from("password_reset_codes")
      .update({ used: true })
      .eq("id", record.id);

    return { success: true };
  } catch (err) {
    console.error("verifyEmailCode error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Email Template ─────────────────────────────────────────────────────────────

function buildVerifyEmailHtml(code) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b,#0f766e);padding:32px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">RideX Business</p>
              <p style="margin:8px 0 0;font-size:13px;color:#a7f3d0;">Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Verify your email address</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Use the code below to verify your email during registration.
                This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
              </p>
              <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
                <p style="margin:0;font-size:40px;font-weight:800;color:#065f46;letter-spacing:10px;">${code}</p>
              </div>
              <p style="margin:0 0 16px;font-size:13px;color:#9ca3af;line-height:1.6;">
                If you did not attempt to register, you can safely ignore this email.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                © ${new Date().getFullYear()} RideX. Secure connection · SSL encrypted
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
