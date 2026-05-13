"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, ArrowRight, Megaphone, FileText, User, Users, GraduationCap, X } from "lucide-react";
import { searchApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => searchApi.globalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = searchResults?.data?.results || [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'NOTICE': return <Megaphone className="w-3.5 h-3.5" />;
      case 'ASSIGNMENT': return <FileText className="w-3.5 h-3.5" />;
      case 'STUDENT': return <GraduationCap className="w-3.5 h-3.5" />;
      case 'FACULTY': return <User className="w-3.5 h-3.5" />;
      case 'SUBJECT': return <Users className="w-3.5 h-3.5" />;
      default: return <Search className="w-3.5 h-3.5" />;
    }
  };

  const getHref = (result: any) => {
    switch (result.type) {
      case 'NOTICE': return `/notices`; // Generic for now
      case 'ASSIGNMENT': return `/assignments`;
      case 'STUDENT': return `/admin/users`;
      case 'FACULTY': return `/admin/users`;
      case 'SUBJECT': return `/admin/sections`;
      default: return '#';
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200",
        isOpen ? "w-80 border-indigo-500 ring-2 ring-indigo-50 bg-white" : "w-64 border-gray-100 bg-gray-50/50 hover:border-gray-200"
      )}>
        <Search className={cn("w-4 h-4 transition-colors", isOpen ? "text-indigo-500" : "text-gray-400")} />
        <input 
          type="text"
          placeholder="Global search (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 text-gray-700"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && debouncedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Searching Academic Graph...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result: any, idx: number) => (
                  <Link 
                    key={`${result.type}-${result.id}-${idx}`}
                    href={getHref(result)}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-colors">
                        {getIcon(result.type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none">{result.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{result.type}</span>
                          <span className="text-[10px] text-gray-400 font-medium">· {result.subtext}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No results found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Index Search</span>
            <span className="text-[9px] font-medium text-gray-400 flex items-center gap-1">
              Esc to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
