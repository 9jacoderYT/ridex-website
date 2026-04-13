// Path: lib/server-actions/company/registerRider.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function registerRider(formData) {
  try {
    // Ensure the rider-documents bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "rider-documents");

    if (!bucketExists) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(
        "rider-documents",
        {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        }
      );

      if (bucketError && !bucketError.message.includes("already exists")) {
        console.error("Error creating bucket:", bucketError);
      }
    }

    // Extract form fields
    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim().toLowerCase();
    const phone = formData.get("phone")?.trim();
    const vehicle_type = formData.get("vehicle_type");
    const plate_number = formData.get("plate_number")?.trim().toUpperCase();
    const driver_license_number = formData.get("driver_license_number")?.trim();

    const guarantor_name = formData.get("guarantor_name")?.trim();
    const guarantor_phone = formData.get("guarantor_phone")?.trim();
    const company_id = formData.get("company_id");

    // Get file objects
    const vehicle_photo = formData.get("vehicle_photo");
    const rider_photo = formData.get("rider_photo");
    const plate_photo = formData.get("plate_photo");

    // Validation
    if (!name || !email || !phone) {
      return {
        success: false,
        error: "Please fill in all required fields (name, email, phone)",
      };
    }

    if (!vehicle_type || !["car", "bike"].includes(vehicle_type)) {
      return {
        success: false,
        error: "Please select a valid vehicle type (car or bike)",
      };
    }

    if (!plate_number) {
      return {
        success: false,
        error: "Plate number is required",
      };
    }

    if (!driver_license_number) {
      return {
        success: false,
        error: "Driver license number is required",
      };
    }

    if (!guarantor_name || !guarantor_phone) {
      return {
        success: false,
        error: "Guarantor information is required",
      };
    }

    if (!company_id) {
      return {
        success: false,
        error: "Company ID is required",
      };
    }

    if (driver_license_number.length < 6) {
      return {
        success: false,
        error: "Driver license number must be at least 6 characters long",
      };
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Please enter a valid email address",
      };
    }

    // Check required photos
    if (!vehicle_photo) {
      return {
        success: false,
        error: "Vehicle photo is required",
      };
    }

    if (!rider_photo) {
      return {
        success: false,
        error: "Rider photo is required",
      };
    }

    if (!plate_photo) {
      return {
        success: false,
        error: "Plate number photo is required",
      };
    }

    // Verify company exists and is approved
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, company_name, is_approved, is_active")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return {
        success: false,
        error: "Invalid company ID. Please check and try again.",
      };
    }

    if (!company.is_approved || !company.is_active) {
      return {
        success: false,
        error: "Your account must be approved by an admin before you can register riders.",
      };
    }

    // Check if email already exists in riders table
    const { data: existingRider } = await supabaseAdmin
      .from("riders")
      .select("id")
      .eq("email", email)
      .single();

    if (existingRider) {
      return {
        success: false,
        error: "This email is already registered as a rider.",
      };
    }

    // Generate a temporary ID for file uploads
    const tempId = `rider_temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let vehicle_photo_url = null;
    let rider_photo_url = null;
    let plate_photo_url = null;
    let uploadedFiles = [];

    // STEP 1: Upload vehicle photo
    try {
      const vehicleBytes = await vehicle_photo.arrayBuffer();
      const vehicleBuffer = Buffer.from(vehicleBytes);
      const vehicleExt = vehicle_photo.name.split(".").pop();
      const vehicleFileName = `${tempId}/vehicle.${vehicleExt}`;

      const { error: vehicleUploadError } = await supabaseAdmin.storage
        .from("rider-documents")
        .upload(vehicleFileName, vehicleBuffer, {
          contentType: vehicle_photo.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (vehicleUploadError) {
        console.error("Vehicle photo upload error:", vehicleUploadError);
        return {
          success: false,
          error: "Failed to upload vehicle photo. Please try again.",
        };
      }

      uploadedFiles.push(vehicleFileName);

      const { data: vehicleUrlData } = supabaseAdmin.storage
        .from("rider-documents")
        .getPublicUrl(vehicleFileName);

      vehicle_photo_url = vehicleUrlData.publicUrl;
    } catch (uploadError) {
      console.error("Vehicle photo upload exception:", uploadError);
      return {
        success: false,
        error: "An error occurred while uploading vehicle photo.",
      };
    }

    // STEP 2: Upload rider photo
    try {
      const riderBytes = await rider_photo.arrayBuffer();
      const riderBuffer = Buffer.from(riderBytes);
      const riderExt = rider_photo.name.split(".").pop();
      const riderFileName = `${tempId}/rider.${riderExt}`;

      const { error: riderUploadError } = await supabaseAdmin.storage
        .from("rider-documents")
        .upload(riderFileName, riderBuffer, {
          contentType: rider_photo.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (riderUploadError) {
        console.error("Rider photo upload error:", riderUploadError);
        // Cleanup previously uploaded files
        for (const fileName of uploadedFiles) {
          await supabaseAdmin.storage.from("rider-documents").remove([fileName]);
        }
        return {
          success: false,
          error: "Failed to upload rider photo. Please try again.",
        };
      }

      uploadedFiles.push(riderFileName);

      const { data: riderUrlData } = supabaseAdmin.storage
        .from("rider-documents")
        .getPublicUrl(riderFileName);

      rider_photo_url = riderUrlData.publicUrl;
    } catch (uploadError) {
      console.error("Rider photo upload exception:", uploadError);
      for (const fileName of uploadedFiles) {
        await supabaseAdmin.storage.from("rider-documents").remove([fileName]);
      }
      return {
        success: false,
        error: "An error occurred while uploading rider photo.",
      };
    }

    // STEP 3: Upload plate photo
    try {
      const plateBytes = await plate_photo.arrayBuffer();
      const plateBuffer = Buffer.from(plateBytes);
      const plateExt = plate_photo.name.split(".").pop();
      const plateFileName = `${tempId}/plate.${plateExt}`;

      const { error: plateUploadError } = await supabaseAdmin.storage
        .from("rider-documents")
        .upload(plateFileName, plateBuffer, {
          contentType: plate_photo.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (plateUploadError) {
        console.error("Plate photo upload error:", plateUploadError);
        for (const fileName of uploadedFiles) {
          await supabaseAdmin.storage.from("rider-documents").remove([fileName]);
        }
        return {
          success: false,
          error: "Failed to upload plate number photo. Please try again.",
        };
      }

      uploadedFiles.push(plateFileName);

      const { data: plateUrlData } = supabaseAdmin.storage
        .from("rider-documents")
        .getPublicUrl(plateFileName);

      plate_photo_url = plateUrlData.publicUrl;
    } catch (uploadError) {
      console.error("Plate photo upload exception:", uploadError);
      for (const fileName of uploadedFiles) {
        await supabaseAdmin.storage.from("rider-documents").remove([fileName]);
      }
      return {
        success: false,
        error: "An error occurred while uploading plate photo.",
      };
    }

    // STEP 4: Insert into riders table (no auth user created — rider sets up their own account)
    const { data: newRider, error: insertError } = await supabaseAdmin
      .from("riders")
      .insert({
        auth_user_id: null,
        company_id: company_id,
        name,
        email,
        phone,
        vehicle_type,
        plate_number,
        driver_license_number,
        guarantor_name,
        guarantor_phone,
        vehicle_photo_url,
        rider_photo_url,
        plate_photo_url,
        is_active: true, // Active by default since company is registering
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);

      // Cleanup uploaded files
      for (const fileName of uploadedFiles) {
        await supabaseAdmin.storage.from("rider-documents").remove([fileName]);
      }

      if (insertError.code === "23505") {
        return {
          success: false,
          error: "This rider is already registered.",
        };
      }

      return {
        success: false,
        error: "Failed to register rider. Please try again.",
      };
    }

    // STEP 6: Rename files to use actual rider ID
    const actualRiderId = newRider.id;
    let final_vehicle_photo_url = vehicle_photo_url;
    let final_rider_photo_url = rider_photo_url;
    let final_plate_photo_url = plate_photo_url;

    try {
      // Move vehicle photo
      const vehicleExt = vehicle_photo.name.split(".").pop();
      const newVehiclePath = `${actualRiderId}/vehicle.${vehicleExt}`;
      const oldVehiclePath = `${tempId}/vehicle.${vehicleExt}`;

      const { error: vehicleCopyError } = await supabaseAdmin.storage
        .from("rider-documents")
        .copy(oldVehiclePath, newVehiclePath);

      if (!vehicleCopyError) {
        await supabaseAdmin.storage.from("rider-documents").remove([oldVehiclePath]);
        const { data: newVehicleUrlData } = supabaseAdmin.storage
          .from("rider-documents")
          .getPublicUrl(newVehiclePath);
        final_vehicle_photo_url = newVehicleUrlData.publicUrl;
      }

      // Move rider photo
      const riderExt = rider_photo.name.split(".").pop();
      const newRiderPath = `${actualRiderId}/rider.${riderExt}`;
      const oldRiderPath = `${tempId}/rider.${riderExt}`;

      const { error: riderCopyError } = await supabaseAdmin.storage
        .from("rider-documents")
        .copy(oldRiderPath, newRiderPath);

      if (!riderCopyError) {
        await supabaseAdmin.storage.from("rider-documents").remove([oldRiderPath]);
        const { data: newRiderUrlData } = supabaseAdmin.storage
          .from("rider-documents")
          .getPublicUrl(newRiderPath);
        final_rider_photo_url = newRiderUrlData.publicUrl;
      }

      // Move plate photo
      const plateExt = plate_photo.name.split(".").pop();
      const newPlatePath = `${actualRiderId}/plate.${plateExt}`;
      const oldPlatePath = `${tempId}/plate.${plateExt}`;

      const { error: plateCopyError } = await supabaseAdmin.storage
        .from("rider-documents")
        .copy(oldPlatePath, newPlatePath);

      if (!plateCopyError) {
        await supabaseAdmin.storage.from("rider-documents").remove([oldPlatePath]);
        const { data: newPlateUrlData } = supabaseAdmin.storage
          .from("rider-documents")
          .getPublicUrl(newPlatePath);
        final_plate_photo_url = newPlateUrlData.publicUrl;
      }

      // Update database with final URLs
      await supabaseAdmin
        .from("riders")
        .update({
          vehicle_photo_url: final_vehicle_photo_url,
          rider_photo_url: final_rider_photo_url,
          plate_photo_url: final_plate_photo_url,
        })
        .eq("id", actualRiderId);
    } catch (renameError) {
      console.error("File rename error:", renameError);
      // Don't fail registration, files are uploaded with temp ID
    }

    return {
      success: true,
      rider: {
        ...newRider,
        vehicle_photo_url: final_vehicle_photo_url,
        rider_photo_url: final_rider_photo_url,
        plate_photo_url: final_plate_photo_url,
      },
      message: "Rider registered successfully!",
    };
  } catch (error) {
    console.error("Error registering rider:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
}
