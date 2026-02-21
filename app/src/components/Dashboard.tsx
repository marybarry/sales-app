import { useAuth } from "../context/AuthContext";
import { DealCardList } from "./DealCardList";

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Active Deals</h1>
        <button onClick={logout} className="btn-secondary">
          Logout
        </button>
      </div>

      <div className="welcome-card">
        <h2>Welcome, {user?.name}!</h2>
        <p className="info">Manage and track all customer onboarding deals</p>
        <DealCardList />
      </div>
    </div>
  );
};
