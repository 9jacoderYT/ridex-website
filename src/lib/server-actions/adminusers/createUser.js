"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";

export async function createUser(formData) {
  try {
    const username = formData.get("username")?.trim();
    const email = formData.get("email")?.trim().toLowerCase();
    const full_name = formData.get("full_name")?.trim();
    const password = formData.get("password");
    const role_name = formData.get("role_name");
    const is_active = formData.get("is_active") === "true";
    const created_by = formData.get("created_by");

    // Validation
    if (!username || !email || !password || !role_name) {
      return { success: false, error: "Missing required fields" };
    }

    if (username.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters",
      };
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Get role description
    const { data: roleData } = await supabaseAdmin
      .from("admin_roles")
      .select("role_description")
      .eq("role_name", role_name)
      .single();

    // Insert new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        username,
        email,
        full_name,
        password_hash,
        role_name,
        role_description: roleData?.role_description,
        is_active,
        created_by,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Remove password hash from response
    const { password_hash: _, ...sanitizedUser } = newUser;

    return {
      success: true,
      user: sanitizedUser,
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}
