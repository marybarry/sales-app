import "./App.css";
import { Dashboard } from "./components/Dashboard";
import { LoginForm } from "./components/LoginForm";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppContent() {
  const { user } = useAuth();

  return <div className="app">{user ? <Dashboard /> : <LoginForm />}</div>;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
