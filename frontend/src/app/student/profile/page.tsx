"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Topbar from "@/components/layout/topbar";
import { usersApi } from "@/lib/api/users.api";

const TABS = [
  "Details",
  "Personal Information",
  "Documents",
  "Achievements",
  "Transcript and Record of Assessment",
];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center">
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function StudentProfile() {
  const [activeTab, setActiveTab] = useState("Details");

  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => usersApi.getMyProfile(),
  });

  const profile = data?.data;
  const student = profile?.studentProfile;
  const section = student?.section;
  const term = section?.term;
  const year = term?.year;
  const course = year?.course;
  const department = course?.department;

  const fullName = student
    ? `${student.firstName} ${student.lastName}`
    : undefined;

  const batch = year?.academicYear ?? undefined;

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
                  color:
                    activeTab === tab
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
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
              <>
                {isLoading ? (
                  <div className="py-20 text-center">
                    <p style={{ color: "var(--text-muted)" }}>
                      Loading profile…
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
                    {/* Column 1 */}
                    <div className="space-y-6">
                      <Field label="Status" value={profile?.isActive ? "Active" : "Inactive"} />
                      <Field label="First Name" value={student?.firstName} />
                      <Field label="Last Name" value={student?.lastName} />
                      <Field
                        label="Registration Number"
                        value={student?.registrationNumber}
                      />
                      <Field label="Batch" value={batch} />
                      <Field label="Department" value={department?.name} />
                      <Field label="Course" value={course?.name} />
                      <Field label="Section" value={section?.name} />
                      <Field label="Term" value={term?.name} />
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-6">
                      <Field label="Email" value={profile?.email} />
                      <Field label="Full Name" value={fullName} />
                      <Field
                        label="Academic Status"
                        value={student?.academicStatus}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab !== "Details" && (
              <div className="py-20 text-center">
                <p style={{ color: "var(--text-muted)" }}>
                  This tab is currently empty or under development.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
