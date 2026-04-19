"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import { getUsers } from "@/lib/server-actions/adminusers/getUsers";
import { deleteUser } from "@/lib/server-actions/adminusers/deleteUser";
import { updateUser } from "@/lib/server-actions/adminusers/updateUser";
import { setSuspendedStatus } from "@/lib/server-actions/adminusers/verifyInviteToken";

const ROLES = [
  "Super Admin",
  "Customer Care",
  "HR Officer",
  "Finance Officer",
  "Operations Officer",
];

const ROLE_COLORS = {
  "Super Admin": "bg-purple-100 text-purple-800",
  "Customer Care": "bg-blue-100 text-blue-800",
  "HR Officer": "bg-green-100 text-green-800",
  "Finance Officer": "bg-amber-100 text-amber-800",
  "Operations Officer": "bg-orange-100 text-orange-800",
};

export default function UsersManagementPage() {
  const { admin, loading } = useAdmin();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [editUser, setEditUser] = useState(null); // { id, role_name, full_name }
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, email, full_name }
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const isSuperAdmin = admin?.role === "Super Admin";

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/loginadminusers");
    }
  }, [admin, loading, router]);

  useEffect(() => {
    if (admin) fetchUsers();
  }, [admin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const result = await getUsers();
      if (result.success) setUsers(result.users);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || u.role_name === filterRole;

    const status = !u.password_set ? "pending" : u.is_suspended ? "suspended" : u.is_active ? "active" : "inactive";
    const matchesStatus = filterStatus === "all" || status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSuspend = (user, suspend) => {
    setActionError("");
    setActionSuccess("");
    startTransition(async () => {
      const result = await setSuspendedStatus(user.id, suspend);
      if (result.success) {
        setActionSuccess(result.message);
        fetchUsers();
      } else {
        setActionError(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setActionError("");
    startTransition(async () => {
      const result = await deleteUser(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
        setActionSuccess("User deleted successfully");
        fetchUsers();
      } else {
        setActionError(result.error);
        setDeleteTarget(null);
      }
    });
  };

  const handleRoleChange = (e) => {
    e.preventDefault();
    if (!editUser) return;
    setActionError("");
    startTransition(async () => {
      const result = await updateUser(editUser.id, { role_name: editUser.role_name });
      if (result.success) {
        setEditUser(null);
        setActionSuccess("Role updated successfully");
        fetchUsers();
      } else {
        setActionError(result.error);
        setEditUser(null);
      }
    });
  };

  const getUserStatus = (u) => {
    if (!u.password_set) return { label: "Pending Setup", color: "bg-yellow-100 text-yellow-800" };
    if (u.is_suspended) return { label: "Suspended", color: "bg-red-100 text-red-800" };
    if (u.is_active) return { label: "Active", color: "bg-green-100 text-green-800" };
    return { label: "Inactive", color: "bg-gray-100 text-gray-800" };
  };

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin accounts, roles, and access</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => router.push("/admindashboard/users/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Staff
          </button>
        )}
      </div>

      {/* Feedback */}
      {actionSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {actionSuccess}
          <button onClick={() => setActionSuccess("")} className="ml-auto text-green-600 hover:text-green-800">×</button>
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {actionError}
          <button onClick={() => setActionError("")} className="ml-auto text-red-600 hover:text-red-800">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Setup</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* ── Mobile card list ── */}
        <div className="sm:hidden">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No staff members found</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const status = getUserStatus(user);
                const initials = (user.full_name || user.email || "?").charAt(0).toUpperCase();
                const isSelf = admin?.id === user.id;
                return (
                  <div key={user.id} className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {user.full_name || user.username || "—"}
                          {isSelf && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role_name] || "bg-gray-100 text-gray-800"}`}>
                        {user.role_name}
                      </span>
                      <span className="text-xs text-gray-400">Last login: {user.last_login_time ? new Date(user.last_login_time).toLocaleDateString() : "Never"}</span>
                    </div>
                    {isSuperAdmin && !isSelf && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setEditUser({ id: user.id, role_name: user.role_name, full_name: user.full_name || user.email })} className="flex-1 py-1.5 text-xs border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50" disabled={isPending}>Change Role</button>
                        {user.password_set && (
                          <button onClick={() => handleSuspend(user, !user.is_suspended)} className={`flex-1 py-1.5 text-xs rounded-lg border ${user.is_suspended ? "border-green-200 text-green-700" : "border-amber-200 text-amber-700"}`} disabled={isPending}>
                            {user.is_suspended ? "Unsuspend" : "Suspend"}
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget({ id: user.id, email: user.email, full_name: user.full_name })} className="px-3 py-1.5 text-xs border border-red-200 text-red-700 rounded-lg hover:bg-red-50" disabled={isPending}>Delete</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                {isSuperAdmin && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><div className="flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No staff members found</td></tr>
              ) : (
                filteredUsers.map((user) => {
                  const status = getUserStatus(user);
                  const initials = (user.full_name || user.email || "?").charAt(0).toUpperCase();
                  const isSelf = admin?.id === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">{initials}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {user.full_name || user.username || "—"}
                              {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role_name] || "bg-gray-100 text-gray-800"}`}>
                          {user.role_name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {user.last_login_time ? new Date(user.last_login_time).toLocaleDateString() : "Never"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isSelf && (
                              <button onClick={() => setEditUser({ id: user.id, role_name: user.role_name, full_name: user.full_name || user.email })} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" disabled={isPending}>Change Role</button>
                            )}
                            {!isSelf && user.password_set && (
                              <button onClick={() => handleSuspend(user, !user.is_suspended)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors border ${user.is_suspended ? "border-green-200 text-green-700 hover:bg-green-50" : "border-amber-200 text-amber-700 hover:bg-amber-50"}`} disabled={isPending}>
                                {user.is_suspended ? "Unsuspend" : "Suspend"}
                              </button>
                            )}
                            {!isSelf && (
                              <button onClick={() => setDeleteTarget({ id: user.id, email: user.email, full_name: user.full_name })} className="px-3 py-1.5 text-xs border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors" disabled={isPending}>Delete</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity log link */}
      <div className="mt-4 text-right">
        <button
          onClick={() => router.push("/admindashboard/users/activity")}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View login activity log →
        </button>
      </div>

      {/* Edit Role Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Role</h3>
            <p className="text-sm text-gray-500 mb-4">{editUser.full_name}</p>
            <form onSubmit={handleRoleChange} className="space-y-4">
              <select
                value={editUser.role_name}
                onChange={(e) => setEditUser({ ...editUser, role_name: e.target.value })}
                className="w-full px-4 py-2 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5">
              Are you sure you want to permanently delete <strong>{deleteTarget.full_name || deleteTarget.email}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
