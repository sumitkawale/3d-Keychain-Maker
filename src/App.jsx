import HistoryPage from './components/HistoryPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import Viewport from './components/Viewport.jsx';
import { useRoute } from './lib/useRoute.js';
import { StoreProvider } from './state/StoreContext.jsx';

function Screens() {
  const route = useRoute();
  if (route === 'history') return <HistoryPage />;
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
      <Screens />
    </StoreProvider>
  );
}
