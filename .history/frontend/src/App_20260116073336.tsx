import { WalletContextProvider } from './components/WalletContextProvider';
import MissionObserverHero from './components/MissionObserverHero';

function App() {
  return (
    <WalletContextProvider>
      <MissionObserverHero />
    </WalletContextProvider>
  );
}

export default App;
