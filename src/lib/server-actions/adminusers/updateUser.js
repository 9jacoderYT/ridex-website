"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";

export async function updateUser(userId, updates) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const { password, role_name, ...otherUpdates } = updates;

    // Prepare update object
    const updateData = { ...otherUpdates };

    // Hash new password if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters",
        };
      }
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Update role and get role description if role is being changed
    if (role_name) {
      const { data: roleData } = await supabaseAdmin
        .from("admin_roles")
        .select("role_description")
        .eq("role_name", role_name)
        .single();

      updateData.role_name = role_name;
      updateData.role_description = roleData?.role_description;
    }

    // Update user
    const { data: updatedUser, error } = await supabaseAdmin
      .from("admin_users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Remove password hash from response
    const { password_hash, ...sanitizedUser } = updatedUser;

    return {
      success: true,
      user: sanitizedUser,
      message: "User updated successfully",
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
}
