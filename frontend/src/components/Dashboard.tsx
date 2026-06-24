import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, BarChart3, Clock, User, LogOut, Search } from 'lucide-react';

interface HistoryItem {
  _id: string;
  email: string;
  text: string;
  category: string;
  confidence_score: number;
  is_allowed: boolean;
  timestamp: string;
}

export default function ProductionDashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data hook tracking current authenticated user history logs
    async function fetchDashboardData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/history`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Dashboard synchronization failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  // Compute live analytical indicators
  const totalQueries = history.length;
  const allowedQueries = history.filter(item => item.is_allowed).length;
  const rejectedQueries = history.filter(item => !item.is_allowed).length;
  const avgConfidence = totalQueries > 0 
    ? (history.reduce((acc, curr) => acc + curr.confidence_score, 0) / totalQueries * 100).toFixed(1) 
    : "0";

  const filteredHistory = history.filter(item => 
    item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Modern Global Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xl tracking-wider text-white">C</div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">COGNATE</span>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium">Production v1.1</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">{history[0]?.email || "Authenticated Operator"}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric Analytics Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Total Classifications</span>
              <BarChart3 className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{totalQueries}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Domain Authorized</span>
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-400">{allowedQueries}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">OOD Intercepted</span>
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-rose-400">{rejectedQueries}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Mean Vector Match</span>
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{avgConfidence}%</div>
          </div>
        </div>

        {/* Core Workspace Frame Container */}
        <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
          {/* Header Controls Block */}
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">System Logs & Transactional Audits</h2>
              <p className="text-sm text-slate-400">Real-time telemetry tracking evaluation requests from the Vercel edge client.</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search history schema..." 
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tabular Layout Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Input Query String</th>
                  <th className="py-4 px-6">Assigned Routing</th>
                  <th className="py-4 px-6">Proximity Match</th>
                  <th className="py-4 px-6">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-500 font-medium">
                      No matching records found in database collection cluster.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6 max-w-md font-medium text-slate-200 truncate">{item.text}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide ${
                          item.category === 'OUT OF DOMAIN' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-300">
                        {(item.confidence_score * 100).toFixed(2)}%
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          item.is_allowed ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.is_allowed ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          {item.is_allowed ? 'Passed' : 'Intercepted'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
