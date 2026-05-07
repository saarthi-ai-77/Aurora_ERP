"use client";

import { Save, Shield, Database, BellRing } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            System Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Configure global ERP parameters and preferences.
          </p>
        </div>
        <button className="btn-primary">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Security Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Security & Authentication
            </h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Session Timeout (Minutes)
                </label>
                <input type="number" className="erp-input" defaultValue={15} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Max Failed Login Attempts
                </label>
                <input type="number" className="erp-input" defaultValue={5} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                Require Two-Factor Authentication for Admins
              </span>
            </label>
          </div>
        </div>

        {/* Academic Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Academic Configuration
            </h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Current Academic Year
                </label>
                <select className="erp-input">
                  <option>2026-2027</option>
                  <option>2025-2026</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Active Semester Term
                </label>
                <select className="erp-input">
                  <option>Odd Semester</option>
                  <option>Even Semester</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                Allow students to view graded assignments immediately
              </span>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BellRing className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Notification Rules
            </h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                Email faculty on new assignment submissions
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                Email students when attendance falls below 75%
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                Daily system digest to administrators
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
