// Path: src/components/admin/PendingCompanies.js

"use client";

import { useState, useEffect } from "react";
import {
  fetchCompanies as fetchCompaniesAction,
  approveCompany,
  deleteCompany,
} from "@/lib/server-actions/admin/manageCompanies";

export default function PendingCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("pending"); // 'pending' or 'inactive'

  useEffect(() => {
    loadCompanies();
  }, [filter]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const result = await fetchCompaniesAction(filter); // Pass "pending" or "inactive"

      if (result.success) {
        setCompanies(result.companies || []);
      } else {
        console.error("Error fetching companies:", result.error);
        alert(result.error || "Failed to load companies");
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      alert("An error occurred while loading companies");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleApprove = async (companyId) => {
    if (!confirm("Are you sure you want to approve this company?")) return;

    setActionLoading(true);
    try {
      const result = await approveCompany(companyId);

      if (result.success) {
        alert(result.message || "Company approved successfully!");
        setShowModal(false);
        loadCompanies();
      } else {
        alert(result.error || "Failed to approve company");
      }
    } catch (error) {
      console.error("Error approving company:", error);
      alert("An error occurred while approving the company");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (companyId) => {
    if (
      !confirm(
        "Are you sure you want to delete this company? This action cannot be undone.",
      )
    )
      return;

    setActionLoading(true);
    try {
      const result = await deleteCompany(companyId);

      if (result.success) {
        alert(result.message || "Company deleted successfully!");
        setShowModal(false);
        loadCompanies();
      } else {
        alert(result.error || "Failed to delete company");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("An error occurred while deleting the company");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and manage company registrations
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 inline-flex mb-6">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending Approval
          {filter === "pending" && companies.length > 0 && (
            <span className="ml-2 bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {companies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("inactive")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "inactive"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Inactive Companies
        </button>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading companies...</p>
          </div>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {filter === "pending" ? "pending" : "inactive"} companies
            </h3>
            <p className="text-gray-600">
              {filter === "pending"
                ? "All company registrations have been reviewed"
                : "No inactive companies at the moment"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-gray-100">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleViewCompany(company)}
                className="w-full text-left p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.company_name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{company.company_name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{company.company_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        !company.is_approved ? "bg-amber-100 text-amber-700" : company.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {!company.is_approved ? "Pending" : company.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{company.email} · {company.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(company.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registration</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Registered</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.company_name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{company.company_name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{company.company_name}</p>
                          <p className="text-xs text-gray-500">ID: {company.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{company.email}</p>
                      <p className="text-xs text-gray-500">{company.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-[160px] truncate" title={company.company_address || "N/A"}>{company.company_address || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4">
                      {company.business_registration_number && <p className="text-sm text-gray-900">{company.business_registration_number}</p>}
                      {company.nin_number && <p className="text-xs text-gray-500">NIN: {company.nin_number}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${company.logo_url ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {company.logo_url ? "Yes" : "No"}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${company.id_card_url ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
                          {company.id_card_url ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{formatDate(company.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        !company.is_approved ? "bg-amber-100 text-amber-700" : company.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {!company.is_approved ? "Pending Approval" : company.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleViewCompany(company)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Company Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Company Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Company Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedCompany.company_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedCompany.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedCompany.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Address
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedCompany.company_address || "N/A"}
                    </p>
                  </div>
                  {selectedCompany.business_registration_number && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Business Registration Number
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedCompany.business_registration_number}
                      </p>
                    </div>
                  )}
                  {selectedCompany.nin_number && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        NIN Number
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedCompany.nin_number}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Registration Date
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedCompany.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Status
                    </label>
                    <p className="text-sm mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedCompany.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selectedCompany.is_active ? "Active" : "Pending"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Documents
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedCompany.id_card_url && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">
                        ID Card
                      </label>
                      <a
                        href={selectedCompany.id_card_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg
                              className="w-5 h-5 text-blue-600"
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
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                              View ID Card
                            </p>
                            <p className="text-xs text-gray-500">
                              Click to open
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                      </a>
                    </div>
                  )}
                  {selectedCompany.logo_url && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-2 block">
                        Company Logo
                      </label>
                      <div className="border border-gray-200 rounded-lg p-3">
                        <img
                          src={selectedCompany.logo_url}
                          alt="Company Logo"
                          className="w-full h-24 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedCompany.id)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </>
                )}
              </button>
              {!selectedCompany.is_active && (
                <button
                  onClick={() => handleApprove(selectedCompany.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
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
                      Approve Company
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
