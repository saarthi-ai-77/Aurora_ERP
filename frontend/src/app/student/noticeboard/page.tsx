"use client";

import { useQuery } from "@tanstack/react-query";
import { noticeboardApi } from "@/lib/api";
import Topbar from "@/components/layout/topbar";
import { Search, Pin, Calendar, Paperclip, Loader2, Info, User } from "lucide-react";
import { useState } from "react";
import { NoticeCategory } from "@/lib/enums";
import { cn } from "@/lib/utils";

const CATEGORIES = ["ALL", ...Object.values(NoticeCategory)];

export default function StudentNoticeboard() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("ALL");

  const { data: noticesData, isLoading } = useQuery({
    queryKey: ["student-notices"],
    queryFn: () => noticeboardApi.getMyNotices(),
  });

  const notices = noticesData?.data || [];

  const filtered = notices.filter((n: any) => 
    (activeCat === "ALL" || n.category === activeCat) &&
    (n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Topbar title="Noticeboard" breadcrumb={["Noticeboard"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Controls */}
        <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                  activeCat === cat 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                    : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Notices */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-gray-500">Loading notices...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((notice: any) => {
              const posterName = notice.postedBy.adminProfile 
                ? `${notice.postedBy.adminProfile.firstName} ${notice.postedBy.adminProfile.lastName}`
                : notice.postedBy.facultyProfile
                  ? `${notice.postedBy.facultyProfile.firstName} ${notice.postedBy.facultyProfile.lastName}`
                  : "System Admin";

              return (
                <div key={notice.id} className="bg-white rounded-xl border shadow-sm p-6 hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden">
                  {notice.isPinned && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                  )}
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        {notice.isPinned && (
                          <div className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                            <Pin className="w-3 h-3 fill-orange-600" /> Pinned
                          </div>
                        )}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                          notice.category === 'EXAMS' ? "bg-red-50 text-red-600 border-red-100" :
                          notice.category === 'ACADEMIC' ? "bg-blue-50 text-blue-600 border-blue-100" :
                          "bg-gray-50 text-gray-500 border-gray-100"
                        )}>
                          {notice.category}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                          notice.priority === 'HIGH' ? "bg-red-600 text-white border-red-600" :
                          notice.priority === 'MEDIUM' ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {notice.priority}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {notice.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                          {notice.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <User className="w-3.5 h-3.5" />
                          <span>{posterName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(notice.publishedAt || notice.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      {notice.attachmentUrl && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                          <Paperclip className="w-3.5 h-3.5" />
                          ATTACHMENT
                        </div>
                      )}
                      <div className="h-10 w-10 rounded-full bg-gray-50 border flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                        <Info className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-dashed p-20 text-center space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No notices found</p>
              <p className="text-xs text-gray-400">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
