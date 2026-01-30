import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
    id: number;
    wallet_address: string;
    created_at: string;
    lock_transactions_count: number;
    total_locked: number | null;
}

interface PaginatedData {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AdminUsers() {
    const { getUsers, loading } = useAdminApi();
    const [users, setUsers] = useState<PaginatedData | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = useCallback(async () => {
        const data = await getUsers(page, debouncedSearch);
        if (data) setUsers(data);
    }, [page, debouncedSearch, getUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTokens = (amount: number | null) => {
        if (!amount) return '0';
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search wallet address..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41]/50"
                    />
                </div>
                <span className="text-sm text-gray-500">
                    {users?.total || 0} total users
                </span>
            </div>

            {/* Table */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#00ff41]/10">
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Locks</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Locked</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td>
                            </tr>
                        ) : users?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500">No users found</td>
                            </tr>
                        ) : (
                            users?.data?.map((user) => (
                                <tr key={user.id} className="border-b border-[#00ff41]/5 hover:bg-[#00ff41]/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <code className="text-sm text-[#00ff41] font-mono">
                                            {formatAddress(user.wallet_address)}
                                        </code>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-[#00ff41]/10 text-[#00ff41] text-sm rounded">
                                            {user.lock_transactions_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-white font-medium">
                                        {formatTokens(user.total_locked)} $TOKE
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {users && users.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Page {users.current_page} of {users.last_page}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-black/40 border border-[#00ff41]/20 rounded hover:bg-[#00ff41]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(users.last_page, p + 1))}
                            disabled={page === users.last_page}
                            className="p-2 bg-black/40 border border-[#00ff41]/20 rounded hover:bg-[#00ff41]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
