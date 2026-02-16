import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Admin Auth Context Types
interface AdminInfo {
    id: number;
    username: string;
    role: string;
}

interface AdminAuthContextType {
    isAdminAuthenticated: boolean;
    adminToken: string | null;
    adminInfo: AdminInfo | null;
    adminLogin: (username: string, password: string) => Promise<boolean>;
    adminLogout: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Storage keys with obscure prefix
const AUTH_TOKEN_KEY = '_nexus_admin_auth_token_v2';
const AUTH_INFO_KEY = '_nexus_admin_info_v2';

// Provider Component
export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdminAuthenticated = !!adminToken;

    // Verify token with backend on mount
    useEffect(() => {
        const verifyToken = async () => {
            const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

            if (!storedToken) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Admin-Token': storedToken,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setAdminToken(storedToken);
                    setAdminInfo(data.admin);
                } else {
                    // Token invalid or expired, clean up
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    localStorage.removeItem(AUTH_INFO_KEY);
                }
            } catch (err) {
                console.error('Token verification failed:', err);
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem(AUTH_INFO_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    // Periodic token verification (every 5 minutes)
    useEffect(() => {
        if (!adminToken) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Admin-Token': adminToken,
                    },
                });

                if (!response.ok) {
                    // Token expired, logout
                    setAdminToken(null);
                    setAdminInfo(null);
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    localStorage.removeItem(AUTH_INFO_KEY);
                }
            } catch (err) {
                console.error('Token check failed:', err);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [adminToken]);

    /**
     * Login via backend API
     */
    const adminLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token securely
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(data.admin));

                setAdminToken(data.token);
                setAdminInfo(data.admin);
                return true;
            } else {
                setError(data.error || 'Login failed');
                return false;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Network error. Please try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Logout via backend API
     */
    const adminLogout = useCallback(async (): Promise<void> => {
        if (adminToken) {
            try {
                await fetch(`${API_BASE_URL}/admin/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-Admin-Token': adminToken,
                    },
                });
            } catch (err) {
                console.error('Logout error:', err);
            }
        }

        // Clear local state regardless of API response
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_INFO_KEY);
        setAdminToken(null);
        setAdminInfo(null);
    }, [adminToken]);

    return (
        <AdminAuthContext.Provider value={{
            isAdminAuthenticated,
            adminToken,
            adminInfo,
            adminLogin,
            adminLogout,
            isLoading,
            error,
        }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

// Hook to use admin auth
export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        // Return safe defaults if used outside provider
        return {
            isAdminAuthenticated: false,
            adminToken: null,
            adminInfo: null,
            adminLogin: async () => false,
            adminLogout: async () => { },
            isLoading: false,
            error: null,
        };
    }
    return context;
};

export default AdminAuthProvider;
