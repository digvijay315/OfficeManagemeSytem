import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/StaffManagement';
import TaskAssignment from './pages/TaskAssignment';
import FundManagement from './pages/FundManagement';
import AttendanceViewer from './pages/AttendanceViewer';
import CustomTasks from './pages/CustomTasks';
import TaskViewer from './pages/TaskViewer';
import TaskVerification from './pages/TaskVerification';
import RevenueReports from './pages/RevenueReports';
import SubadminManagement from './pages/SubadminManagement';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {isAuthenticated ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="subadmins" element={<SubadminManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="custom-tasks" element={<CustomTasks />} />
            <Route path="tasks" element={<TaskAssignment />} />
            <Route path="tasks-view" element={<TaskViewer />} />
            <Route path="task-verification" element={<TaskVerification />} />
            <Route path="revenue-reports" element={<RevenueReports />} />
            <Route path="funds" element={<FundManagement />} />
            <Route path="attendance" element={<AttendanceViewer />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
