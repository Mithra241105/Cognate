"use client";

import React, { useState, useEffect, useCallback } from "react";
import Loader from "./Loader";

interface QuestionHistory {
    id: string;
    question: string;
    topic_tag: string;
    timestamp: string;
}

interface SimilarQuestion {
    text: string;
    similarity_score: number;
    topic_tag: string;
}

interface QuestionResponse {
    original_question: string;
    topic_tag: string;
    cognitive_level: string;
    is_duplicate: boolean;
    similar_questions: SimilarQuestion[];
}

const tags = ["All", "Mathematics", "Physics", "Biology", "Computer Science"];

const TAG_PILLS: Record<string, { bg: string; text: string }> = {
    "Mathematics":      { bg: "rgba(138, 92, 255, 0.12)", text: "#8a5cff" },
    "Physics":          { bg: "rgba(0, 160, 255, 0.12)",  text: "#00a0ff" },
    "Biology":          { bg: "rgba(0, 210, 130, 0.12)",  text: "#00d282" },
    "Computer Science": { bg: "rgba(255, 165, 0, 0.12)",  text: "#ffa500" },
};

const scoreToWidth = (score: number) => `${Math.round(score * 100)}%`;

const getAuthHeader = (): Record<string, string> => {
    const token = typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    return token ? { "Authorization": `Bearer ${token}` } : {};
};

