import { Outlet, Link, useLocation } from 'react-router-dom';
import { Clock, CheckSquare, IndianRupee, LogOut, Menu, LayoutDashboard, X, Gift, ChevronDown, User as UserIcon, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import ProfileModal from '../components/ProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function Dashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      import('../api').then(({ default: api }) => {
        // 1. Fetch profile and tasks on mount to check for pending tasks and new rewards
        Promise.all([
          api.get('/staff/profile'),
          api.get('/staff/tasks')
        ]).then(([profileRes, tasksRes]) => {
          const profile = profileRes.data;
          const tasks = tasksRes.data;

          if (tasks && tasks.length > 0) {
            const pendingTasks = tasks.filter(t => t.status === 'pending');
            
            const rewardedTasks = tasks.filter(t => t.verificationStatus === 'verified' && t.rewardAmount > 0);
            const lastSeenRewardCount = profile.lastSeenRewardCount || 0;
            const newRewards = rewardedTasks.length - lastSeenRewardCount;

            if (pendingTasks.length > 0 || newRewards > 0) {
              import('sweetalert2').then(({ default: Swal }) => {
                setTimeout(() => {
                  let message = '';
                  if (pendingTasks.length > 0) message += `You have <b>${pendingTasks.length} pending task(s)</b> to complete.<br/><br/>`;
                  if (newRewards > 0) {
                    message += `<span style="color:#059669; font-weight:bold;">You received rewards for ${newRewards} task(s)! 🎉</span>`;
                    // Update the backend
                    api.put('/staff/update-reward-count', { count: rewardedTasks.length }).catch(e => console.error(e));
                  }

                  Swal.fire({
                    title: 'Updates for You!',
                    html: message,
                    icon: 'info',
                    confirmButtonText: 'Got it!',
                    confirmButtonColor: '#059669'
                  });
                  new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.error("Audio error:", e));
                }, 1500);
              });
            }
          }
        }).catch(err => console.error("Error fetching data", err));

        // 2. Setup SSE Connection
        const url = `${api.defaults.baseURL}/staff/notifications/stream?token=${token}`;
        const source = new EventSource(url);
        
        source.addEventListener('new_task', (e) => {
          try {
            const data = JSON.parse(e.data);
            import('sweetalert2').then(({ default: Swal }) => {
              Swal.fire({
                title: 'New Task Assigned!',
                text: data.message,
                icon: 'info',
                confirmButtonText: 'Got it!',
                confirmButtonColor: '#059669' // emerald-600
              });
              new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.error("Audio error:", e));
            });
          } catch(err) {}
        });

        source.addEventListener('reward_received', (e) => {
          try {
            const data = JSON.parse(e.data);
            import('sweetalert2').then(({ default: Swal }) => {
              Swal.fire({
                title: 'Reward Received! 🎉',
                text: data.message,
                icon: 'success',
                confirmButtonText: 'Awesome!',
                confirmButtonColor: '#059669'
              });
              new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.error("Audio error:", e));
            });
          } catch(err) {}
        });

        return () => source.close();
      });
    }
  }, []);

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

          <div className="flex items-center gap-3 pr-4 relative z-50">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition-colors cursor-pointer">
              {user.Upload?.pic?.length > 0 ? (
                <img src={user.Upload.pic[0]} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-emerald-200" />
              ) : (
                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                <div className="absolute top-full right-4 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <button onClick={() => { setProfileModalOpen(true); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center gap-2 cursor-pointer">
                    <UserIcon size={16} /> Profile
                  </button>
                  <button onClick={() => { setPasswordModalOpen(true); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center gap-2 cursor-pointer">
                    <Key size={16} /> Change Password
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>

      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
}
