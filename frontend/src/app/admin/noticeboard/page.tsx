"use client";

import { useState } from "react";
import { 
  Plus, Search, Megaphone, Calendar, Pin, 
  Loader2, Filter, Trash2, Send, Archive,
  Users, Building2, LayoutGrid, CheckCircle2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noticeboardApi, academicApi } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { toast } from "react-hot-toast";
import { NoticeCategory, NoticePriority, Role } from "@/lib/enums";
import { cn } from "@/lib/utils";

export default function AdminNoticeboardPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: NoticeCategory.GENERAL,
    priority: NoticePriority.MEDIUM,
    isPinned: false,
    targetRoles: [] as Role[],
    targetDepartments: [] as string[],
    targetSections: [] as string[]
  });

  // Queries
  const { data: noticesData, isLoading } = useQuery({
    queryKey: ["admin-notices", page],
    queryFn: () => noticeboardApi.getAllNotices({ page, limit: PAGE_SIZE }),
  });

  const { data: academicData } = useQuery({
    queryKey: ["academic-structure"],
    queryFn: () => academicApi.getStructure(),
  });

  const notices = noticesData?.data || [];
  const noticePagination = noticesData?.pagination;
  const departments = academicData?.data?.departments || [];
  const sections = academicData?.data?.sections || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => noticeboardApi.createNotice({ ...data, status: 'PUBLISHED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      toast.success("Notice posted successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to post notice")
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => noticeboardApi.archiveNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      toast.success("Notice archived");
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: NoticeCategory.GENERAL,
      priority: NoticePriority.MEDIUM,
      isPinned: false,
      targetRoles: [],
      targetDepartments: [],
      targetSections: []
    });
  };

  const handleRoleToggle = (role: Role) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  const filteredNotices = notices.filter((n: any) => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Institutional Broadcasts
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage and monitor academic announcements.
          </p>
        </div>
        <button 
          className="btn-primary h-11 px-5 flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search broadcasts..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs h-9 px-3">
            <Filter className="w-3.5 h-3.5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-gray-500">Fetching notices...</p>
          </div>
        ) : filteredNotices.length > 0 ? (
          filteredNotices.map((notice: any) => (
            <div key={notice.id} className="bg-white rounded-xl border shadow-sm p-5 hover:border-indigo-200 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm",
                    notice.status === 'PUBLISHED' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-gray-50 border-gray-100 text-gray-400"
                  )}>
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{notice.title}</h3>
                      {notice.isPinned && <Pin className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />}
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
                        notice.status === 'PUBLISHED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-100 text-gray-500 border-gray-200"
                      )}>
                        {notice.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="uppercase">{notice.category}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                        notice.priority === 'HIGH' ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                      )}>
                        {notice.priority} PRIORITY
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary h-8 px-3 text-xs">Edit</button>
                  {notice.status !== 'ARCHIVED' && (
                    <button 
                      onClick={() => archiveMutation.mutate(notice.id)}
                      disabled={archiveMutation.isPending}
                      className="btn-secondary h-8 px-3 text-xs text-red-600 hover:bg-red-50 hover:border-red-100"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 leading-relaxed max-w-3xl">
                {notice.content}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {notice.targetRoles.map((role: string) => (
                  <span key={role} className="text-[9px] font-black bg-gray-50 text-gray-500 px-2 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider">
                    <Users className="w-2.5 h-2.5" /> {role}
                  </span>
                ))}
                {notice.targetDepartments.map((dept: string) => (
                  <span key={dept} className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1 uppercase tracking-wider">
                    <Building2 className="w-2.5 h-2.5" /> {dept}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 bg-white rounded-xl border border-dashed text-center">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No broadcasts found</p>
          </div>
        )}
      </div>

      {noticePagination && noticePagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {noticePagination.page} of {noticePagination.pages} · {noticePagination.total} notices
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1.5"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn-secondary px-3 py-1.5"
              disabled={page >= noticePagination.pages}
              onClick={() => setPage((p) => Math.min(noticePagination.pages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Post Notice Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Broadcast"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</label>
            <input 
              className="erp-input h-11"
              placeholder="e.g. Mid-Term Examination Schedule"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
              <select 
                className="erp-input h-11"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as NoticeCategory }))}
              >
                {Object.values(NoticeCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</label>
              <select 
                className="erp-input h-11"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as NoticePriority }))}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Roles</label>
            <div className="flex gap-2">
              {Object.values(Role).map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleToggle(role)}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all",
                    formData.targetRoles.includes(role) 
                      ? "bg-indigo-600 text-white border-indigo-600" 
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Broadcast Content</label>
            <textarea 
              className="erp-input min-h-[120px] py-3 leading-relaxed"
              placeholder="Enter announcement details..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg">
            <input 
              type="checkbox" 
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
              className="w-4 h-4 text-orange-600"
            />
            <label htmlFor="isPinned" className="text-xs font-bold text-orange-700 flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5" /> Pin to top of board
            </label>
          </div>

          <button 
            className="btn-primary w-full h-12 flex items-center justify-center gap-2"
            disabled={createMutation.isPending || !formData.title || !formData.content}
            onClick={() => createMutation.mutate(formData)}
          >
            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Publish Broadcast</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
