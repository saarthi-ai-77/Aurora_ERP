"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { usersApi } from "@/lib/api/users.api";

const PAGE_SIZE = 25;

function actorName(actor: any): string {
  const p =
    actor?.facultyProfile ?? actor?.adminProfile ?? actor?.studentProfile;
  if (p) return `${p.firstName} ${p.lastName}`;
  return actor?.email ?? "—";
}

export default function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => usersApi.getAuditLogs(page + 1, PAGE_SIZE),
  });

  const logs = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.pages ?? 0;

  const filtered = logs.filter(
    (l: any) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actorName(l.actor).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            System Audit Logs
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Security monitoring and system activity tracking.
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by actor or action…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action Event</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <p style={{ color: "var(--text-muted)" }}>Loading…</p>
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((log: any) => (
                <tr key={log.id}>
                  <td>
                    <div
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="font-medium">{actorName(log.actor)}</td>
                  <td>
                    <span className="badge badge-under-review flex items-center gap-1 w-fit">
                      <Activity className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {log.entityType} · {log.entityId.slice(0, 8)}…
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <p style={{ color: "var(--text-muted)" }}>No audit logs found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>
            Page {page + 1} of {totalPages} · {total} total entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
