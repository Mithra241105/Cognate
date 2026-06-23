"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import OTPInput from "../../components/OTPInput";

const ShapeGrid = dynamic(() => import("../../components/ShapeGrid"), { ssr: false });

type ResetStage = "request" | "verify";

/**
 * Two-stage password reset page.
 *
 * Stage 1 — Request: Submits the user's email to trigger a backend OTP dispatch.
 * Stage 2 — Verify: Accepts the 4-digit OTP and the new password, then redirects
 * to the sign-in page on success after a 3-second confirmation delay.
 */
export default function ForgotPasswordPage() {
    const router                        = useRouter();
    const [stage, setStage]             = useState<ResetStage>("request");
    const [email, setEmail]             = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [otpValue, setOtpValue]       = useState("");
    const [isLoading, setIsLoading]     = useState(false);
    const [error, setError]             = useState<string | null>(null);
    const [success, setSuccess]         = useState(false);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/forgot-password", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || data.detail || "Request failed.");
                return;
            }

            setStage("verify");
        } catch {
            setError("Could not reach server. Is the backend running?");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPComplete = (fullOtp: string) => {
        setOtpValue(fullOtp);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (otpValue.length < 4) {
            setError("Please enter the complete 4-digit code.");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/reset-password", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email, otp: otpValue, new_password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || data.detail || "Reset failed.");
                return;
            }

            setSuccess(true);
            setTimeout(() => { router.push("/"); }, 3000);
        } catch {
            setError("Could not reach server.");
        } finally {
            setIsLoading(false);
        }
    };

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
                            {stage === "request" ? "Reset Password" : "Enter Recovery Code"}
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {stage === "request"
                                ? "We'll send a secure code to your inbox"
                                : `Code sent to ${email}`
                            }
                        </p>
                    </div>

                    <div className="bg-neo rounded-[40px] shadow-neo-convex p-10">
                        {success ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-neo shadow-neo-convex flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <div className="w-full px-5 py-4 rounded-2xl bg-neo shadow-neo-concave text-center">
                                    <p className="text-sm font-bold text-emerald-600">Password Reset Successful</p>
                                    <p className="text-xs text-slate-400 mt-1">Redirecting you to Sign In...</p>
                                </div>
                            </div>
                        ) : stage === "request" ? (
                            <form onSubmit={handleRequestOTP} className="space-y-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        Email Address
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
                                    {isLoading ? "Sending..." : "Send Recovery Code →"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-5">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-1">
                                        4-Digit Recovery Code
                                    </p>
                                    <OTPInput onComplete={handleOTPComplete} />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-neo shadow-neo-concave text-slate-700 placeholder-slate-400 focus:outline-none text-sm font-medium transition-all duration-300"
                                        required
                                        minLength={6}
                                    />
                                </div>

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
                                    {isLoading ? "Resetting..." : "Reset Password →"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStage("request"); setError(null); setOtpValue(""); }}
                                    className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors text-center"
                                >
                                    ← Try a different email
                                </button>
                            </form>
                        )}
                    </div>

                    <p className="text-center text-sm text-slate-400 mt-6 font-medium">
                        Remembered it?{" "}
                        <Link href="/" className="text-[#8a5cff] font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>

                    <p className="text-center text-xs text-slate-400 mt-3 font-semibold tracking-wide">
                        Session secured with JWT • Cognate v1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
