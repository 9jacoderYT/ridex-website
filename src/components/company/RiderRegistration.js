// Path: src/components/company/RiderRegistration.js

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "@/components/company/CompanyContext";
import { registerRider } from "@/lib/server-actions/company/registerRider";
import { motion, AnimatePresence } from "framer-motion";

export default function RiderRegistration() {
  const router = useRouter();
  const { company } = useCompany();

  if (!company?.is_approved || !company?.is_active) {
    return (
      <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-semibold text-amber-800">Account Pending Approval</p>
          <p className="text-sm text-amber-700 mt-1">
            Your account is currently under review by our admin team. Once approved, you'll be able to register riders. This usually takes 24–48 hours.
          </p>
        </div>
      </div>
    );
  }
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // File states
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState("");

  const [riderPhotoFile, setRiderPhotoFile] = useState(null);
  const [riderPhotoPreview, setRiderPhotoPreview] = useState("");

  const [platePhotoFile, setPlatePhotoFile] = useState(null);
  const [platePhotoPreview, setPlatePhotoPreview] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle_type: "",
    plate_number: "",
    driver_license_number: "",
    guarantor_name: "",
    guarantor_phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPG or PNG)");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      setError("Image size must be less than 1MB. Please compress or resize the image before uploading.");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setError("");

      switch (type) {
        case "vehicle":
          setVehiclePhotoFile(file);
          setVehiclePhotoPreview(base64);
          break;
        case "rider":
          setRiderPhotoFile(file);
          setRiderPhotoPreview(base64);
          break;
        case "plate":
          setPlatePhotoFile(file);
          setPlatePhotoPreview(base64);
          break;
      }
    } catch (err) {
      setError("Failed to process file");
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError("Rider name is required");
          return false;
        }
        if (!formData.email.trim()) {
          setError("Email is required");
          return false;
        }
        if (
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
            formData.email
          )
        ) {
          setError("Invalid email format");
          return false;
        }
        if (!formData.phone.trim()) {
          setError("Phone number is required");
          return false;
        }
        return true;

      case 2:
        if (!formData.vehicle_type) {
          setError("Please select a vehicle type");
          return false;
        }
        if (!formData.plate_number.trim()) {
          setError("Plate number is required");
          return false;
        }
        if (!formData.driver_license_number.trim()) {
          setError("Driver license number is required");
          return false;
        }
        return true;

      case 3:
        if (!formData.guarantor_name.trim()) {
          setError("Guarantor name is required");
          return false;
        }
        if (!formData.guarantor_phone.trim()) {
          setError("Guarantor phone number is required");
          return false;
        }
        return true;

      case 4:
        if (!vehiclePhotoFile) {
          setError("Vehicle photo is required");
          return false;
        }
        if (!riderPhotoFile) {
          setError("Rider photo is required");
          return false;
        }
        if (!platePhotoFile) {
          setError("Plate number photo is required");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        setError("");
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setError("");

    try {
      const submitData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      // Add company_id
      submitData.append("company_id", company.id);

      // Add files
      submitData.append("vehicle_photo", vehiclePhotoFile);
      submitData.append("rider_photo", riderPhotoFile);
      submitData.append("plate_photo", platePhotoFile);

      const result = await registerRider(submitData);

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      // Success!
      setCurrentStep(5);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileUpload = (type, file, preview, label, description) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
      {preview ? (
        <div className="space-y-3">
          <img
            src={preview}
            alt={`${label} Preview`}
            className="mx-auto max-h-32 rounded-lg object-cover"
          />
          <p className="text-sm text-green-600 font-medium">
            {file?.name}
          </p>
          <button
            type="button"
            onClick={() => {
              switch (type) {
                case "vehicle":
                  setVehiclePhotoFile(null);
                  setVehiclePhotoPreview("");
                  break;
                case "rider":
                  setRiderPhotoFile(null);
                  setRiderPhotoPreview("");
                  break;
                case "plate":
                  setPlatePhotoFile(null);
                  setPlatePhotoPreview("");
                  break;
              }
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Remove photo
          </button>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => handleFileChange(e, type)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Rider Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter rider's full name"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="rider@example.com"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Rider will use this email to login to the mobile app
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-blue-800">
                  The rider will set up their own password when they activate their account in the RideX Rider app.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vehicle Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, vehicle_type: "bike" }))
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.vehicle_type === "bike"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <svg
                    className={`w-12 h-12 mx-auto mb-2 ${
                      formData.vehicle_type === "bike"
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                  <p
                    className={`font-medium ${
                      formData.vehicle_type === "bike"
                        ? "text-emerald-700"
                        : "text-gray-700"
                    }`}
                  >
                    Motorcycle/Bike
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, vehicle_type: "car" }))
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.vehicle_type === "car"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <svg
                    className={`w-12 h-12 mx-auto mb-2 ${
                      formData.vehicle_type === "car"
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                  <p
                    className={`font-medium ${
                      formData.vehicle_type === "car"
                        ? "text-emerald-700"
                        : "text-gray-700"
                    }`}
                  >
                    Car
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plate Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plate_number"
                value={formData.plate_number}
                onChange={handleChange}
                placeholder="e.g., ABC 123 XY"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="driver_license_number"
                value={formData.driver_license_number}
                onChange={handleChange}
                placeholder="Enter driver license number"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Guarantor Information
            </h2>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-amber-800">
                  A guarantor is required for rider registration. This person
                  vouches for the rider's character and reliability.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guarantor Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="guarantor_name"
                value={formData.guarantor_name}
                onChange={handleChange}
                placeholder="Enter guarantor's full name"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guarantor Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="guarantor_phone"
                value={formData.guarantor_phone}
                onChange={handleChange}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Photos
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rider Photo <span className="text-red-500">*</span>
              </label>
              {renderFileUpload(
                "rider",
                riderPhotoFile,
                riderPhotoPreview,
                "Upload Rider Photo",
                "Clear photo of the rider's face (JPG/PNG, max 1MB)"
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Photo <span className="text-red-500">*</span>
              </label>
              {renderFileUpload(
                "vehicle",
                vehiclePhotoFile,
                vehiclePhotoPreview,
                "Upload Vehicle Photo",
                "Full view of the vehicle (JPG/PNG, max 1MB)"
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plate Number Photo <span className="text-red-500">*</span>
              </label>
              {renderFileUpload(
                "plate",
                platePhotoFile,
                platePhotoPreview,
                "Upload Plate Number Photo",
                "Clear photo of the plate number (JPG/PNG, max 1MB)"
              )}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Rider Registered Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              {formData.name} has been registered as a rider.
              <br />
              They can now set up their own account in the RideX Rider app.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-emerald-900 mb-3">
                Next Step for the Rider:
              </h3>
              <div className="space-y-2 text-sm text-emerald-800">
                <p>
                  Share their registered email with them:
                </p>
                <p className="font-mono bg-white border border-emerald-200 rounded px-3 py-2">
                  {formData.email}
                </p>
              </div>
              <p className="text-xs text-emerald-600 mt-3">
                The rider opens the RideX Rider app, taps <strong>"Set up your account"</strong>, enters this email, creates their own password, and verifies their email with a code.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    vehicle_type: "",
                    plate_number: "",
                    driver_license_number: "",
                    guarantor_name: "",
                    guarantor_phone: "",
                  });
                  setVehiclePhotoFile(null);
                  setVehiclePhotoPreview("");
                  setRiderPhotoFile(null);
                  setRiderPhotoPreview("");
                  setPlatePhotoFile(null);
                  setPlatePhotoPreview("");
                }}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Register Another Rider
              </button>
              <button
                onClick={() => router.push("/company/dashboard")}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/company/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Register New Rider
                </h1>
                <p className="text-xs text-gray-500">
                  {company?.company_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        currentStep >= step
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {currentStep > step ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        step
                      )}
                    </div>
                  </div>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        currentStep > step ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span className="text-center flex-1">Basic Info</span>
              <span className="text-center flex-1">Vehicle</span>
              <span className="text-center flex-1">Guarantor</span>
              <span className="text-center flex-1">Photos</span>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex-1 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering Rider...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
