import Sidebar from './components/Sidebar.jsx';
import Viewport from './components/Viewport.jsx';
import { StoreProvider } from './state/StoreContext.jsx';

export default function App() {
  return (
    <StoreProvider>
      <div className="app">
        <Viewport />
        <Sidebar />
      </div>
    </StoreProvider>
  );
}
