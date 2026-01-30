import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletContextProvider } from './components/WalletContextProvider';
import { AdminAuthProvider } from './context/AdminAuthContext';
import MissionObserverHero from './components/MissionObserverHero';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';

function App() {
  return (
    <WalletContextProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MissionObserverHero />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/kikydev/LoginAdminDashboard" element={<AdminLoginPage />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </WalletContextProvider>
  );
}

export default App;

