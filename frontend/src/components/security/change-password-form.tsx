"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import Topbar from "@/components/layout/topbar";
import { Shield, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyRule {
  label: string;
  test: (p: string) => boolean;
}

const POLICY: PolicyRule[] = [
  { label: "At least 8 characters",             test: (p) => p.length >= 8 },
  { label: "One uppercase letter (A-Z)",         test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)",         test: (p) => /[a-z]/.test(p) },
  { label: "One number (0-9)",                   test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%...)",   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input w-full pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        currentPassword: current,
        newPassword: newPwd,
        confirmPassword: confirm,
      }),
    onSuccess: (res) => {
      setSuccessMsg((res as any).data?.message ?? "Password changed successfully.");
      setCurrent("");
      setNewPwd("");
      setConfirm("");
    },
  });

  const policyPassed = POLICY.every((r) => r.test(newPwd));
  const confirmMatch = newPwd.length > 0 && newPwd === confirm;
  const canSubmit = current.length > 0 && policyPassed && confirmMatch && !mutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSuccessMsg("");
    mutation.mutate();
  };

  const errorMessage = (() => {
    if (!mutation.isError) return null;
    const err = mutation.error as any;
    return err?.response?.data?.message ?? "An error occurred. Please try again.";
  })();

  return (
    <>
      <Topbar title="Security" breadcrumb={["Settings", "Security"]} />
      <div className="p-6 max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-surface-2)" }}
          >
            <Shield className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Security Settings
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Manage your account password and security preferences.
            </p>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Change Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              id="current-password"
              label="Current Password"
              value={current}
              onChange={setCurrent}
              placeholder="Enter current password"
            />

            <PasswordInput
              id="new-password"
              label="New Password"
              value={newPwd}
              onChange={setNewPwd}
              placeholder="Enter new password"
            />

            {/* Live policy indicators */}
            {newPwd.length > 0 && (
              <div className="rounded-lg p-3 space-y-1.5" style={{ background: "var(--bg-surface-2)" }}>
                {POLICY.map((rule) => {
                  const ok = rule.test(newPwd);
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      {ok ? (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--green)" }} />
                      ) : (
                        <X className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--red)" }} />
                      )}
                      <span
                        className={cn("text-xs", ok ? "line-through opacity-60" : "")}
                        style={{ color: ok ? "var(--text-muted)" : "var(--text-secondary)" }}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <PasswordInput
              id="confirm-password"
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter new password"
            />

            {confirm.length > 0 && (
              <p
                className="text-xs"
                style={{ color: confirmMatch ? "var(--green)" : "var(--red)" }}
              >
                {confirmMatch ? "Passwords match" : "Passwords do not match"}
              </p>
            )}

            {errorMessage && (
              <div
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  background: "color-mix(in srgb, var(--red) 10%, transparent)",
                  color: "var(--red)",
                  border: "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
                }}
              >
                {errorMessage}
              </div>
            )}

            {successMsg && (
              <div
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  background: "color-mix(in srgb, var(--green) 10%, transparent)",
                  color: "var(--green)",
                  border: "1px solid color-mix(in srgb, var(--green) 20%, transparent)",
                }}
              >
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mutation.isPending ? "Updating..." : "Update Password"}</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
