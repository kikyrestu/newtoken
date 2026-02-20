import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
    LayoutDashboard,
    Users,
    History,
    Settings,
    Layers,
    LogOut,
    Shield,
    Menu,
    X,
    Home,
    Link2,
    Loader2,
    Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminTransactions from '../components/admin/AdminTransactions';
import AdminSettings from '../components/admin/AdminSettings';
import AdminTierConfig from '../components/admin/AdminTierConfig';
import AdminBlockchainConfig from '../components/admin/AdminBlockchainConfig';
import AdminMissions from '../components/admin/AdminMissions';
import AdminCountdown from '../components/admin/AdminCountdown';

type TabType = 'overview' | 'users' | 'transactions' | 'missions' | 'settings' | 'tiers' | 'blockchain' | 'countdown';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <History size={18} /> },
    { id: 'missions', label: 'Missions', icon: <Layers size={18} /> },
    { id: 'tiers', label: 'Tier Config', icon: <Layers size={18} /> },
    { id: 'blockchain', label: 'Blockchain', icon: <Link2 size={18} /> },
    { id: 'countdown', label: 'Countdown', icon: <Clock size={18} /> },
    { id: 'settings', label: 'Visual Editor', icon: <Settings size={18} /> },
];

export default function AdminDashboard() {
    const { isAdminAuthenticated, adminLogout, isLoading } = useAdminAuth();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Show loading state while verifying token
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#00ff41] mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated
    if (!isAdminAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-4">Admin authentication required</p>
                    <Link
                        to="/admin-login?formLoginOpen"
                        className="inline-block px-6 py-2 bg-[#00ff41] text-black font-bold rounded hover:bg-[#00cc33] transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <AdminOverview />;
            case 'users':
                return <AdminUsers />;
            case 'transactions':
                return <AdminTransactions />;
            case 'missions':
                return <AdminMissions />;
            case 'settings':
                return <AdminSettings />;
            case 'tiers':
                return <AdminTierConfig />;
            case 'blockchain':
                return <AdminBlockchainConfig />;
            case 'countdown':
                return <AdminCountdown />;
            default:
                return <AdminOverview />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white flex">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-black/50 border-r border-[#00ff41]/20 transition-all duration-300 flex flex-col`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-[#00ff41]/20 flex items-center justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-[#00ff41]" />
                            <span className="font-bold text-[#00ff41] tracking-wider">ADMIN</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 hover:bg-[#00ff41]/10 rounded transition-colors"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${activeTab === tab.id
                                ? 'bg-[#00ff41]/20 text-[#00ff41]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.icon}
                            {sidebarOpen && <span className="text-sm font-medium">{tab.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-[#00ff41]/20 space-y-1">
                    <Link
                        to="/"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <Home size={18} />
                        {sidebarOpen && <span className="text-sm font-medium">Back to App</span>}
                    </Link>
                    <button
                        onClick={adminLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={18} />
                        {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Header */}
                <header className="bg-black/30 border-b border-[#00ff41]/20 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                        </h1>
                        <p className="text-sm text-gray-500">Mission Launchpad Admin Panel</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
                            <span>System Online</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
