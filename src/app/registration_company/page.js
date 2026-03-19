// Path: app/registration_company/page.js

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerCompany } from "@/lib/server-actions/company/registerCompany";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function CompanyRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ID Card
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState("");
  const [idCardBase64, setIdCardBase64] = useState("");

  // Logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoBase64, setLogoBase64] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    company_address: "",
    business_registration_number: "",
    nin_number: "",
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

  const handleIdCardChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG) or PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setIdCardFile(file);
      setIdCardBase64(base64);
      setError("");

      if (file.type.startsWith("image/")) {
        setIdCardPreview(base64);
      } else {
        setIdCardPreview("");
      }
    } catch (err) {
      setError("Failed to process file");
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Logo must be an image (JPG or PNG)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo file size must be less than 2MB");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setLogoFile(file);
      setLogoBase64(base64);
      setLogoPreview(base64);
      setError("");
    } catch (err) {
      setError("Failed to process logo");
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.company_name.trim()) {
          setError("Company name is required");
          return false;
        }
        if (!formData.email.trim()) {
          setError("Email is required");
          return false;
        }
        if (
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
            formData.email,
          )
        ) {
          setError("Invalid email format");
          return false;
        }
        if (!formData.phone.trim()) {
          setError("Phone number is required");
          return false;
        }
        if (!formData.password) {
          setError("Password is required");
          return false;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return false;
        }
        if (formData.password !== formData.confirm_password) {
          setError("Passwords do not match");
          return false;
        }
        return true;

      case 2:
        if (!formData.company_address.trim()) {
          setError("Company address is required");
          return false;
        }
        return true;

      case 3:
        if (!formData.nin_number.trim()) {
          setError("NIN number is required");
          return false;
        }
        if (!idCardBase64) {
          setError("ID card upload is required");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
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
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setError("");

    try {
      const submitData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (key !== "confirm_password") {
          submitData.append(key, formData[key]);
        }
      });

      // Add ID card file object (not base64)
      submitData.append("id_card", idCardFile);

      // Add logo file object if present (not base64)
      if (logoFile) {
        submitData.append("logo", logoFile);
      }

      const result = await registerCompany(submitData);

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      // Success!
      setCurrentStep(4);

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push("/company/login");
      }, 3000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                placeholder="company@example.com"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
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
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
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
              Company Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="company_address"
                value={formData.company_address}
                onChange={handleChange}
                placeholder="Enter full company address"
                rows={3}
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Registration Number{" "}
                <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                name="business_registration_number"
                value={formData.business_registration_number}
                onChange={handleChange}
                placeholder="RC1234567"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your CAC registration number (if available)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo{" "}
                <span className="text-gray-500">
                  (Optional but recommended)
                </span>
              </label>

              <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center bg-green-50">
                {logoPreview ? (
                  <div className="space-y-3">
                    <div className="relative w-24 h-24 mx-auto rounded-lg overflow-hidden border-2 border-green-500">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-green-700 font-medium">
                      ✓ Logo selected
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview("");
                        setLogoBase64("");
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove logo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <svg
                      className="w-12 h-12 mx-auto text-green-600 mb-2"
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
                    <p className="text-sm text-gray-700 mb-1 font-medium">
                      Upload your company logo
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      Square image recommended (JPG or PNG, max 2MB)
                    </p>
                    <p className="text-xs text-green-600">
                      Helps customers recognize your brand
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
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
              KYC Verification
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nin_number"
                value={formData.nin_number}
                onChange={handleChange}
                placeholder="Enter NIN number"
                className="w-full px-4 py-2.5 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Card <span className="text-red-500">*</span>
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                {idCardPreview ? (
                  <div className="space-y-3">
                    <img
                      src={idCardPreview}
                      alt="ID Card Preview"
                      className="mx-auto max-h-40 rounded-lg"
                    />
                    <p className="text-sm text-green-600 font-medium">
                      ✓ File selected: {idCardFile?.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIdCardFile(null);
                        setIdCardPreview("");
                        setIdCardBase64("");
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : idCardFile ? (
                  <div className="space-y-3">
                    <svg
                      className="w-12 h-12 mx-auto text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm text-green-600 font-medium">
                      ✓ File selected: {idCardFile?.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIdCardFile(null);
                        setIdCardPreview("");
                        setIdCardBase64("");
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG or PDF (max 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleIdCardChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> Your account will be reviewed by our
                admin team before activation. You'll receive an email once
                approved.
              </p>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
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
              Registration Successful!
            </h2>
            <p className="text-gray-600 mb-2">
              Your account has been created and is{" "}
              <span className="font-semibold text-amber-600">pending approval</span>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-800">Waiting for Admin Approval</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Our team will review your documents within 24-48 hours. You'll receive an email once approved. You can log in to check your approval status anytime.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to login in 3 seconds...
            </p>
            <button
              onClick={() => router.push("/company/login")}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login Now
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative w-16 h-16">
              <Image
                src="/assets/1.png"
                alt="RIDEX Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            RIDEX Company Registration
          </h1>
          <p className="text-gray-600 mt-2">Join our logistics network</p>
        </div>

        {currentStep < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        currentStep >= step
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        currentStep > step ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span className="text-center flex-1">Basic Info</span>
              <span className="text-center flex-1">Company Details</span>
              <span className="text-center flex-1">KYC</span>
            </div>
          </div>
        )}

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

          {currentStep < 4 && (
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
              {currentStep < 3 ? (
                <button
                  onClick={nextStep}
                  className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/company/login")}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
