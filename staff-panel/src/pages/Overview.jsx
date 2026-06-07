import { useState, useEffect } from 'react';
import { Clock, CheckCircle, IndianRupee, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Overview() {
  const [user, setUser] = useState({});
  const [attendance, setAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [funds, setFunds] = useState({ salary: 0, totalTaken: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    // In a real scenario, we would fetch data here. 
    // Using mock data or simple fetch if backend is available.
    // Assuming backend is at http://localhost:5000 and user has a token
    const fetchData = async () => {
      try {
        const [attRes, tasksRes, fundsRes] = await Promise.all([
          api.get('/staff/attendance/today'),
          api.get('/staff/tasks'),
          api.get('/staff/funds')
        ]);
        
        if(attRes.status === 200) setAttendance(attRes.data);
        if(tasksRes.status === 200) setTasks(tasksRes.data);
        if(fundsRes.status === 200) setFunds(fundsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === getTodayStr());
  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const attendanceStatus = attendance 
    ? (attendance.end_time ? 'Checked Out' : 'Currently Checked In')
    : 'Not Checked In';
  
  const statusColors = {
    'Currently Checked In': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Checked Out': 'bg-blue-100 text-blue-700 border-blue-200',
    'Not Checked In': 'bg-amber-100 text-amber-700 border-amber-200'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-8 shadow-lg">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.name}!</h2>
          <p className="text-emerald-100 max-w-xl">
            Here is what's happening with your attendance, tasks, and finances today. Have a great day at work!
          </p>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 right-32 w-32 h-32 rounded-full bg-emerald-400 opacity-20 blur-xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Attendance Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300 transform">
            <Clock size={64} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Clock size={24} />
            </div>
            <h3 className="font-semibold text-gray-700 text-lg">Today's Attendance</h3>
          </div>
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[attendanceStatus]}`}>
              {attendanceStatus}
            </span>
          </div>
          {attendance?.start_time && (
             <div className="text-sm text-gray-600 flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded-lg">
                <MapPin size={16} className="text-gray-400" />
                <span>In at: <strong>{attendance.start_time}</strong></span>
             </div>
          )}
          <Link to="/attendance" className="inline-block mt-4 text-emerald-600 font-medium text-sm hover:text-emerald-700 hover:underline">
            Manage Attendance &rarr;
          </Link>
        </div>

        {/* Tasks Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300 transform">
            <CheckCircle size={64} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-semibold text-gray-700 text-lg">My Tasks</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-800">{pendingTasks.length}</span>
            <span className="text-gray-500 font-medium">pending</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            You have {todayTasks.length} tasks assigned for today.
          </p>
          <Link to="/tasks" className="inline-block text-blue-600 font-medium text-sm hover:text-blue-700 hover:underline">
            View All Tasks &rarr;
          </Link>
        </div>

        {/* Salary & Funds Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300 transform">
            <IndianRupee size={64} className="text-amber-500" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <IndianRupee size={24} />
            </div>
            <h3 className="font-semibold text-gray-700 text-lg">Finances</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Base Salary</span>
              <span className="font-semibold text-gray-800 flex items-center"><IndianRupee size={14}/> {funds.baseSalary || 0}</span>
            </div>
            {funds.totalRewards > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Rewards</span>
                <span className="font-semibold text-emerald-600 flex items-center">+ <IndianRupee size={14}/> {funds.totalRewards}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Advanced Taken</span>
              <span className="font-semibold text-red-500 flex items-center">- <IndianRupee size={14}/> {funds.totalTaken}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Remaining</span>
              <span className="font-bold text-emerald-600 flex items-center text-lg"><IndianRupee size={16}/> {funds.remaining}</span>
            </div>
          </div>
          <Link to="/funds" className="inline-block mt-4 text-amber-600 font-medium text-sm hover:text-amber-700 hover:underline">
            View Details &rarr;
          </Link>
        </div>

      </div>

      {/* Recent Tasks Section */}
      {pendingTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Action Required
            </h3>
          </div>
          <div className="space-y-4">
            {pendingTasks.slice(0, 3).map(task => (
              <div key={task._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors">
                <div className="mb-2 sm:mb-0">
                  <h4 className="font-semibold text-gray-800">{task.title}</h4>
                  <p className="text-sm text-gray-500 truncate max-w-md">{task.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600">
                    <Calendar size={12} /> {task.date}
                  </span>
                  <Link to="/tasks" className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                    Update
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
