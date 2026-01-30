import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Admin Auth Context Types
interface AdminAuthContextType {
    isAdminAuthenticated: boolean;
    adminLogin: (password: string) => boolean;
    adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Storage keys with obscure prefix
const AUTH_TOKEN_KEY = '_nexus_admin_auth_token_v1';
const AUTH_TIMESTAMP_KEY = '_nexus_admin_auth_ts';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Admin password - can be changed
const ADMIN_PASSWORD = 'admin123';

// Generate a simple auth token
const generateToken = () => {
    return `nexus_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Provider Component
export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
        // Check if valid token exists on mount
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

        if (token && timestamp) {
            const tokenAge = Date.now() - parseInt(timestamp, 10);
            if (tokenAge < TOKEN_EXPIRY_MS) {
                return true;
            } else {
                // Token expired, clean up
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem(AUTH_TIMESTAMP_KEY);
            }
        }
        return false;
    });

    // Check token expiry periodically
    useEffect(() => {
        const checkExpiry = () => {
            const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
            if (timestamp) {
                const tokenAge = Date.now() - parseInt(timestamp, 10);
                if (tokenAge >= TOKEN_EXPIRY_MS) {
                    adminLogout();
                }
            }
        };

        const interval = setInterval(checkExpiry, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const adminLogin = (password: string): boolean => {
        if (password === ADMIN_PASSWORD) {
            const token = generateToken();
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
            setIsAdminAuthenticated(true);
            return true;
        }
        return false;
    };

    const adminLogout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
        setIsAdminAuthenticated(false);
    };

    return (
        <AdminAuthContext.Provider value={{
            isAdminAuthenticated,
            adminLogin,
            adminLogout
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
            adminLogin: () => false,
            adminLogout: () => { }
        };
    }
    return context;
};

export default AdminAuthProvider;
