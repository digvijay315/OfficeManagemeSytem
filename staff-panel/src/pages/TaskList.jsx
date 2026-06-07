import React, { useState, useEffect } from 'react';
import api from '../api';
import { AlertCircle, CheckCircle, Clock, PlusCircle, ChevronDown, ChevronUp, AlertTriangle, Plus, X } from 'lucide-react';
import Swal from 'sweetalert2';

const TaskCard = ({ task, onComplete }) => {
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('none');
  const [paymentSlips, setPaymentSlips] = useState([]);

  return (
    <div className={`p-4 rounded-xl border ${task.type === 'emergency' ? 'border-red-200 bg-red-50' : 'border-white bg-white'} shadow-sm`}>
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
        <div className="mt-4 space-y-3">
          <input 
            type="text" 
            placeholder="Add comment (optional)" 
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <input 
            type="file" 
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none border border-gray-200 rounded-lg cursor-pointer"
          />
          <button 
            disabled={isUploading}
            onClick={() => {
              if (task.type === 'additional') {
                setIsUploading(true);
                onComplete(task._id, { comment, files }).finally(() => setIsUploading(false));
              } else {
                setShowCompleteModal(true);
              }
            }}
            className={`w-full py-2 rounded-lg text-white text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-70 ${task.type === 'emergency' ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200'}`}
          >
            {isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> : <CheckCircle size={16} />}
            {isUploading ? 'Uploading...' : 'Mark as Completed'}
          </button>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-sm text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle size={14}/> Completed</p>
          {task.paymentAmount > 0 && (
            <p className="text-xs text-gray-700 mt-1 font-medium bg-gray-50 px-2 py-1 rounded">
              Payment Collected: ₹{task.paymentAmount} ({task.paymentMode})
            </p>
          )}
          {task.comment && <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded border border-gray-100">"{task.comment}"</p>}
          {task.images && task.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {task.images.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                  <img src={img} alt="Task proof" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
          {task.paymentSlipUrls && task.paymentSlipUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-blue-600 font-semibold w-full block">Payment Slips:</span>
              {task.paymentSlipUrls.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noreferrer" className="block relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                  <img src={img} alt="Payment slip" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Complete Task</h3>
            <p className="text-sm text-gray-500 mb-4">Did you collect any payment from the customer?</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Collected (₹)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              {Number(paymentAmount) > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Mode</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                  >
                    <option value="none">Select Mode</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              )}

              {paymentMode === 'online' && Number(paymentAmount) > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Payment Slips</label>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={(e) => setPaymentSlips(Array.from(e.target.files))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <button 
                type="button" 
                disabled={isUploading}
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setIsUploading(true);
                  await onComplete(task._id, { comment, files, paymentAmount, paymentMode, paymentSlips });
                  setIsUploading(false);
                  setShowCompleteModal(false);
                }}
                disabled={isUploading}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex justify-center items-center"
              >
                {isUploading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TaskList() {
  const [groupedTasks, setGroupedTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [newFiles, setNewFiles] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchGroupedTasks = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/staff/tasks/grouped?page=${pageToFetch}&limit=10`);
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
  }, [page]);

  const handleComplete = async (taskId, data) => {
    try {
      const { comment, files, paymentAmount, paymentMode, paymentSlips } = data;
      let imageUrls = [];
      let paymentSlipUrls = [];

      if (files && files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const uploadRes = await api.post('/upload/upload-files', formData);
        if (uploadRes.data.success) {
          imageUrls = uploadRes.data.urls;
        }
      }

      if (paymentSlips && paymentSlips.length > 0) {
        const slipData = new FormData();
        paymentSlips.forEach(file => slipData.append('files', file));
        const slipRes = await api.post('/upload/upload-files', slipData);
        if (slipRes.data.success) {
          paymentSlipUrls = slipRes.data.urls;
        }
      }

      await api.put(`/staff/tasks/${taskId}`, { 
          status: 'completed', 
          comment: comment || '', 
          images: imageUrls,
          paymentAmount: Number(paymentAmount) || 0,
          paymentMode: paymentMode || 'none',
          paymentSlipUrls
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Task Completed!',
        text: 'Your task has been successfully marked as completed.',
        confirmButtonColor: '#4f46e5'
      });

      // Refresh the current page
      fetchGroupedTasks(page);
    } catch (err) {
      alert('Error updating task');
    }
  };

  const handleAddAdditionalTask = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      let imageUrls = [];
      if (newFiles && newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach(file => formData.append('files', file));
        const uploadRes = await api.post('/upload/upload-files', formData);
        if (uploadRes.data.success) {
          imageUrls = uploadRes.data.urls;
        }
      }

      await api.post('/staff/tasks', { ...newTask, date: new Date().toISOString().split('T')[0], type: 'additional', images: imageUrls });
      
      Swal.fire({
        icon: 'success',
        title: 'Task Logged!',
        text: 'Your additional task has been successfully logged.',
        confirmButtonColor: '#4f46e5'
      });

      setShowAddModal(false);
      setNewTask({ title: '', description: '' });
      setNewFiles([]);
      fetchGroupedTasks(1); // Back to page 1 to see the new task
    } catch (err) {
      alert('Error adding task');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleRow = (dateStr) => {
    setExpandedRows(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-8 shadow-lg">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.name}!</h2>
          <p className="text-emerald-100 max-w-xl">
            Here you can view your assigned tasks, update their status, and log any additional work you've completed today.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 right-32 w-32 h-32 rounded-full bg-emerald-400 opacity-20 blur-xl"></div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">My Task History</h2>
            <p className="text-gray-500 text-sm mt-1">View your assigned and completed tasks organized by date.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
        >
          <PlusCircle size={18} /> Log Additional Work
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Date</th>
                <th className="px-6 py-4 font-semibold w-1/2">Tasks</th>
                <th className="px-6 py-4 font-semibold w-1/4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center mb-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                        Loading your tasks...
                    </td>
                </tr>
              ) : groupedTasks.length === 0 ? (
                <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                        No tasks found in your history.
                    </td>
                </tr>
              ) : (
                groupedTasks.map((group) => {
                  const tasks = group.tasks || [];
                  const isExpanded = !!expandedRows[group.date];
                  const firstTaskTitle = tasks[0]?.title || "No Title";
                  const remainingCount = tasks.length - 1;
                  const allCompleted = tasks.every(t => t.status === 'completed');
                  const hasEmergency = tasks.some(t => t.type === 'emergency' && t.status !== 'completed');

                  return (
                    <React.Fragment key={group.date}>
                      {/* Main Group Row */}
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => toggleRow(group.date)}
                      >
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
                            <td colSpan="3" className="bg-gray-50/50 p-0 border-b-2 border-blue-100">
                                <div className="p-6 bg-blue-50/30 border-l-4 border-blue-400 m-4 rounded-r-xl shadow-inner">
                                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Detailed Tasks for {group.date}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {tasks.map(task => (
                                            <TaskCard key={task._id} task={task} onComplete={handleComplete} />
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

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Log Additional Task</h3>
            <p className="text-sm text-gray-500 mb-6">Did you complete something that wasn't assigned? Log it here.</p>
            <form onSubmit={handleAddAdditionalTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="e.g. Fixed printer"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none"
                  rows="3"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Briefly describe what was done..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload Images (Optional)</label>
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  onChange={(e) => setNewFiles(Array.from(e.target.files))}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none border border-gray-300 rounded-xl cursor-pointer"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  disabled={isAdding}
                  onClick={() => {setShowAddModal(false); setNewFiles([]);}}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors flex justify-center items-center"
                >
                  {isAdding ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
