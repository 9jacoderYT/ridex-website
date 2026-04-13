"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function createUser(formData) {
  try {
    const email = formData.get("email")?.trim().toLowerCase();
    const full_name = formData.get("full_name")?.trim();
    const role_name = formData.get("role_name");
    const createdByRaw = formData.get("created_by");
    // Only use as created_by if it's a real UUID (env var super admin has a non-UUID id)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const created_by = UUID_REGEX.test(createdByRaw) ? createdByRaw : null;

    // Validation
    if (!email || !role_name) {
      return { success: false, error: "Email and role are required" };
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from("admin_users")
      .select("id, is_suspended, password_set")
      .eq("email", email)
      .single();

    if (existingEmail) {
      if (existingEmail.password_set) {
        return { success: false, error: "An account with this email already exists" };
      }
      // Re-invite: update token instead of blocking
    }

    // Generate invite token (48-hour expiry)
    const invite_token = crypto.randomBytes(32).toString("hex");
    const invite_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Auto-generate username from email
    const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    let username = baseUsername;
    let suffix = 1;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("admin_users")
        .select("id")
        .eq("username", username)
        .neq("email", email) // allow same user to be re-invited
        .single();
      if (!existing) break;
      username = `${baseUsername}${suffix++}`;
    }

    // Get role description
    const { data: roleData } = await supabaseAdmin
      .from("admin_roles")
      .select("role_description")
      .eq("role_name", role_name)
      .single();

    let newUser;
    if (existingEmail && !existingEmail.password_set) {
      // Re-invite: just update token
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .update({ invite_token, invite_expires_at, role_name, role_description: roleData?.role_description, full_name })
        .eq("email", email)
        .select()
        .single();
      if (error) throw error;
      newUser = data;
    } else {
      // New invite
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .insert({
          username,
          email,
          full_name,
          role_name,
          role_description: roleData?.role_description,
          invite_token,
          invite_expires_at,
          password_set: false,
          is_active: false,
          is_suspended: false,
          created_by,
        })
        .select()
        .single();
      if (error) throw error;
      newUser = data;
    }

    // Send invite email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const setupUrl = `${appUrl}/admin-setup?token=${invite_token}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "You've been invited to RIDEX Admin Panel",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #111;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 700; color: #2563eb;">RIDEX</span>
            <span style="font-size: 14px; color: #6b7280; margin-left: 8px;">Admin Panel</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">You've been invited!</h2>
          <p style="color: #4b5563; margin-bottom: 4px;">
            ${full_name ? `Hi ${full_name},` : "Hi,"} you've been added to the RIDEX Admin Panel as <strong>${role_name}</strong>.
          </p>
          <p style="color: #4b5563; margin-bottom: 24px;">
            Click the button below to set up your password and access the dashboard. This link expires in <strong>48 hours</strong>.
          </p>
          <a href="${setupUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Set Up My Account
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
            If you didn't expect this email, you can safely ignore it.
          </p>
          <p style="color: #d1d5db; font-size: 12px; margin-top: 8px;">
            Link: ${setupUrl}
          </p>
        </div>
      `,
    });

    const { password_hash, invite_token: _, ...sanitizedUser } = newUser;
    return {
      success: true,
      user: sanitizedUser,
      message: `Invite sent to ${email}`,
    };
  } catch (error) {
    console.error("Error creating user invite:", error);
    return { success: false, error: error.message };
  }
}
