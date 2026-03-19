"use server";

import { supabaseAdmin } from "../supabase-server";
import bcrypt from "bcryptjs";

export async function resetAdminPassword() {
  try {
    console.log("🔄 Resetting admin password...");

    // Generate a fresh password hash for "admin"
    const password = "admin";
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(password, saltRounds);

    console.log('Generated new hash for password "admin"');
    console.log("Hash length:", newPasswordHash.length);
    console.log("Hash starts with:", newPasswordHash.substring(0, 7)); // Should start with $2a$10$

    // Update the admin user with the new hash
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({ password_hash: newPasswordHash })
      .eq("username", "admin")
      .select()
      .single();

    if (updateError) {
      console.error("❌ Failed to update password:", updateError);
      return {
        success: false,
        error: "Failed to update password",
        details: updateError,
      };
    }

    console.log("✅ Password updated successfully");

    // Verify the password works
    const testPassword = "admin";
    const isValid = await bcrypt.compare(testPassword, newPasswordHash);

    console.log(
      "🧪 Password verification test:",
      isValid ? "PASSED ✅" : "FAILED ❌",
    );

    return {
      success: true,
      message: 'Admin password has been reset to "admin"',
      verification: isValid
        ? "Password verified successfully"
        : "Warning: Password verification failed",
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        updated_at: updatedUser.updated_at,
      },
    };
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return {
      success: false,
      error: "Unexpected error occurred",
      details: error.message,
    };
  }
}

export async function verifyPassword(testPassword = "admin") {
  try {
    console.log("🔐 Verifying password...");

    // Get current admin user
    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("password_hash")
      .eq("username", "admin")
      .single();

    if (error || !adminUser) {
      return {
        success: false,
        error: "Admin user not found",
      };
    }

    // Test the password
    const isValid = await bcrypt.compare(testPassword, adminUser.password_hash);

    console.log("Password test result:", isValid ? "VALID ✅" : "INVALID ❌");
    console.log(
      "Hash in database starts with:",
      adminUser.password_hash.substring(0, 7),
    );

    return {
      success: true,
      passwordValid: isValid,
      message: isValid
        ? `Password "${testPassword}" is correct! ✅`
        : `Password "${testPassword}" is incorrect ❌`,
      hashInfo: {
        length: adminUser.password_hash.length,
        algorithm: adminUser.password_hash.substring(0, 4),
        expectedAlgorithm: "$2a$", // bcrypt identifier
      },
    };
  } catch (error) {
    console.error("❌ Verification error:", error);
    return {
      success: false,
      error: "Verification failed",
      details: error.message,
    };
  }
}
