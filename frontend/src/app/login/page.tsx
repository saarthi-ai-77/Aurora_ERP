"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import { setStoredAuth, getDashboardPath, LoginResponse } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      setStoredAuth(data);
      router.push(getDashboardPath(data.user.role));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Invalid credentials. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "#ffffff" }}
    >
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-sm rounded-lg p-10 flex flex-col">
        {/* Logo at the top of the centered card */}
        <div className="flex justify-center mb-8">
          <Image
            src="/aurora-logo.svg"
            alt="Aurora ERP Logo"
            width={120}
            height={120}
            priority
          />
        </div>

        {/* Form area */}
        <div className="mb-6 text-center">
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sign in to Aurora ERP
          </p>
        </div>

        <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Username / Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Username
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@aurora.ac.in"
              className="erp-input w-full bg-gray-50 border-gray-300"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="erp-input w-full bg-gray-50 border-gray-300"
                style={{ paddingRight: "38px" }}
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-gray-900"
                style={{ color: "var(--text-muted)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div id="login-error" role="alert" className="alert-error mt-4">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-2.5 mt-2 text-sm font-semibold uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Forgot password link */}
        <div className="mt-5 text-center">
          <a
            href="#"
            id="forgot-password-link"
            className="text-sm transition-colors hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Forgot Password?
          </a>
        </div>

        {/* Language */}
        <div
          className="mt-6 pt-6 flex items-center justify-center gap-2 text-xs border-t border-gray-100"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 1 0 20M2 12h20M12 2C6.48 2 2 6.48 2 12"/>
          </svg>
          <span>Choose Language</span>
          <span className="cursor-pointer hover:text-gray-900" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
            English ▾
          </span>
        </div>
      </div>
    </main>
  );
}
