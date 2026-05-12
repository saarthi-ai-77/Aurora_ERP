"use client";

import { useState } from "react";
import { 
  Plus, Search, Mail, ShieldAlert, CheckCircle2, 
  Upload, UserPlus, Trash2, Ban, UserCheck, Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { toast } from "react-hot-toast";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadRole, setUploadRole] = useState("STUDENT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch Users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", roleFilter],
    queryFn: async () => {
      const res = await usersApi.getAll(roleFilter === "all" ? undefined : roleFilter);
      return res.data;
    },
  });

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated successfully");
    },
    onError: () => toast.error("Failed to update user status"),
  });

  // Bulk Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("No file selected");
      return usersApi.bulkUpload(selectedFile, uploadRole);
    },
    onSuccess: (res) => {
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Upload complete: ${res.data.success} successful, ${res.data.failed} failed`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Bulk upload failed");
    },
  });

  const filtered = users.filter((u: any) => {
    const name = u.studentProfile 
      ? `${u.studentProfile.firstName} ${u.studentProfile.lastName}`
      : u.facultyProfile 
        ? `${u.facultyProfile.firstName} ${u.facultyProfile.lastName}`
        : u.adminProfile 
          ? `${u.adminProfile.firstName} ${u.adminProfile.lastName}`
          : "Unknown User";
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage and monitor access for all system members.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn-secondary"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search users..."
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

      <div className="card overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Fetching members...</p>
          </div>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((user: any) => {
                  const profile = user.studentProfile || user.facultyProfile || user.adminProfile;
                  const name = profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
                  
                  return (
                    <tr key={user.id}>
                      <td className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 border flex items-center justify-center text-xs font-bold" style={{ color: "var(--accent)", borderColor: "var(--accent-border)" }}>
                            {name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">{name}</span>
                            <span className="text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>
                              {user.studentProfile?.registrationNumber || user.facultyProfile?.staffId || "ADMIN"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                          <Mail className="w-3.5 h-3.5 opacity-60" />
                          {user.email}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          user.role === 'FACULTY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? "badge-present" : "badge-absent"}`}>
                          {user.isActive ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><Ban className="w-3 h-3 mr-1" /> Blocked</>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className={`btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 ${
                              user.isActive ? "hover:text-red-600 hover:border-red-200" : "hover:text-green-600 hover:border-green-200"
                            }`}
                            title={user.isActive ? "Block User" : "Activate User"}
                            onClick={() => toggleMutation.mutate(user.id)}
                            disabled={toggleMutation.isPending}
                          >
                            {user.isActive ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {user.isActive ? "Block" : "Unblock"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <p style={{ color: "var(--text-muted)" }}>No matching members found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Upload Modal */}
      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        title="Bulk Import Members"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Select Target Role</label>
            <div className="flex gap-2">
              {["STUDENT", "FACULTY", "ADMIN"].map((r) => (
                <button
                  key={r}
                  onClick={() => setUploadRole(r)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                    uploadRole === r 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Choose Excel/CSV File</label>
            <div className="relative border-2 border-dashed rounded-xl p-8 transition-colors hover:border-indigo-400 flex flex-col items-center gap-3 cursor-pointer"
                 style={{ borderColor: "var(--border)" }}>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />
              <Upload className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
              <div className="text-center">
                <p className="text-sm font-medium">{selectedFile ? selectedFile.name : "Click or drag to upload"}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Support .xlsx, .csv (Max 5MB)</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              className="btn-primary w-full py-3"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <>Start Import Process</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
