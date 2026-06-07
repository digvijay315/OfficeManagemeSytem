import { useState, useEffect } from 'react';
import api from '../api';
import { Users, ClipboardList, AlertCircle, CalendarCheck, BarChart3 } from 'lucide-react';
import { showLoader, closeLoader, showAlert } from '../utils/swalUtils';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ staffCount: 0, taskCount: 0, attendanceCount: 0, emergencyCount: 0 });
  const [charts, setCharts] = useState({ attendance: [], taskCompletion: [] });

  useEffect(() => {
    const fetchStats = async () => {
      showLoader('Loading Dashboard', 'Fetching latest reports...');
      try {
        const res = await api.get('/admin/dashboard-stats');
        setStats({
          staffCount: res.data.staffCount || 0,
          taskCount: res.data.taskCount || 0,
          attendanceCount: res.data.attendanceCount || 0,
          emergencyCount: res.data.emergencyCount || 0
        });
        setCharts(res.data.charts || { attendance: [], taskCompletion: [] });
        closeLoader();
      } catch (err) {
        closeLoader();
        showAlert('Error', 'Failed to load dashboard data', 'error');
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

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
            <p className="text-sm font-medium text-gray-500">Today's Tasks</p>
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
            <p className="text-3xl font-bold text-gray-800">{stats.emergencyCount}</p>
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Attendance (Last 7 Days)</h3>
          <div className="flex-1 w-full min-h-0">
            {charts.attendance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.attendance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="Attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No attendance data</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Task Completion Rate (Last 7 Days)</h3>
          <div className="flex-1 w-full min-h-0">
            {charts.taskCompletion.length > 0 && charts.taskCompletion.some(c => c.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.taskCompletion}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.taskCompletion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No task data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
