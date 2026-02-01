import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react';

const AdminLoginPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAdminAuthenticated, adminLogin } = useAdminAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimer, setLockTimer] = useState(0);

    // Check if form should be shown
    const showForm = searchParams.has('formLoginOpen');

    // ... useEffects ...

    // Handle lockout timer
    useEffect(() => {
        if (isLocked && lockTimer > 0) {
            const timer = setInterval(() => {
                setLockTimer(prev => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        setAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isLocked, lockTimer]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) return;

        const success = adminLogin(username, password);

        if (success) {
            setError('');
            navigate('/');
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError('Access denied. Invalid credentials.');
            setPassword('');

            // Lock after 5 failed attempts
            if (newAttempts >= 5) {
                setIsLocked(true);
                setLockTimer(60); // 60 second lockout
            }
        }
    };

    // ... 

    {/* Login Form */ }
    <form onSubmit={handleLogin} className="space-y-4">
        {/* Username Input */}
        <div className="relative">
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin ID"
                disabled={isLocked}
                className={`
                                    w-full bg-black/50 border rounded-lg px-4 py-3
                                    text-white placeholder-zinc-600
                                    focus:outline-none focus:ring-2 transition-all
                                    ${isLocked
                        ? 'border-zinc-800 opacity-50 cursor-not-allowed'
                        : 'border-zinc-700 focus:border-red-500/50 focus:ring-red-500/20'
                    }
                                `}
            />
        </div>

        {/* Password Input */}
        <div className="relative">
            <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access Code"
                disabled={isLocked}
                className={`
                                    w-full bg-black/50 border rounded-lg px-4 py-3 pr-12
                                    text-white placeholder-zinc-600
                                    focus:outline-none focus:ring-2 transition-all
                                    ${isLocked
                        ? 'border-zinc-800 opacity-50 cursor-not-allowed'
                        : 'border-zinc-700 focus:border-red-500/50 focus:ring-red-500/20'
                    }
                                `}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>

        <button
            type="submit"
            disabled={isLocked || !password}
            className={`
                                w-full py-3 rounded-lg font-bold text-sm tracking-wide
                                transition-all duration-300 transform
                                ${isLocked || !password
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98]'
                }
                            `}
        >
            {isLocked ? `LOCKED (${lockTimer}s)` : 'AUTHENTICATE'}
        </button>
    </form>

    {/* Footer */ }
    <div className="mt-6 pt-6 border-t border-zinc-800">
        <p className="text-zinc-600 text-xs text-center">
            Unauthorized access attempts are logged and monitored
        </p>
    </div>
                </div >

    {/* Decorative Elements */ }
    < div className = "absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] text-zinc-700 font-mono" >
                    <span>SYS://NEXUS</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                    <span>SEC-LEVEL-5</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                    <span>v2.0</span>
                </div >
            </div >
        </div >
            </div >
        </div >
    );
};

export default AdminLoginPage;
