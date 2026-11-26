import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Users, ClipboardList, AlertCircle, CalendarCheck, BarChart3, 
  Zap, Receipt, FolderPlus, PlusCircle, UserPlus, CheckSquare, X 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { showLoader, closeLoader, showAlert } from '../utils/swalUtils';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ staffCount: 0, taskCount: 0, attendanceCount: 0, emergencyCount: 0 });
  const [charts, setCharts] = useState({ attendance: [], taskCompletion: [] });
  const [staffList, setStaffList] = useState([]);

  // Quick Action: Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    reason: '',
    staff_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

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

    const fetchStaff = async () => {
      try {
        const res = await api.get('/admin/staff?limit=100');
        setStaffList(res.data.data || []);
      } catch (err) {
        console.error('Error fetching staff list');
      }
    };

    fetchStats();
    fetchStaff();
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.reason.trim() || !expenseForm.amount) {
      showAlert('Validation Error', 'Please enter reason and amount', 'warning');
      return;
    }

    showLoader('Saving Expense', 'Recording expense in records...');
    try {
      const payload = {
        reason: expenseForm.reason.trim(),
        amount: Number(expenseForm.amount),
        date: expenseForm.date
      };
      if (expenseForm.staff_id && expenseForm.staff_id !== 'none') {
        payload.staff_id = expenseForm.staff_id;
      }
      await api.post('/admin/expenses', payload);
      closeLoader();
      showAlert('Success', 'Expense recorded successfully!', 'success');
      setIsExpenseModalOpen(false);
      setExpenseForm({ reason: '', staff_id: '', amount: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      closeLoader();
      showAlert('Error', err.response?.data?.error || 'Failed to save expense', 'error');
    }
  };

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

      {/* Top 4 Stats Cards */}
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

      {/* Quick Actions Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">Quick Actions</h3>
              <p className="text-xs text-gray-400">Direct shortcuts for frequent admin operations</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Add New Expense (Opens Modal) */}
          <button
            onClick={() => {
              setExpenseForm({ reason: '', staff_id: '', amount: '', date: new Date().toISOString().split('T')[0] });
              setIsExpenseModalOpen(true);
            }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-100/70 text-rose-700 hover:border-rose-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <Receipt size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-rose-700 text-center">Add Expense</span>
            <span className="text-[10px] text-gray-500 text-center mt-0.5">Record office spend</span>
          </button>

          {/* 2. New Project */}
          <Link
            to="/projects"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-100/70 text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <FolderPlus size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-indigo-700 text-center">New Project</span>
            <span className="text-[10px] text-gray-500 text-center mt-0.5">CCTV / IT / Web</span>
          </Link>

          {/* 3. Assign Task */}
          <Link
            to="/tasks"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-100/70 text-blue-700 hover:border-blue-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <PlusCircle size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-blue-700 text-center">Assign Task</span>
            <span className="text-[10px] text-gray-500 text-center mt-0.5">To staff / tech</span>
          </Link>

          {/* 4. New Lead */}
          <Link
            to="/leads"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-100/70 text-amber-700 hover:border-amber-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <UserPlus size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-amber-700 text-center">New Lead</span>
            <span className="text-[10px] text-gray-500 text-center mt-0.5">Customer inquiry</span>
          </Link>

          {/* 5. Verify Tasks */}
          <Link
            to="/task-verification"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-100/70 text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <CheckSquare size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 text-center">Verify Tasks</span>
            <span className="text-[10px] text-gray-500 text-center mt-0.5">Approve rewards</span>
          </Link>

          {/* 6. Manage Staff */}
          <Link
            to="/staff"
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-100/70 text-purple-700 hover:border-purple-300 transition-all cursor-pointer group shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-purple-700 text-center">Manage Staff</span>
            <span className="text-[10px] text-gray-500 text-center mt-0.5">Add & attendance</span>
          </Link>
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

      {/* ADD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add New Expense</h3>
                  <p className="text-xs text-gray-500">Record an office or staff expense</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expense Reason / Description <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Petrol allowance, Cable purchase, Office tea"
                  value={expenseForm.reason}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="e.g. 500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Staff / Person (Optional)
                  </label>
                  <select 
                    value={expenseForm.staff_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, staff_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                  >
                    <option value="">Self / Office</option>
                    {staffList.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-200 transition cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
