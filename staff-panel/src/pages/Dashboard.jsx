import { Outlet, Link, useLocation } from 'react-router-dom';
import { Clock, CheckSquare, IndianRupee, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    // Note: Logging out stops attendance timer implicitly if they haven't stopped it? 
    // Usually they should manually stop it, but for simple app, we just log them out.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/attendance', name: 'Attendance & Timer', icon: <Clock size={20} /> },
    { path: '/tasks', name: 'My Tasks', icon: <CheckSquare size={20} /> },
    { path: '/funds', name: 'My Salary & Funds', icon: <IndianRupee size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md z-20">
        <h2 className="text-xl font-bold">Staff Portal</h2>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${mobileMenuOpen ? 'flex' : 'hidden'} 
        md:flex flex-col w-full md:w-64 bg-emerald-800 text-white shadow-xl absolute md:relative z-10 h-full
      `}>
        <div className="p-6 hidden md:block border-b border-emerald-700">
          <h2 className="text-2xl font-bold tracking-wider">Staff Portal</h2>
          <p className="text-emerald-300 text-sm mt-1">student.inet</p>
        </div>
        
        <div className="p-6 border-b border-emerald-700">
          <p className="text-sm text-emerald-300">Welcome,</p>
          <p className="text-lg font-semibold">{user.name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? 'bg-emerald-900 text-white' 
                  : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-700 mb-16 md:mb-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 pt-4 md:pt-0">
        <header className="hidden md:flex bg-white shadow-sm border-b border-gray-200 px-8 py-4 justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </h1>
        </header>
        <main className="p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
