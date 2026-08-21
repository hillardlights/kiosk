import { ErrorBoundary } from "./components/ErrorBoundary";
import { Home } from "./pages/Home";
import { KioskProvider } from "./state/KioskContext";

export default function App() {
  return (
    <ErrorBoundary>
      <KioskProvider>
        <Home />
      </KioskProvider>
    </ErrorBoundary>
  );
}
