import { useState, useEffect } from 'react';
import api from '../api';
import { Users, ClipboardList, AlertCircle, CalendarCheck, BarChart3 } from 'lucide-react';
import { showLoader, closeLoader, showAlert } from '../utils/swalUtils';

export default function Dashboard() {
  const [stats, setStats] = useState({ staffCount: 0, taskCount: 0, attendanceCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      showLoader('Loading Dashboard', 'Fetching latest reports...');
      try {
        const [staffRes, tasksRes, attRes] = await Promise.all([
          api.get('/admin/staff'),
          // We can just fetch all or we'd ideally have a stats API. For simplicity, just fetch existing lists or ignore
          // Since we don't have a dedicated stats endpoint, we just mock or use the existing APIs
          // to get array lengths
          api.get('/admin/staff'), // just for simulation
          api.get('/admin/attendance')
        ]);
        
        setStats({
          staffCount: staffRes.data.total || 0,
          taskCount: 15, // Dummy value since we don't have a "get all tasks" admin API currently
          attendanceCount: attRes.data.total || 0
        });
        closeLoader();
      } catch (err) {
        closeLoader();
        showAlert('Error', 'Failed to load dashboard data', 'error');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-2xl shadow-lg text-white flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <BarChart3 size={28} /> Admin Dashboard
          </h2>
          <p className="text-gray-300">Overview of staff metrics, attendance, and task management.</p>
        </div>
        <div className="hidden md:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm">
          <BarChart3 size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Staff</p>
            <p className="text-3xl font-bold text-gray-800">{stats.staffCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <ClipboardList size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tasks Assigned</p>
            <p className="text-3xl font-bold text-gray-800">{stats.taskCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CalendarCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Today's Attendance</p>
            <p className="text-3xl font-bold text-gray-800">{stats.attendanceCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Emergency Tasks</p>
            <p className="text-3xl font-bold text-gray-800">2</p>
          </div>
        </div>
      </div>
      
      {/* Chart Placeholder Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80 flex flex-col justify-center items-center text-gray-400">
          <p className="font-medium">Attendance Chart</p>
          <p className="text-sm">(Coming soon)</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80 flex flex-col justify-center items-center text-gray-400">
          <p className="font-medium">Task Completion Rate</p>
          <p className="text-sm">(Coming soon)</p>
        </div>
      </div>
    </div>
  );
}
