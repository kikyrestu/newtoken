import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '../../hooks/useAdminApi';
import { Search, ChevronLeft, ChevronRight, Unlock } from 'lucide-react';

interface Transaction {
    id: number;
    tier: string;
    amount: number;
    usd_value_at_lock: number;
    status: string;
    lock_timestamp: string;
    unlock_timestamp: string;
    tx_signature: string;
    created_at: string;
    user_wallet?: {
        wallet_address: string;
    };
}

interface PaginatedData {
    data: Transaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AdminTransactions() {
    const { getTransactions, forceUnlock, loading } = useAdminApi();
    const [transactions, setTransactions] = useState<PaginatedData | null>(null);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<{ status?: string; tier?: string; search?: string }>({});
    const [unlocking, setUnlocking] = useState<number | null>(null);

    const fetchTransactions = useCallback(async () => {
        const data = await getTransactions(page, filters);
        if (data) setTransactions(data);
    }, [page, filters, getTransactions]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleForceUnlock = async (id: number) => {
        if (!confirm('Are you sure you want to force unlock this transaction?')) return;

        setUnlocking(id);
        const success = await forceUnlock(id);
        if (success) {
            fetchTransactions();
        }
        setUnlocking(null);
    };

    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    const formatTokens = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    };
    const formatUsd = (value: number | string | null | undefined) => {
        const num = Number(value) || 0;
        return `$${num.toFixed(2)}`;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            locked: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            unlocked: 'bg-green-500/20 text-green-400 border-green-500/30',
            claimed: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
        return (
            <span className={`px-2 py-0.5 text-xs rounded border ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
                {status}
            </span>
        );
    };

    const getTierBadge = (tier: string) => {
        const colors: Record<string, string> = {
            spectator: 'text-blue-400',
            operator: 'text-purple-400',
            elite: 'text-[#00ff41]'
        };
        return <span className={`font-medium ${colors[tier] || 'text-gray-400'}`}>{tier}</span>;
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search wallet..."
                        value={filters.search || ''}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41]/50"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
                    className="px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                >
                    <option value="">All Status</option>
                    <option value="locked">Locked</option>
                    <option value="unlocked">Unlocked</option>
                    <option value="claimed">Claimed</option>
                </select>

                {/* Tier Filter */}
                <select
                    value={filters.tier || ''}
                    onChange={(e) => setFilters(f => ({ ...f, tier: e.target.value || undefined }))}
                    className="px-3 py-2 bg-black/40 border border-[#00ff41]/20 rounded-lg text-white focus:outline-none focus:border-[#00ff41]/50"
                >
                    <option value="">All Tiers</option>
                    <option value="spectator">Spectator</option>
                    <option value="operator">Operator</option>
                    <option value="elite">Elite</option>
                </select>

                <span className="text-sm text-gray-500">
                    {transactions?.total || 0} transactions
                </span>
            </div>

            {/* Table */}
            <div className="bg-black/40 border border-[#00ff41]/10 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="border-b border-[#00ff41]/10">
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Wallet</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tier</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">USD</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unlock At</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
                            </tr>
                        ) : transactions?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">No transactions found</td>
                            </tr>
                        ) : (
                            transactions?.data?.map((tx) => (
                                <tr key={tx.id} className="border-b border-[#00ff41]/5 hover:bg-[#00ff41]/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <code className="text-sm text-[#00ff41] font-mono">
                                            {tx.user_wallet ? formatAddress(tx.user_wallet.wallet_address) : 'N/A'}
                                        </code>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{getTierBadge(tx.tier)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-white">{formatTokens(tx.amount)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-400">${tx.usd_value_at_lock.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center">{getStatusBadge(tx.status)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(tx.unlock_timestamp)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {tx.status === 'locked' && (
                                            <button
                                                onClick={() => handleForceUnlock(tx.id)}
                                                disabled={unlocking === tx.id}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                                            >
                                                <Unlock className="w-3 h-3" />
                                                {unlocking === tx.id ? 'Unlocking...' : 'Force Unlock'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {transactions && transactions.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Page {transactions.current_page} of {transactions.last_page}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-black/40 border border-[#00ff41]/20 rounded hover:bg-[#00ff41]/10 disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(transactions.last_page, p + 1))}
                            disabled={page === transactions.last_page}
                            className="p-2 bg-black/40 border border-[#00ff41]/20 rounded hover:bg-[#00ff41]/10 disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
