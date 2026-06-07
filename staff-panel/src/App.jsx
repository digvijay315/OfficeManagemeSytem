import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import TaskList from './pages/TaskList';
import FundsViewer from './pages/FundsViewer';
import Overview from './pages/Overview';
import RewardsRevenue from './pages/RewardsRevenue';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {isAuthenticated ? (
          <Route path="/" element={<Dashboard />}>
            <Route index element={<Overview />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="funds" element={<FundsViewer />} />
            <Route path="rewards-revenue" element={<RewardsRevenue />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
