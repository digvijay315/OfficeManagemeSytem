import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, ClipboardList, Wallet, Calendar, LogOut, Menu, X, LayoutDashboard, ListPlus, CheckSquare, ChevronDown, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { showConfirm } from '../utils/swalUtils';

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default true
  const navRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      setCanScroll(scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 5);
    }
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }

    if (token && userStr) {
      let userRole = 'admin';
      try {
        userRole = JSON.parse(userStr).role;
      } catch(e) {}

      // Only show fund-related notifications to 'admin'
      if (userRole === 'admin') {
        // 1. Fetch pending requests on mount
        import('../api').then(({ default: api }) => {
          api.get('/admin/funds/requests').then(res => {
            if (res.data && res.data.length > 0) {
              import('sweetalert2').then(({ default: Swal }) => {
                setTimeout(() => {
                  Swal.fire({
                    title: 'Pending Requests!',
                    text: `You have ${res.data.length} pending advance requests waiting for approval.`,
                    icon: 'info',
                    confirmButtonText: 'Got it!',
                    confirmButtonColor: '#4f46e5'
                  });
                  new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.error("Audio error:", e));
                }, 1500);
              });
            }
          }).catch(err => console.error("Error fetching pending requests", err));
        });

        // 2. Setup SSE connection
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        import('../api').then(({ default: api }) => {
          const url = `${api.defaults.baseURL}/admin/notifications/stream?token=${token}`;
          const source = new EventSource(url);
          
          source.addEventListener('advance_request', (e) => {
            try {
              const data = JSON.parse(e.data);
              import('sweetalert2').then(({ default: Swal }) => {
                Swal.fire({
                  title: 'New Advance Request!',
                  text: data.message,
                  icon: 'warning',
                  confirmButtonText: 'Got it!',
                  confirmButtonColor: '#4f46e5'
                });
                new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.error("Audio error:", e));
              });
            } catch(err) {}
          });

          return () => {
            source.close();
          };
        });
      }
    }
    
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirm('Logout', 'Are you sure you want to logout?');
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/subadmins', name: 'Manage Subadmin', icon: <Shield size={20} /> },
    { path: '/staff', name: 'Manage Staff', icon: <Users size={20} /> },
    { path: '/custom-tasks', name: 'Task Library', icon: <ListPlus size={20} /> },
    { path: '/tasks', name: 'Assign Tasks', icon: <ClipboardList size={20} /> },
    { path: '/tasks-view', name: 'View Tasks', icon: <CheckSquare size={20} /> },
    { path: '/task-verification', name: 'Task Verification', icon: <CheckSquare size={20} /> },
    { path: '/revenue-reports', name: 'Revenue & Rewards', icon: <Wallet size={20} />, hideFor: ['subadmin'] },
    { path: '/funds', name: 'Fund Management', icon: <Wallet size={20} />, hideFor: ['subadmin'] },
    { path: '/attendance', name: 'Attendance', icon: <Calendar size={20} /> },
  ].filter(item => !(item.hideFor && item.hideFor.includes(user?.role)));

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
        bg-indigo-900 text-white flex flex-col shadow-xl transition-all duration-300 z-30
      `}>
        <div className={`p-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} border-b border-indigo-800`}>
          <div className={`${!sidebarOpen && 'md:hidden'}`}>
            <h2 className="text-xl font-bold tracking-wider">S. NET Admin</h2>
            <p className="text-indigo-300 text-xs mt-1">Digital Broadband</p>
          </div>
          <h2 className={`text-xl font-bold hidden md:block ${sidebarOpen && 'md:hidden'}`}>A</h2>
        </div>
        
        <div className="relative flex-1 flex flex-col min-h-0 mt-6">
          <nav 
            ref={navRef}
            onScroll={checkScroll}
            className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.name : ''}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'bg-indigo-800 text-white' 
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <div className="min-w-[20px]">{item.icon}</div>
                <span className={`font-medium ${!sidebarOpen && 'md:hidden'}`}>{item.name}</span>
              </Link>
            ))}
          </nav>
          
          {canScroll && sidebarOpen && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-indigo-900 to-transparent pointer-events-none flex items-end justify-center pb-2">
              <ChevronDown size={20} className="text-indigo-300 animate-bounce" />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : ''}
            className={`flex items-center gap-3 w-full px-4 py-3 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer ${!sidebarOpen && 'justify-center'}`}
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
              <div className="h-6 w-1.5 bg-indigo-600 rounded-full mr-3 shadow-sm shadow-indigo-200"></div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 tracking-tight capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '').split('-').join(' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-4">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 uppercase">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-gray-800 leading-tight capitalize">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'admin'}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
