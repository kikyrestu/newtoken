import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletContextProvider } from './components/WalletContextProvider';
import MissionObserverHero from './components/MissionObserverHero';
import AdminDashboard from './pages/AdminDashboard';
import { JupiterSwapModal } from './components/JupiterSwap'; // Ensure this is imported if used, or handle modal logic inside pages

function App() {
  return (
    <WalletContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MissionObserverHero />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </WalletContextProvider>
  );
}

export default App;
