"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { getStoredUser } from "@/lib/auth";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
    } else if (user.role !== "STUDENT") {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb]">
      <Sidebar role="STUDENT" basePath="/student" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
