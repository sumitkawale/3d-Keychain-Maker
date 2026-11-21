import HistoryPage from './components/HistoryPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import Viewport from './components/Viewport.jsx';
import { useRoute } from './lib/useRoute.js';
import { PresetsProvider } from './state/PresetsContext.jsx';
import { StoreProvider } from './state/StoreContext.jsx';

function Screens() {
  const route = useRoute();
  if (route === 'history') return <HistoryPage />;
  if (route === 'settings') return <SettingsPage />;
  return (
    <div className="app">
      <Viewport />
      <Sidebar />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <PresetsProvider>
        <Screens />
      </PresetsProvider>
    </StoreProvider>
  );
}
