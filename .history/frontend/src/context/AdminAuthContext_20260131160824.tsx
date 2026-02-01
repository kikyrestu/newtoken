import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Admin Auth Context Types
interface AdminAuthContextType {
    isAdminAuthenticated: boolean;
    adminToken: string | null;
    adminLogin: (username: string, password: string) => boolean;
    adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Admin credentials - requested by user
const ADMIN_USERNAME = 'adminDev';
const ADMIN_PASSWORD = 'V4n7An3w70|<3n';

// Generate a simple auth token
const generateToken = () => {
    return `nexus_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Provider Component
export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
    const [adminToken, setAdminToken] = useState<string | null>(() => {
        // Check if valid token exists on mount
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

        if (token && timestamp) {
            const tokenAge = Date.now() - parseInt(timestamp, 10);
            if (tokenAge < TOKEN_EXPIRY_MS) {
                return token;
            } else {
                // Token expired, clean up
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem(AUTH_TIMESTAMP_KEY);
            }
        }
        return null;
    });

    const isAdminAuthenticated = !!adminToken;

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

    const adminLogin = (username: string, password: string): boolean => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const token = generateToken();
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
            setAdminToken(token);
            return true;
        }
        return false;
    };

    const adminLogout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
        setAdminToken(null);
    };

    return (
        <AdminAuthContext.Provider value={{
            isAdminAuthenticated,
            adminToken,
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
            adminToken: null,
            adminLogin: () => false,
            adminLogout: () => { }
        };
    }
    return context;
};

export default AdminAuthProvider;
