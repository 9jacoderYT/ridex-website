"use server";

import { supabaseAdmin } from "../supabase-server";
import { getSession } from "../utils/session";
import bcrypt from "bcryptjs";

export async function registerAdmin(formData) {
  try {
    // Check if requesting user is authenticated and has permission
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: "Unauthorized. Please login first.",
      };
    }

    // Only Super Admin can create new admin users
    if (session.role !== "Super Admin") {
      return {
        success: false,
        error: "Only Super Admin can create new admin users.",
      };
    }

    // Extract form data
    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();
    const email = formData.get("email")?.toString().trim();
    const fullName = formData.get("fullName")?.toString().trim();
    const roleName = formData.get("roleName")?.toString();
    const roleDescription = formData.get("roleDescription")?.toString();

    // Validation
    if (!username || !password || !email || !roleName) {
      return {
        success: false,
        error: "Username, password, email, and role are required",
      };
    }

    // Validate role exists
    const { data: role, error: roleError } = await supabaseAdmin
      .from("admin_roles")
      .select("*")
      .eq("role_name", roleName)
      .single();

    if (roleError || !role) {
      return {
        success: false,
        error: "Invalid role selected",
      };
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: "Username already exists",
      };
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return {
        success: false,
        error: "Email already exists",
      };
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new admin user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        username,
        password_hash: passwordHash,
        email,
        full_name: fullName,
        role_name: roleName,
        role_description: roleDescription || role.role_description,
        is_active: true,
        created_by: session.id,
      })
      .select()
      .single();

    if (createError) {
      console.error("Create user error:", createError);
      return {
        success: false,
        error: "Failed to create admin user",
      };
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role_name,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An error occurred during registration. Please try again.",
    };
  }
}
