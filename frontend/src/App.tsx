import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletContextProvider } from './components/WalletContextProvider';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import MissionObserverHero from './components/MissionObserverHero';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import { Footer } from './components/Footer';

function App() {
  return (
    <ErrorBoundary>
      <WalletContextProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<div className="flex flex-col min-h-screen"><MissionObserverHero /><Footer /></div>} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/kikydev/LoginAdminDashboard" element={<AdminLoginPage />} />
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </WalletContextProvider>
    </ErrorBoundary>
  );
}

export default App;

