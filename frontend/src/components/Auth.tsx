"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import OTPInput from "./OTPInput";

const ShapeGrid = dynamic(() => import("./ShapeGrid"), { ssr: false });

type AuthError = string | null;
type AuthStage = "form" | "verify-otp";

/**
 * Dual-mode authentication surface covering Sign In and Sign Up workflows.
 *
 * Sign Up is a two-stage flow: credential submission transitions the component
 * into an OTP verification stage. On success the user is returned to Sign In.
 * Sign In issues a JWT on success and immediately redirects to the workspace root.
 */
export default function Auth() {
    const [isLogin, setIsLogin]           = useState(true);
    const [stage, setStage]               = useState<AuthStage>("form");
    const [email, setEmail]               = useState("");
    const [password, setPassword]         = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]               = useState<AuthError>(null);
    const [info, setInfo]                 = useState<string | null>(null);
    const [isLoading, setIsLoading]       = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setInfo(null);
        setIsLoading(true);

        const endpoint = isLogin ? "/login" : "/signup";

        try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || data.detail || "Authentication failed.");
                return;
            }

            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                window.location.href = "/";
            } else if (!isLogin) {
                setStage("verify-otp");
                setInfo("A 4-digit code has been sent to your email.");
            }
        } catch {
            setError("Could not reach server. Is the backend running?");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPComplete = async (fullOtp: string) => {
        setError(null);
        setInfo(null);
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/verify-otp", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email, otp: fullOtp })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || data.detail || "Verification failed.");
                return;
            }

            setStage("form");
            setIsLogin(true);
            setPassword("");
            setInfo("Workspace verified! You can now sign in.");
        } catch {
            setError("Could not reach server.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderOTPStage = () => (
        <div className="bg-neo rounded-[40px] shadow-neo-convex p-10">
            <div className="text-center mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Step 2 of 2 — Verification
                </p>
                <h2 className="text-xl font-black text-slate-800">Enter Your Code</h2>
                <p className="text-sm text-slate-500 mt-2">
                    Sent to <span className="font-semibold text-slate-700">{email}</span>
                </p>
            </div>

            {info && (
                <div className="px-4 py-3 mb-4 rounded-xl bg-neo shadow-neo-concave text-sm font-medium text-slate-500 text-center">
                    {info}
                </div>
            )}
            {error && (
                <div className="px-4 py-3 mb-4 rounded-xl bg-neo shadow-neo-concave text-sm font-medium text-red-400 text-center">
                    {error}
                </div>
            )}

            <OTPInput onComplete={handleOTPComplete} />

            {isLoading && (
                <p className="text-center text-xs text-slate-400 mt-2 font-medium">Verifying...</p>
            )}

            <button
                onClick={() => { setStage("form"); setError(null); setInfo(null); }}
                className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors text-center"
            >
                ← Back to Sign Up
            </button>
        </div>
    );

    const renderFormStage = () => (
        <div className="bg-neo rounded-[40px] shadow-neo-convex p-10">
            <div className="flex p-1.5 rounded-2xl bg-neo shadow-neo-concave mb-8">
                <button
                    onClick={() => { setIsLogin(true); setError(null); setInfo(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                        isLogin
                            ? "bg-neo shadow-neo-convex-sm text-slate-700"
                            : "text-slate-400 hover:text-slate-500"
                    }`}
                >
                    Sign In
                </button>
                <button
                    onClick={() => { setIsLogin(false); setError(null); setInfo(null); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
                        !isLogin
                            ? "bg-neo shadow-neo-convex-sm text-slate-700"
                            : "text-slate-400 hover:text-slate-500"
                    }`}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Email
                    </label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-neo shadow-neo-concave text-slate-700 placeholder-slate-400 focus:outline-none text-sm font-medium transition-all duration-300"
                        required
                    />
                </div>

                <div className="flex flex-col gap-2 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 pr-12 rounded-2xl bg-neo shadow-neo-concave text-slate-700 placeholder-slate-400 focus:outline-none text-sm font-medium transition-all duration-300"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {isLogin && (
                        <div className="flex justify-end mt-1">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-slate-400 hover:text-[#8a5cff] transition-colors font-medium"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    )}
                </div>

                {info && (
                    <div className="px-4 py-3 rounded-xl bg-neo shadow-neo-concave text-sm font-medium text-slate-500 text-center">
                        {info}
                    </div>
                )}
                {error && (
                    <div className="px-4 py-3 rounded-xl bg-neo shadow-neo-concave text-sm font-medium text-red-400 text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 mt-2 rounded-2xl bg-neo shadow-neo-convex active:shadow-neo-concave text-slate-700 font-black tracking-wide transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {isLoading
                        ? "Authenticating..."
                        : isLogin
                            ? "Sign In →"
                            : "Create Account →"
                    }
                </button>
            </form>
        </div>
    );

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-neo">
            <div className="absolute inset-0 z-0 opacity-80">
                <ShapeGrid
                    speed={0.5}
                    squareSize={50}
                    direction="diagonal"
                    borderColor="#d1d9e6"
                    hoverFillColor="#ffffff"
                    shape="hexagon"
                    hoverTrailAmount={2}
                />
            </div>

            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(232,232,232,0.7) 100%)" }}
            />

            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10 flex flex-col items-center">
                        <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-3xl bg-neo shadow-neo-convex">
                            <svg
                                viewBox="0 0 24 24"
                                className="w-10 h-10 text-slate-700"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                                <line x1="12" y1="22" x2="12" y2="12" />
                                <line x1="22" y1="8.5" x2="12" y2="12" />
                                <line x1="2" y1="8.5" x2="12" y2="12" />
                                <circle cx="12" cy="12" r="3" fill="currentColor" />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-slate-800">
                            {stage === "verify-otp"
                                ? "Verify Identity"
                                : isLogin ? "Welcome Back" : "Create Account"
                            }
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {stage === "verify-otp" ? "Check your inbox" : "Access your workspace"}
                        </p>
                    </div>

                    {stage === "verify-otp" ? renderOTPStage() : renderFormStage()}

                    <p className="text-center text-xs text-slate-400 mt-6 font-semibold tracking-wide">
                        Session secured with JWT • Cognate v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
