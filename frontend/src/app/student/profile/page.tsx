"use client";

import { useState } from "react";
import Topbar from "@/components/layout/topbar";

const TABS = [
  "Details",
  "Personal Information",
  "Documents",
  "Achievements",
  "Transcript and Record of Assessment",
];

export default function StudentProfile() {
  const [activeTab, setActiveTab] = useState("Details");

  return (
    <>
      <Topbar title="Profile" breadcrumb={["Profile"]} />

      <div
        className="p-6 max-w-7xl mx-auto"
        style={{ minHeight: "calc(100vh - var(--topbar-height))" }}
      >
        <div className="card overflow-hidden">
          {/* Tabs header */}
          <div
            className="flex items-center gap-6 px-6 pt-4 overflow-x-auto"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
                style={{
                  color: activeTab === tab ? "var(--accent)" : "var(--text-secondary)",
                  borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "Details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
                {/* Column 1 */}
                <div className="space-y-6">
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Title</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Student Signature</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Status</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Active</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>First Name</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>Yadagiri</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Batch</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>2025-2029</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Student Category</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Registration Number</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>252U1R7098</span>
                  </div>

                  {/* Parent Address Subsection */}
                  <div className="pt-4">
                    <h3 className="font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
                      Parent Address
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-[160px_1fr] items-center">
                        <span style={{ color: "var(--text-secondary)" }}>Street1</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>Uppal, Hyderabad</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] items-center">
                        <span style={{ color: "var(--text-secondary)" }}>Country</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>India</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] items-center">
                        <span style={{ color: "var(--text-secondary)" }}>City</span>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>hyderabad</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Profile Image</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Registration Number.</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>252U1R7098</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Salutation</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Last Name</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>.Nikshith</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Aadhar No</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Admission Number</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>40636</span>
                  </div>
                  <div className="grid grid-cols-[160px_1fr] items-center">
                    <span style={{ color: "var(--text-secondary)" }}>Identification Marks</span>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                  </div>

                  {/* Parent Address Subsection (Right) */}
                  <div className="pt-10 mt-2 space-y-6">
                    <div className="grid grid-cols-[160px_1fr] items-center">
                      <span style={{ color: "var(--text-secondary)" }}>Street2</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>—</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] items-center">
                      <span style={{ color: "var(--text-secondary)" }}>State</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>Telangana</span>
                    </div>
                    <div className="grid grid-cols-[160px_1fr] items-center">
                      <span style={{ color: "var(--text-secondary)" }}>Pincode</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>500039</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "Details" && (
              <div className="py-20 text-center">
                <p style={{ color: "var(--text-muted)" }}>This tab is currently empty or under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
