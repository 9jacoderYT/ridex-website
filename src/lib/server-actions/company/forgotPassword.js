// Path: lib/server-actions/company/forgotPassword.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@ridex.com";
const OTP_EXPIRY_MINUTES = 15;

// ── Step 1: Request OTP ───────────────────────────────────────────────────────

export async function requestPasswordReset(email) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return { success: false, error: "Email is required" };

    // Check if company exists (silent — don't reveal if email is registered)
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, company_name")
      .eq("email", normalizedEmail)
      .single();

    // Always return success to avoid leaking whether email exists
    if (!company) return { success: true };

    // Invalidate any previous unused codes for this email
    await supabaseAdmin
      .from("password_reset_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Store in DB
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_codes")
      .insert({ email: normalizedEmail, code, expires_at: expiresAt });

    if (insertError) {
      console.error("Error inserting reset code:", insertError);
      return { success: false, error: "Failed to generate reset code. Please try again." };
    }

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: "Your RideX Password Reset Code",
      html: buildEmailHtml(company.company_name, code),
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return { success: false, error: "Failed to send email. Please try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in requestPasswordReset:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

// ── Step 2: Verify OTP ────────────────────────────────────────────────────────

export async function verifyResetCode(email, code) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !code) {
      return { success: false, error: "Email and code are required" };
    }

    // Find the most recent unused, unexpired code for this email
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

    // Generate a one-time reset token and store it on the record
    const resetToken = crypto.randomUUID();
    await supabaseAdmin
      .from("password_reset_codes")
      .update({ reset_token: resetToken })
      .eq("id", record.id);

    return { success: true, resetToken };
  } catch (err) {
    console.error("Error in verifyResetCode:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Step 3: Reset Password ────────────────────────────────────────────────────

export async function resetPassword(email, resetToken, newPassword) {
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !resetToken || !newPassword) {
      return { success: false, error: "All fields are required" };
    }

    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    // Verify the reset token is valid and unexpired
    const { data: record, error } = await supabaseAdmin
      .from("password_reset_codes")
      .select("id, expires_at, used")
      .eq("email", normalizedEmail)
      .eq("reset_token", resetToken)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (error || !record) {
      return { success: false, error: "Reset session expired. Please start over." };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update company password
    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({ password_hash: passwordHash })
      .eq("email", normalizedEmail);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return { success: false, error: "Failed to update password. Please try again." };
    }

    // Mark reset code as used
    await supabaseAdmin
      .from("password_reset_codes")
      .update({ used: true })
      .eq("id", record.id);

    return { success: true };
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Email Template ────────────────────────────────────────────────────────────

function buildEmailHtml(companyName, code) {
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
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b,#0f766e);padding:32px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">RideX Business</p>
              <p style="margin:8px 0 0;font-size:13px;color:#a7f3d0;">Password Reset Request</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Hi, ${companyName}</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                We received a request to reset your password. Use the code below to continue.
                This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Your Reset Code</p>
                <p style="margin:0;font-size:40px;font-weight:800;color:#065f46;letter-spacing:10px;">${code}</p>
              </div>
              <p style="margin:0 0 16px;font-size:13px;color:#9ca3af;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email. Your account remains secure.
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
