"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

/** Called from /admin-setup page — verifies token, sets password, activates account */
export async function verifyInviteToken(token, password) {
  try {
    if (!token || !password) {
      return { success: false, error: "Token and password are required" };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    // Find user by token
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("admin_users")
      .select("id, email, full_name, role_name, invite_expires_at, password_set")
      .eq("invite_token", token)
      .single();

    if (fetchError || !user) {
      return { success: false, error: "Invalid or expired invitation link" };
    }

    // Check expiry
    if (new Date(user.invite_expires_at) < new Date()) {
      return {
        success: false,
        error: "This invitation link has expired. Please ask the Super Admin to resend the invite.",
      };
    }

    // Hash password and activate account
    const password_hash = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({
        password_hash,
        password_set: true,
        is_active: true,
        invite_token: null,
        invite_expires_at: null,
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return {
      success: true,
      message: "Password set successfully. You can now log in.",
      email: user.email,
    };
  } catch (error) {
    console.error("Error verifying invite token:", error);
    return { success: false, error: error.message };
  }
}

/** Called from /admin-forgot-password — sends a password reset email */
export async function sendPasswordReset(email) {
  try {
    if (!email) {
      return { success: false, error: "Email is required" };
    }

    const { data: user } = await supabaseAdmin
      .from("admin_users")
      .select("id, full_name, password_set, is_suspended")
      .eq("email", email.trim().toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!user || !user.password_set || user.is_suspended) {
      return {
        success: true,
        message: "If an account exists for this email, a reset link has been sent.",
      };
    }

    const reset_token = crypto.randomBytes(32).toString("hex");
    const reset_expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabaseAdmin
      .from("admin_users")
      .update({ invite_token: reset_token, invite_expires_at: reset_expires_at })
      .eq("id", user.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/admin-setup?token=${reset_token}&mode=reset`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "RIDEX Admin — Password Reset",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #111;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 700; color: #2563eb;">RIDEX</span>
            <span style="font-size: 14px; color: #6b7280; margin-left: 8px;">Admin Panel</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #4b5563; margin-bottom: 4px;">
            ${user.full_name ? `Hi ${user.full_name},` : "Hi,"} we received a request to reset your RIDEX admin password.
          </p>
          <p style="color: #4b5563; margin-bottom: 24px;">
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
          <p style="color: #d1d5db; font-size: 12px; margin-top: 8px;">
            Link: ${resetUrl}
          </p>
        </div>
      `,
    });

    return {
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    };
  } catch (error) {
    console.error("Error sending password reset:", error);
    return { success: false, error: "Failed to send reset email. Please try again." };
  }
}

/** Suspend or unsuspend a user */
export async function setSuspendedStatus(userId, isSuspended) {
  try {
    if (!userId) return { success: false, error: "User ID is required" };

    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({ is_suspended: isSuspended })
      .eq("id", userId);

    if (error) throw error;

    return {
      success: true,
      message: isSuspended ? "User suspended" : "User unsuspended",
    };
  } catch (error) {
    console.error("Error updating suspension:", error);
    return { success: false, error: error.message };
  }
}
