"use client";

import { useState, useEffect } from "react";
import Auth from "../components/Auth";
import Dashboard from "../components/Dashboard";

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E0E5EC]">
                <div className="text-[#1E293B] text-xl font-bold tracking-wide">
                    Initializing Workspace...
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#E0E5EC] transition-all duration-300">
            {isAuthenticated ? (
                <Dashboard />
            ) : (
                <Auth />
            )}
        </main>
    );
}
