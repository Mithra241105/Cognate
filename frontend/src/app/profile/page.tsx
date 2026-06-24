"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ShapeGrid = dynamic(() => import("../../components/ShapeGrid"), { ssr: false });

type MenuSection = "profile" | "account" | "appearance" | "about";

function decodeEmail(): string {
    if (typeof window === "undefined") return "";
    const token = localStorage.getItem("access_token");
    if (!token) return "";
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.sub || "";
    } catch {
        return "";
    }
}

export default function ProfilePage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<MenuSection>("profile");
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/");
            return;
        }
        const decoded = decodeEmail();
        setEmail(decoded);
        // Derive a default display name from email prefix
        setDisplayName(decoded.split("@")[0] || "User");
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        router.push("/");
    };

    const handleSave = () => {
        setSaveMessage("Changes saved!");
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const menuItems: { id: MenuSection; label: string; icon: JSX.Element }[] = [
        {
            id: "profile",
            label: "Profile",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            ),
        },
        {
            id: "account",
            label: "Account",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            ),
        },
        {
            id: "appearance",
            label: "Appearance",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
                </svg>
            ),
        },
        {
            id: "about",
            label: "About",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-neo">
            {/* Subtle background grid */}
            <div className="absolute inset-0 z-0 opacity-50">
                <ShapeGrid
                    speed={0.3}
                    squareSize={60}
                    direction="diagonal"
                    borderColor="#d1d9e6"
                    hoverFillColor="#ffffff"
                    shape="hexagon"
                    hoverTrailAmount={1}
                />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-5 bg-neo">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl shadow-neo-convex flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                                <line x1="12" y1="22" x2="12" y2="12" />
                                <line x1="22" y1="8.5" x2="12" y2="12" />
                                <line x1="2" y1="8.5" x2="12" y2="12" />
                                <circle cx="12" cy="12" r="3" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">Cognate</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/")}
                            className="px-6 py-2.5 rounded-xl shadow-neo-convex active:shadow-neo-concave text-slate-500 font-bold text-xs tracking-widest uppercase transition-all duration-150"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2.5 rounded-xl shadow-neo-convex active:shadow-neo-concave text-slate-500 font-bold text-xs tracking-widest uppercase transition-all duration-150"
                        >
                            Log Out
                        </button>
                    </div>
                </header>

                {/* Main content */}
                <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-12 gap-8 p-8">

                    {/* Sidebar Menu */}
                    <aside className="col-span-3 rounded-[32px] bg-neo shadow-neo-convex p-6 flex flex-col gap-2 h-fit">
                        {/* Avatar block */}
                        <div className="flex flex-col items-center py-6 mb-2">
                            <div className="w-20 h-20 rounded-full shadow-neo-convex flex items-center justify-center mb-3">
                                <span className="text-3xl font-black text-slate-700 uppercase">
                                    {displayName.charAt(0)}
                                </span>
                            </div>
                            <p className="text-sm font-black text-slate-800 truncate max-w-full px-2 text-center">{displayName}</p>
                            <p className="text-xs text-slate-400 font-medium truncate max-w-full px-2 text-center mt-0.5">{email}</p>
                        </div>

                        <div className="h-px shadow-neo-concave rounded-full mb-2" />

                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all duration-150 ${
                                    activeSection === item.id
                                        ? "shadow-neo-concave text-slate-800"
                                        : "shadow-neo-convex text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </aside>

                    {/* Content Panel */}
                    <main className="col-span-9 rounded-[32px] bg-neo shadow-neo-convex p-8 h-fit">
                        {activeSection === "profile" && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Section</p>
                                    <h2 className="text-2xl font-black text-slate-800">Profile</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manage your display name and how you appear in the workspace.</p>
                                </div>

                                <div className="h-px shadow-neo-concave rounded-full" />

                                {/* Avatar preview */}
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-full shadow-neo-convex flex items-center justify-center flex-shrink-0">
                                        <span className="text-4xl font-black text-slate-700 uppercase">
                                            {displayName.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{displayName}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{email}</p>
                                        <p className="text-xs text-slate-400 mt-3 font-medium">Avatar is auto-generated from your display name initial.</p>
                                    </div>
                                </div>

                                {/* Display name field */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-neo shadow-neo-concave text-slate-700 placeholder-slate-400 focus:outline-none text-sm font-medium transition-all duration-300"
                                        placeholder="Your display name"
                                    />
                                </div>

                                {/* Email field (read-only) */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="w-full px-5 py-4 rounded-2xl bg-neo shadow-neo-concave text-slate-400 text-sm font-medium cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-400 ml-1">Email address cannot be changed.</p>
                                </div>

                                {saveMessage && (
                                    <div className="px-4 py-3 rounded-xl bg-neo shadow-neo-concave text-sm font-bold text-emerald-500 text-center">
                                        {saveMessage}
                                    </div>
                                )}

                                <button
                                    onClick={handleSave}
                                    className="w-full py-4 rounded-2xl bg-neo shadow-neo-convex active:shadow-neo-concave text-slate-700 font-black tracking-wide transition-all duration-150 text-sm"
                                >
                                    Save Changes →
                                </button>
                            </div>
                        )}

                        {activeSection === "account" && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Section</p>
                                    <h2 className="text-2xl font-black text-slate-800">Account</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manage security and account-level actions.</p>
                                </div>

                                <div className="h-px shadow-neo-concave rounded-full" />

                                <div className="flex flex-col gap-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session</p>
                                    <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-neo shadow-neo-concave">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Active Session</p>
                                            <p className="text-xs text-slate-400 mt-0.5">You are currently logged in as <span className="font-semibold">{email}</span></p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danger Zone</p>
                                    <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-neo shadow-neo-concave">
                                        <div>
                                            <p className="text-sm font-bold text-red-500">Sign Out</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Ends your current session and returns you to the login screen.</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="px-5 py-2.5 rounded-xl shadow-neo-convex active:shadow-neo-concave text-red-400 font-bold text-xs tracking-widest uppercase transition-all duration-150"
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "appearance" && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Section</p>
                                    <h2 className="text-2xl font-black text-slate-800">Appearance</h2>
                                    <p className="text-sm text-slate-500 mt-1">Customize the look and feel of your workspace.</p>
                                </div>

                                <div className="h-px shadow-neo-concave rounded-full" />

                                <div className="flex flex-col gap-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Theme</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {["Neumorphic Light", "Classic Flat"].map((theme, i) => (
                                            <div
                                                key={theme}
                                                className={`flex flex-col items-center gap-3 p-5 rounded-2xl cursor-pointer transition-all duration-150 ${
                                                    i === 0 ? "shadow-neo-concave" : "shadow-neo-convex hover:shadow-neo-concave"
                                                }`}
                                            >
                                                {/* Theme preview swatch */}
                                                <div className="w-full h-16 rounded-xl overflow-hidden shadow-neo-concave flex items-center justify-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg" style={{ background: i === 0 ? "#e8e8e8" : "#f8fafc", boxShadow: i === 0 ? "4px 4px 8px #bebebe, -4px -4px 8px #ffffff" : "none", border: i === 1 ? "1px solid #e2e8f0" : "none" }} />
                                                    <div className="w-5 h-5 rounded-full" style={{ background: "#8a5cff" }} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {i === 0 && <div className="w-2 h-2 rounded-full bg-[#8a5cff]" />}
                                                    <p className="text-xs font-bold text-slate-600">{theme}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 ml-1">Additional themes coming soon.</p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accent Color</p>
                                    <div className="flex gap-3 px-5 py-4 rounded-2xl bg-neo shadow-neo-concave">
                                        {["#8a5cff", "#00a0ff", "#00d282", "#ffa500", "#ef4444"].map((color) => (
                                            <button
                                                key={color}
                                                className="w-8 h-8 rounded-full shadow-neo-convex active:shadow-neo-concave transition-all duration-150"
                                                style={{ background: color }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 ml-1">Accent color customization coming soon.</p>
                                </div>
                            </div>
                        )}

                        {activeSection === "about" && (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Section</p>
                                    <h2 className="text-2xl font-black text-slate-800">About Cognate</h2>
                                    <p className="text-sm text-slate-500 mt-1">System details and version information.</p>
                                </div>

                                <div className="h-px shadow-neo-concave rounded-full" />

                                <div className="flex items-center gap-5 px-5 py-6 rounded-2xl bg-neo shadow-neo-concave">
                                    <div className="w-16 h-16 rounded-2xl shadow-neo-convex flex items-center justify-center flex-shrink-0">
                                        <svg viewBox="0 0 24 24" className="w-9 h-9 text-slate-700" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                                            <line x1="12" y1="22" x2="12" y2="12" />
                                            <line x1="22" y1="8.5" x2="12" y2="12" />
                                            <line x1="2" y1="8.5" x2="12" y2="12" />
                                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-800">Cognate Workspace</p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">v1.0.0 • Production</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {[
                                        { label: "Framework", value: "Next.js + FastAPI" },
                                        { label: "Database", value: "MongoDB Atlas" },
                                        { label: "ML Engine", value: "Sentence Transformers" },
                                        { label: "Auth", value: "JWT (Bearer)" },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center justify-between px-5 py-3 rounded-2xl bg-neo shadow-neo-concave">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                            <span className="text-sm font-bold text-slate-700">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
