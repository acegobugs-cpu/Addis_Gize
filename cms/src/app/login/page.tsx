"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ email_or_username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, isAuthenticated, refreshUser} = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/proxy/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_or_username: form.email_or_username,
          password: form.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const { user } = await response.json();
      setUser(user);

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
  <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
    {/* Background */}
    <div className="absolute inset-0 z-0">
      {/* Replaced hardcoded purple gradient with a deep East-to-North-dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-east-dark via-east-dark/95 to-north-dark"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-ink/30"></div>
    </div>

    {/* Card */}
    {/* Replaced white/95 with canvas/95, border with border token */}
    <div className="relative z-10 w-full max-w-md p-10 rounded-2xl shadow-2xl bg-canvas/95 backdrop-blur-sm border border-border/50">
      {/* Brand title now uses main brand color (East) */}
      <h1 className="text-4xl font-bold text-center mb-8 text-west tracking-tight">
        Prime Media
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            name="email_or_username"
            placeholder="Username or Email"
            value={form.email_or_username}
            onChange={handleChange}
            required
            className="w-full px-5 py-4 rounded-xl border border-border focus:border-east focus:ring-2 focus:ring-east/30 bg-canvas/80 transition-all duration-200 text-ink placeholder-muted text-lg"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-5 py-4 rounded-xl border border-border focus:border-east focus:ring-2 focus:ring-east/30 bg-canvas/80 transition-all duration-200 text-ink placeholder-muted text-lg"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-east transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Error State uses the new warm/destructive "South" tokens */}
        {error && (
          <p className="text-south text-sm text-center font-medium bg-south-light/80 py-2 rounded-lg border border-south/20">
            {error}
          </p>
        )}

        {/* Submit button uses East, East-hover, and East-focused rings */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-east text-canvas py-4 px-6 rounded-xl text-lg font-semibold hover:bg-east-hover focus:ring-4 focus:ring-east/40 disabled:opacity-60 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Subtle accent line gracefully shifting from East (Blue) to West (Green) */}
      <div className="mt-8 h-1 bg-gradient-to-r from-transparent via-west/40 to-transparent rounded-full max-w-[180px] mx-auto"></div>
    </div>
  </div>
);
}
