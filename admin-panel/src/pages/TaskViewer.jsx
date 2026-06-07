import React, { useState, useEffect } from 'react';
import api from '../api';
import { AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, AlertTriangle, User, Calendar } from 'lucide-react';

export default function TaskViewer() {
  const [groupedTasks, setGroupedTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  
  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [selectedStaff, setSelectedStaff] = useState('');
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'tomorrow', or 'YYYY-MM-DD'

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/admin/staff?limit=1000');
        setStaffList(res.data.data);
      } catch (err) {
        console.error('Error fetching staff');
      }
    };
    fetchStaff();
  }, []);

  const fetchGroupedTasks = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      let query = `/admin/tasks/grouped?page=${pageToFetch}&limit=10`;
      if (selectedStaff) query += `&staff_id=${selectedStaff}`;
      if (dateFilter) query += `&dateFilter=${dateFilter}`;
      
      const res = await api.get(query);
      setGroupedTasks(res.data.data);
      setTotalPages(res.data.pages || 1);
      setPage(res.data.page || 1);
    } catch (err) {
      console.error('Error fetching grouped tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupedTasks(page);
  }, [page, selectedStaff, dateFilter]);

  const toggleRow = (groupId) => {
    setExpandedRows(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle size={28} className="text-indigo-600" /> Task Viewer
            </h2>
            <p className="text-gray-500 text-sm mt-1">Monitor all staff tasks organized by date and person.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <User size={16} className="text-gray-500" />
            <select 
              className="text-sm bg-transparent outline-none text-gray-700 min-w-[150px]"
              value={selectedStaff}
              onChange={(e) => { setSelectedStaff(e.target.value); setPage(1); }}
            >
              <option value="">All Staff Members</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => { setDateFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Dates
            </button>
            <button 
              onClick={() => { setDateFilter('today'); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'today' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Today
            </button>
            <button 
              onClick={() => { setDateFilter('tomorrow'); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'tomorrow' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tomorrow
            </button>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
             <Calendar size={16} className="text-gray-500" />
             <input 
                type="date" 
                value={!['all', 'today', 'tomorrow'].includes(dateFilter) ? dateFilter : ''}
                onChange={(e) => { setDateFilter(e.target.value || 'all'); setPage(1); }}
                className="text-sm bg-transparent outline-none text-gray-700"
             />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-indigo-50 text-indigo-900 border-b border-indigo-100">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Staff Member</th>
                <th className="px-6 py-4 font-semibold w-1/6">Date</th>
                <th className="px-6 py-4 font-semibold w-1/3">Tasks</th>
                <th className="px-6 py-4 font-semibold w-1/4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center mb-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                        Loading tasks...
                    </td>
                </tr>
              ) : groupedTasks.length === 0 ? (
                <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No tasks found matching your filters.
                    </td>
                </tr>
              ) : (
                groupedTasks.map((group) => {
                  const tasks = group.tasks || [];
                  const groupId = `${group.date}-${group.staff_id}`;
                  const isExpanded = !!expandedRows[groupId];
                  const firstTaskTitle = tasks[0]?.title || "No Title";
                  const remainingCount = tasks.length - 1;
                  const allCompleted = tasks.every(t => t.status === 'completed');
                  const hasEmergency = tasks.some(t => t.type === 'emergency' && t.status !== 'completed');

                  return (
                    <React.Fragment key={groupId}>
                      {/* Main Group Row */}
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => toggleRow(groupId)}
                      >
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                {group.staff?.Upload?.pic?.[0] ? (
                                    <img src={group.staff.Upload.pic[0]} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-200">
                                        {group.staff?.name ? group.staff.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-800">{group.staff?.name || 'Unknown Staff'}</p>
                                    <p className="text-xs text-gray-500">{group.staff?.email || ''}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                            {group.date}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <span className={`font-medium ${hasEmergency ? 'text-red-600' : 'text-gray-800'}`}>
                                    {firstTaskTitle}
                                </span>
                                {remainingCount > 0 && (
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                        + {remainingCount} more
                                    </span>
                                )}
                                {hasEmergency && (
                                    <AlertTriangle size={14} className="text-red-500" />
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex justify-between items-center">
                                {allCompleted ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-semibold border border-emerald-200">
                                        <CheckCircle size={14}/> All Completed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-200">
                                        <Clock size={14}/> Pending Actions
                                    </span>
                                )}
                                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                    {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                </div>
                            </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr>
                            <td colSpan="4" className="bg-gray-50/50 p-0 border-b-2 border-indigo-100">
                                <div className="p-6 bg-indigo-50/30 border-l-4 border-indigo-400 m-4 rounded-r-xl shadow-inner">
                                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Detailed Tasks for {group.staff?.name} on {group.date}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {tasks.map(task => (
                                            <div key={task._id} className={`p-4 rounded-xl border ${task.type === 'emergency' ? 'border-red-200 bg-red-50' : 'border-white bg-white'} shadow-sm`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className={`font-bold ${task.type === 'emergency' ? 'text-red-700' : 'text-gray-800'}`}>
                                                    {task.title}
                                                    </h5>
                                                    {task.type === 'emergency' && (
                                                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-md font-bold">Emergency</span>
                                                    )}
                                                    {task.type === 'additional' && (
                                                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-md font-bold">Self Assigned</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                                                
                                                {task.status !== 'completed' ? (
                                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                                        <p className="text-sm text-amber-600 flex items-center gap-1 font-semibold"><Clock size={14}/> Pending</p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 pt-3 border-t border-gray-100">
                                                      <p className="text-sm text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle size={14}/> Completed</p>
                                                      {task.comment && <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded border border-gray-100">"{task.comment}"</p>}
                                                      {task.images && task.images.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                          {task.images.map((img, i) => (
                                                            <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors">
                                                              <img src={img} alt="Task proof" className="w-full h-full object-cover" />
                                                            </a>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-800">{page}</span> of <span className="font-semibold text-gray-800">{totalPages}</span>
                </span>
                <div className="flex gap-2">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}
      </div>

    </div>
  );
}
