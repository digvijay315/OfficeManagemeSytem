import { Outlet, Link, useLocation } from 'react-router-dom';
import { Clock, CheckSquare, IndianRupee, LogOut, Menu, LayoutDashboard, X, Gift } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/attendance', name: 'Attendance & Timer', icon: <Clock size={20} /> },
    { path: '/tasks', name: 'My Tasks', icon: <CheckSquare size={20} /> },
    { path: '/rewards-revenue', name: 'My Rewards', icon: <Gift size={20} /> },
    { path: '/funds', name: 'My Salary & Funds', icon: <IndianRupee size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-20'} 
        fixed md:static inset-y-0 left-0
        bg-emerald-800 text-white flex flex-col shadow-xl transition-all duration-300 z-30
      `}>
        <div className={`p-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} border-b border-emerald-700`}>
          <div className={`${!sidebarOpen && 'md:hidden'}`}>
            <h2 className="text-xl font-bold tracking-wider">S. NET Staff</h2>
            <p className="text-emerald-300 text-xs mt-1">Digital Broadband</p>
          </div>
          <h2 className={`text-xl font-bold hidden md:block ${sidebarOpen && 'md:hidden'}`}>S</h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={!sidebarOpen ? item.name : ''}
              onClick={() => { if(window.innerWidth < 768) setSidebarOpen(false) }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                location.pathname === item.path 
                  ? 'bg-emerald-900 text-white' 
                  : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
              }`}
            >
              <div className="min-w-[20px]">{item.icon}</div>
              <span className={`font-medium ${!sidebarOpen && 'md:hidden'}`}>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-700">
          <button 
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : ''}
            className={`flex items-center gap-3 w-full px-4 py-3 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer ${!sidebarOpen && 'justify-center'}`}
          >
            <div className="min-w-[20px]"><LogOut size={20} /></div>
            <span className={`font-medium ${!sidebarOpen && 'md:hidden'}`}>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex justify-between items-center px-4 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="hidden sm:flex items-center">
              <div className="h-6 w-1.5 bg-emerald-600 rounded-full mr-3 shadow-sm shadow-emerald-200"></div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 tracking-tight capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '').split('-').join(' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-4">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="block">
              <p className="text-sm font-bold text-gray-800 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