export default function Dashboard() {
    const [history, setHistory]       = useState<QuestionHistory[]>([]);
    const [filterTag, setFilterTag]   = useState("All");
    const [query, setQuery]           = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult]         = useState<QuestionResponse | null>(null);
    const [displayName, setDisplayName] = useState<string>("User");

    const fetchHistory = useCallback(async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const url = filterTag !== "All"
                ? `${API_URL}/api/history?tag=${encodeURIComponent(filterTag)}`
                : `${API_URL}/api/history`;
            const response = await fetch(url, {
                headers: getAuthHeader()
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch { /* silent */ }
    }, [filterTag]);

    const fetchProfile = useCallback(async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${API_URL}/profile`, {
                headers: getAuthHeader()
            });
            if (response.ok) {
                const data = await response.json();
                if (data.display_name) {
                    setDisplayName(data.display_name);
                }
            }
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchHistory();
        fetchProfile();
    }, [fetchHistory, fetchProfile]);

    const fetchAnalysis = async (textToAnalyze: string) => {
        if (!textToAnalyze.trim() || isProcessing) return;
        setIsProcessing(true);
        setResult(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${API_URL}/api/questions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                body: JSON.stringify({ question: textToAnalyze })
            });
            if (response.ok) {
                const data: QuestionResponse = await response.json();
                setResult(data);
                fetchHistory();
            }
        } catch { /* silent */ } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async () => {
        fetchAnalysis(query);
    };

    const handleHistoryClick = (pastQuestion: string) => {
        setQuery(pastQuestion);
        fetchAnalysis(pastQuestion);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
    };

    return (
        <div className="min-h-screen w-full bg-neo">

            {/* ── Global Nav ─────────────────────────────────────────────── */}
            <header className="flex items-center justify-between px-10 py-5 bg-neo">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl shadow-neo-convex flex items-center justify-center">
                        <svg
                            viewBox="0 0 24 24"
                            className="w-7 h-7 text-slate-700"
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
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                        Cognate
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-500 mr-2">
                        Welcome, <span className="text-slate-800">{displayName}</span>
                    </span>
                    <button
                        onClick={() => window.location.href = "/profile"}
                        className="px-6 py-2.5 rounded-xl shadow-neo-convex active:shadow-neo-concave text-slate-500 font-bold text-xs tracking-widest uppercase transition-all duration-150"
                    >
                        Profile
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2.5 rounded-xl shadow-neo-convex active:shadow-neo-concave text-slate-500 font-bold text-xs tracking-widest uppercase transition-all duration-150"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* ── Bento Grid ─────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-8 p-8">

                {/* ── LEFT BOX: History & Filters (col-span-4) ─────────── */}
                <aside className="col-span-4 rounded-[32px] bg-neo shadow-neo-convex p-8 flex flex-col h-[calc(100vh-140px)]">

                    {/* Filter pills label */}
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Filter by Topic
                    </p>

                    {/* Neumorphic filter pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {tags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 ${
                                    filterTag === tag
                                        ? "shadow-neo-concave text-slate-800"
                                        : "shadow-neo-convex text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="h-px shadow-neo-concave rounded-full mb-5" />

                    {/* History count label */}
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        {history.length} Past {history.length === 1 ? "Query" : "Queries"}
                    </p>

                    {/* Scrollable history feed */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neo [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
                        {history.length === 0 && (
                            <div className="flex flex-col items-center justify-center flex-1 gap-3 py-10 text-center">
                                <div className="w-14 h-14 rounded-2xl shadow-neo-concave flex items-center justify-center">
                                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-400 font-medium">No history yet.</p>
                            </div>
                        )}
                        {history.map(item => {
                            const pill = TAG_PILLS[item.topic_tag];
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleHistoryClick(item.question)}
                                    className="p-4 rounded-2xl shadow-neo-convex bg-neo flex flex-col gap-2 cursor-pointer border border-transparent hover:border-[#8a5cff] hover:shadow-neo-concave transition-all duration-200"
                                >
                                    <span
                                        className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg self-start"
                                        style={{
                                            background: pill?.bg || "rgba(100,100,100,0.1)",
                                            color:      pill?.text || "#64748b"
                                        }}
                                    >
                                        {item.topic_tag}
                                    </span>
                                    <p className="text-sm text-slate-700 font-medium leading-snug line-clamp-2">
                                        {item.question}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                </aside>

                {/* ── RIGHT COLUMN: Engine (col-span-8) ─────────────────── */}
                <main className="col-span-8 flex flex-col gap-8">

                    {/* ── TOP BOX: Input ─────────────────────────────────── */}
                    <div className="rounded-[32px] bg-neo shadow-neo-convex p-8">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
                            Submit a Question
                        </p>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your question here... (Ctrl + Enter to submit)"
                            rows={5}
                            className="w-full px-6 py-5 rounded-2xl bg-transparent shadow-neo-concave text-slate-700 placeholder-slate-400 focus:outline-none text-sm font-medium resize-none leading-relaxed transition-all duration-300"
                        />
                        <div className="flex justify-end mt-5">
                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing || !query.trim()}
                                className="px-10 py-3.5 rounded-2xl bg-neo shadow-neo-convex active:shadow-neo-concave text-slate-700 font-black tracking-wide text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? "Processing…" : "Analyze →"}
                            </button>
                        </div>
                    </div>

                    {/* ── BOTTOM BOX: Results ────────────────────────────── */}
                    <div className="rounded-[32px] bg-neo shadow-neo-convex p-8 flex-1 flex flex-col min-h-[340px]">

                        {/* Idle state */}
                        {!isProcessing && !result && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl shadow-neo-concave flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 font-semibold tracking-wide text-sm">
                                    Awaiting Query…
                                </p>
                                <p className="text-slate-300 text-xs font-medium max-w-xs">
                                    Submit a question above to activate the vector proximity engine.
                                </p>
                            </div>
                        )}

                        {/* Processing state */}
                        {isProcessing && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <div className="p-8 rounded-2xl shadow-neo-concave flex flex-col items-center gap-5">
                                    <Loader />
                                    <span className="text-slate-500 font-semibold tracking-wide text-sm">
                                        Processing Vector Proximity…
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Result state */}
                        {result && !isProcessing && (
                            <div className="flex flex-col gap-6">

                                {/* Classification header */}
                                <div className="flex items-center gap-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Classified as
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const pill = TAG_PILLS[result.topic_tag];
                                            return (
                                                <span
                                                    className="px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase"
                                                    style={{
                                                        background: pill?.bg || "rgba(100,100,100,0.1)",
                                                        color:      pill?.text || "#64748b"
                                                    }}
                                                >
                                                    {result.topic_tag}
                                                </span>
                                            );
                                        })()}
                                        <span className="px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase shadow-neo-convex bg-neo text-slate-500">
                                            {result.cognitive_level}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px shadow-neo-concave rounded-full" />

                                {/* Duplicate Warning */}
                                {result.is_duplicate && (
                                    <div className="bg-neo shadow-neo-concave border-l-4 border-red-500 text-slate-800 p-4 font-bold text-sm rounded-r-xl">
                                        Semantic Duplicate Detected. This concept already exists in the workspace. Database write aborted.
                                    </div>
                                )}

                                {/* Vector matches label */}
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Vector Proximity Matches
                                </p>

                                {result.similar_questions.length === 0 ? (
                                    <div className="px-6 py-8 rounded-2xl shadow-neo-concave text-sm text-slate-400 font-medium text-center">
                                        No historical matches found — first occurrence of this topic.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {result.similar_questions.map((match, idx) => {
                                            const pill = TAG_PILLS[match.topic_tag];
                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-5 rounded-2xl shadow-neo-concave bg-neo flex flex-col gap-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg"
                                                            style={{
                                                                background: pill?.bg || "rgba(100,100,100,0.1)",
                                                                color:      pill?.text || "#64748b"
                                                            }}
                                                        >
                                                            {match.topic_tag}
                                                        </span>
                                                        <span className="text-xs font-mono font-bold text-slate-500">
                                                            {(match.similarity_score * 100).toFixed(1)}% match
                                                        </span>
                                                    </div>
                                                    {/* Score bar */}
                                                    <div className="h-1.5 rounded-full shadow-neo-concave overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width:      scoreToWidth(match.similarity_score),
                                                                background: pill?.text || "#94a3b8"
                                                            }}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                                        {match.text}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
