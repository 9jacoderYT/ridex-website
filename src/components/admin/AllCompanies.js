// Path: src/components/admin/AllCompanies.js

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  fetchCompanies as fetchCompaniesAction,
  deactivateCompany,
  deleteCompany,
} from "@/lib/server-actions/admin/manageCompanies";
import {
  getTrustScore,
  setTrustScore,
  recomputeTrustScore,
} from "@/lib/server-actions/admin/manageTrustScore";

export default function AllCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'inactive'

  // Trust score state
  const [trustData, setTrustData]             = useState(null);
  const [trustLoading, setTrustLoading]       = useState(false);
  const [trustEditing, setTrustEditing]       = useState(false);
  const [editScore, setEditScore]             = useState("");
  const [editReason, setEditReason]           = useState("");
  const [trustSaving, setTrustSaving]         = useState(false);
  const [trustRecomputing, setTrustRecomputing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadCompanies();
  }, [filter]);

  // Auto-open company modal when navigated from another page with ?open=companyId
  useEffect(() => {
    const openId = searchParams?.get("open");
    if (!openId || companies.length === 0) return;
    const match = companies.find((c) => c.id === openId);
    if (match) {
      setSelectedCompany(match);
      setShowModal(true);
    }
  }, [searchParams, companies]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      // Fetch all approved companies (active or inactive)
      const result = await fetchCompaniesAction("approved");

      if (result.success) {
        let filteredCompanies = result.companies || [];

        // Apply additional filtering
        if (filter === "active") {
          filteredCompanies = filteredCompanies.filter((c) => c.is_active);
        } else if (filter === "inactive") {
          filteredCompanies = filteredCompanies.filter((c) => !c.is_active);
        }

        setCompanies(filteredCompanies);
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

  const handleViewCompany = async (company) => {
    setSelectedCompany(company);
    setShowModal(true);
    setTrustData(null); setTrustEditing(false); setEditScore(""); setEditReason("");
    setTrustLoading(true);
    const res = await getTrustScore("company", company.id);
    if (res.success) setTrustData(res);
    setTrustLoading(false);
  };

  const handleTrustSave = async () => {
    const val = parseInt(editScore, 10);
    if (isNaN(val) || val < 0 || val > 100) { alert("Score must be 0–100"); return; }
    setTrustSaving(true);
    const res = await setTrustScore("company", selectedCompany.id, val, editReason);
    if (res.success) {
      setTrustEditing(false); setEditScore(""); setEditReason("");
      const fresh = await getTrustScore("company", selectedCompany.id);
      if (fresh.success) setTrustData(fresh);
    } else {
      alert(res.error || "Failed to update score");
    }
    setTrustSaving(false);
  };

  const handleTrustRecompute = async () => {
    if (!confirm("Recompute score from active riders' trust scores?")) return;
    setTrustRecomputing(true);
    const res = await recomputeTrustScore("company", selectedCompany.id);
    if (res.success) {
      const fresh = await getTrustScore("company", selectedCompany.id);
      if (fresh.success) setTrustData(fresh);
    } else {
      alert(res.error || "Failed to recompute");
    }
    setTrustRecomputing(false);
  };

  const handleDeactivate = async (companyId) => {
    if (!confirm("Are you sure you want to deactivate this company?")) return;

    setActionLoading(true);
    try {
      const result = await deactivateCompany(companyId);

      if (result.success) {
        alert(result.message || "Company deactivated successfully!");
        setShowModal(false);
        loadCompanies();
      } else {
        alert(result.error || "Failed to deactivate company");
      }
    } catch (error) {
      console.error("Error deactivating company:", error);
      alert("An error occurred while deactivating the company");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (companyId) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this company? This action cannot be undone.",
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter companies by search query
  const filteredCompanies = companies.filter((company) => {
    const query = searchQuery.toLowerCase();
    return (
      company.company_name?.toLowerCase().includes(query) ||
      company.email?.toLowerCase().includes(query) ||
      company.company_id?.toLowerCase().includes(query) ||
      company.phone?.includes(query)
    );
  });

  const stats = [
    {
      label: "Total Companies",
      value: companies.length,
      color: "blue",
    },
    {
      label: "Active",
      value: companies.filter((c) => c.is_active).length,
      color: "green",
    },
    {
      label: "Inactive",
      value: companies.filter((c) => !c.is_active).length,
      color: "red",
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Companies</h1>
        <p className="text-sm text-gray-600 mt-1">
          View and manage all registered companies
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-sm font-medium text-gray-600 mb-1">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold text-${stat.color}-600`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, email, ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-gray-100 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("inactive")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "inactive"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading companies...</p>
          </div>
        </div>
      ) : filteredCompanies.length === 0 ? (
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
              No companies found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "No companies match the selected filter"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* ── Mobile card list ── */}
          <div className="sm:hidden divide-y divide-gray-100">
            {filteredCompanies.map((company) => (
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${company.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {company.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{company.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {company.company_id && (
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{company.company_id}</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(company.approved_at)}</span>
                    </div>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reg. No.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Approved</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
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
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-semibold">
                        {company.company_id || "Not Assigned"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-[180px] truncate" title={company.company_address || "N/A"}>{company.company_address || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{company.business_registration_number || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{formatDate(company.approved_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${company.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {company.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleViewCompany(company)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        View Details
                      </button>
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
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Company Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCompany.company_id || "ID Not Assigned"}
                </p>
              </div>
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
                      Approved Date
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedCompany.approved_at)}
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
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedCompany.is_active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {(selectedCompany.id_card_url || selectedCompany.logo_url) && (
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
              )}
            </div>

            {/* TrustScore Section (Admin Only) */}
            <div className="px-6 pb-4">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                <p className="text-xs font-semibold uppercase text-gray-400 tracking-wide">TrustScore (Admin Only)</p>
                {trustLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400">Loading…</span>
                  </div>
                ) : trustData ? (
                  <CompanyTrustCard
                    score={trustData.scores.company}
                    log={trustData.log}
                    editing={trustEditing}
                    editScore={editScore}
                    editReason={editReason}
                    saving={trustSaving}
                    recomputing={trustRecomputing}
                    onEditOpen={() => { setEditScore(String(trustData.scores.company)); setEditReason(""); setTrustEditing(true); }}
                    onEditClose={() => setTrustEditing(false)}
                    onScoreChange={setEditScore}
                    onReasonChange={setEditReason}
                    onSave={handleTrustSave}
                    onRecompute={handleTrustRecompute}
                  />
                ) : null}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Close
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
                    Delete Company
                  </>
                )}
              </button>
              {selectedCompany.is_active ? (
                <button
                  onClick={() => handleDeactivate(selectedCompany.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                      Deactivate
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() =>
                    router.push(`/admindashboard/pending-companies`)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                >
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
                  Activate Company
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CompanyTrustCard ─────────────────────────────────────────────────────────

const TRUST_BAND_CO = [
  { min: 85, label: "Low Risk",    bg: "bg-green-100",  text: "text-green-800",  bar: "bg-green-500"  },
  { min: 70, label: "Normal",      bg: "bg-blue-100",   text: "text-blue-800",   bar: "bg-blue-500"   },
  { min: 50, label: "Medium Risk", bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-yellow-500" },
  { min: 30, label: "High Risk",   bg: "bg-orange-100", text: "text-orange-800", bar: "bg-orange-500" },
  { min: 0,  label: "Critical",    bg: "bg-red-100",    text: "text-red-800",    bar: "bg-red-500"    },
];

function coTrustBand(score) {
  const n = Number(score ?? 60);
  return TRUST_BAND_CO.find((b) => n >= b.min) ?? TRUST_BAND_CO[4];
}

function fmtTsCo(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CompanyTrustCard({
  score, log, editing, editScore, editReason, saving, recomputing,
  onEditOpen, onEditClose, onScoreChange, onReasonChange, onSave, onRecompute,
}) {
  const n = Number(score ?? 60);
  const band = coTrustBand(n);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-gray-900">{n}</div>
        <div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${band.bg} ${band.text}`}>
            {band.label}
          </span>
          <p className="text-xs text-gray-400 mt-1">Resets if no active riders for 30 days</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${n}%` }} />
      </div>

      {editing ? (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">New Score (0–100)</label>
            <input type="number" min={0} max={100} value={editScore} onChange={(e) => onScoreChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Reason (optional)</label>
            <input type="text" value={editReason} onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Reason for change"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900" />
          </div>
          <div className="flex gap-2">
            <button onClick={onSave} disabled={saving}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={onEditClose} className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={onEditOpen} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Score
          </button>
          <button onClick={onRecompute} disabled={recomputing}
            className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
            {recomputing ? "Recomputing…" : "Recompute"}
          </button>
        </div>
      )}

      {log.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">Recent changes</p>
          {log.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{entry.old_score ?? "—"} → {entry.new_score}</span>
              {entry.reason && <span>· {entry.reason}</span>}
              <span className="ml-auto whitespace-nowrap shrink-0">{fmtTsCo(entry.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
