"use client";

import { useState } from "react";
import { Plus, Search, User, Mail, ShieldAlert, CheckCircle2 } from "lucide-react";

const MOCK_USERS = [
  { id: "1", name: "Nikshith Yadagiri", email: "student@aurora.ac.in", role: "STUDENT", status: "Active" },
  { id: "2", name: "Sai Rahul Mallidi", email: "faculty@aurora.ac.in", role: "FACULTY", status: "Active" },
  { id: "3", name: "System Administrator", email: "admin@aurora.ac.in", role: "ADMIN", status: "Active" },
  { id: "4", name: "Priya Sharma", email: "priya.s@aurora.ac.in", role: "STUDENT", status: "Inactive" },
  { id: "5", name: "Dr. Anil Kumar", email: "anil.k@aurora.ac.in", role: "FACULTY", status: "Active" },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = MOCK_USERS.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage students, faculty, and administrators.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="erp-input w-full md:w-40 bg-gray-50"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="FACULTY">Faculty</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold" style={{ color: "var(--accent)" }}>
                        {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-under-review">{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === "Active" ? "badge-present" : "badge-absent"}`}>
                      {user.status === "Active" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs px-3 py-1.5">Edit</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <p style={{ color: "var(--text-muted)" }}>No users found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
