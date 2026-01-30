import { useState } from 'react';
import { LayoutDashboard, Users, Activity, LogOut, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    // Mock Auth State (Temporary)
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded check for demo
        if (password === 'admin123') {
            setIsAuthenticated(true);
        } else {
            alert('Invalid Password');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#051505]/90 border border-[#4fffa0]/30 rounded-xl p-8 backdrop-blur-md shadow-[0_0_50px_rgba(79,255,160,0.1)]">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-[#4fffa0]/10 rounded-full">
                            <Lock className="w-8 h-8 text-[#4fffa0]" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-white mb-6">Admin Access</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Access Code"
                                className="w-full bg-black/50 border border-[#4fffa0]/20 rounded-lg px-4 py-3 text-white focus:border-[#4fffa0] focus:outline-none focus:ring-1 focus:ring-[#4fffa0] transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#4fffa0] hover:bg-[#3ddb8b] text-black font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(79,255,160,0.3)]"
                        >
                            Unlock Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#4fffa0]/10 bg-[#051505]/95 backdrop-blur-xl hidden md:flex flex-col">
                <div className="p-6 border-b border-[#4fffa0]/10">
                    <h1 className="text-xl font-bold text-[#4fffa0] tracking-wider flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        NEXUS ADMIN
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#4fffa0]/10 text-[#4fffa0] border border-[#4fffa0]/20 rounded-lg font-medium transition-all">
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <Users className="w-4 h-4" />
                        Users & Wallets
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <Activity className="w-4 h-4" />
                        Transactions
                    </button>
                </nav>

                <div className="p-4 border-t border-[#4fffa0]/10">
                    <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#4fffa0] transition-colors">
                        <LogOut className="w-4 h-4" />
                        Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b border-[#4fffa0]/10 bg-[#051505]/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="font-semibold text-white">Dashboard Overview</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-[#4fffa0] px-3 py-1 bg-[#4fffa0]/10 rounded-full border border-[#4fffa0]/20 animate-pulse">
                            ● SYSTEM ONLINE
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Revenue', value: '$0.00', icon: '$' },
                            { label: 'Total Users', value: '0', icon: 'Active' },
                            { label: 'Tokens Locked', value: '0 NEW', icon: '🔒' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#0f1216] border border-[#4fffa0]/10 rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Activity className="w-24 h-24 text-[#4fffa0]" />
                                </div>
                                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
                                <div className="mt-4 flex items-center text-xs text-[#4fffa0]">
                                    <span className="bg-[#4fffa0]/10 px-2 py-0.5 rounded mr-2">+0%</span>
                                    vs last month
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Placeholder for Data Table */}
                    <div className="bg-[#0f1216] border border-[#4fffa0]/10 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Connecting to Backend API...</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
