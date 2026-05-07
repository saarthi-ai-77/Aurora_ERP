"use client";

import { useState } from "react";
import { Search, Clock, Activity } from "lucide-react";

const MOCK_LOGS = [
  { id: "1", action: "USER_LOGIN", actor: "admin@aurora.ac.in", target: "System", timestamp: "Oct 25, 2026 09:12 AM" },
  { id: "2", action: "ATTENDANCE_MARKED", actor: "faculty@aurora.ac.in", target: "Section A (CS301)", timestamp: "Oct 25, 2026 09:05 AM" },
  { id: "3", action: "ASSIGNMENT_CREATED", actor: "faculty@aurora.ac.in", target: "Database Normalization", timestamp: "Oct 24, 2026 04:30 PM" },
  { id: "4", action: "USER_CREATED", actor: "admin@aurora.ac.in", target: "student2@aurora.ac.in", timestamp: "Oct 24, 2026 11:20 AM" },
  { id: "5", action: "NOTICE_POSTED", actor: "admin@aurora.ac.in", target: "System Maintenance Downtime", timestamp: "Oct 22, 2026 02:15 PM" },
];

export default function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_LOGS.filter(
    (l) => l.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
           l.actor.toLowerCase().includes(searchQuery.toLowerCase())
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

      <div className="card p-4 flex items-center justify-between">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by actor or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              <th>Target Entity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Clock className="w-3.5 h-3.5" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="font-medium">{log.actor}</td>
                  <td>
                    <span className="badge badge-under-review flex items-center gap-1 w-fit">
                      <Activity className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{log.target}</td>
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
    </div>
  );
}
