import React, { useState, useEffect } from 'react';
import api from '../api';
import { CheckCircle, XCircle, AlertTriangle, IndianRupee } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TaskVerification() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardSlips, setRewardSlips] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tasks/pending-verification');
      setTasks(res.data.data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (taskId, status) => {
    setIsVerifying(true);
    try {
      let slipUrls = [];
      if (status === 'verified' && rewardSlips.length > 0) {
        const formData = new FormData();
        rewardSlips.forEach(file => formData.append('files', file));
        const uploadRes = await api.post('/upload/upload-files', formData);
        if (uploadRes.data.success) {
          slipUrls = uploadRes.data.urls;
        }
      }

      await api.put(`/admin/tasks/${taskId}/verify`, {
        verificationStatus: status,
        rewardAmount: status === 'verified' ? Number(rewardAmount) || 0 : 0,
        rewardSlipUrls: status === 'verified' ? slipUrls : []
      });
      Swal.fire('Success', `Task has been ${status}`, 'success');
      setSelectedTask(null);
      setRewardAmount('');
      setRewardSlips([]);
      fetchTasks();
    } catch (err) {
      Swal.fire('Error', 'Failed to verify task', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Task Verification</h2>
          <p className="text-gray-500 text-sm mt-1">Review additional tasks submitted by staff and issue rewards.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading pending tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle size={48} className="text-emerald-300 mb-4" />
            <p className="font-semibold">All Caught Up!</p>
            <p className="text-sm mt-1">No pending tasks require verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {tasks.map(task => (
              <div key={task._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {task.staff?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{task.staff?.name}</p>
                    <p className="text-xs text-gray-500">{task.date}</p>
                  </div>
                </div>
                
                <h4 className="font-bold text-gray-800 mb-2">{task.title}</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{task.description}</p>
                
                {task.images && task.images.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-semibold block mb-1">Work Proof:</span>
                    <div className="flex flex-wrap gap-2">
                      {task.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="w-12 h-12 rounded border block overflow-hidden hover:border-blue-400">
                          <img src={img} className="w-full h-full object-cover" alt="Task Proof" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {task.paymentSlipUrls && task.paymentSlipUrls.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-semibold block mb-1">Payment Proof:</span>
                    <div className="flex flex-wrap gap-2">
                      {task.paymentSlipUrls.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="w-12 h-12 rounded border block overflow-hidden hover:border-blue-400">
                          <img src={img} className="w-full h-full object-cover" alt="Payment Proof" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => { setSelectedTask(task); setRewardAmount(''); setRewardSlips([]); }}
                  className="w-full py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Review & Verify
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Verify Task: {selectedTask.title}</h3>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedTask.description}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Reward (₹) - Optional</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={rewardAmount}
                    onChange={e => setRewardAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This amount will be added to the staff's monthly salary calculation.</p>
              </div>
              
              {Number(rewardAmount) > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Payment Slip (Optional)</label>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={(e) => setRewardSlips(Array.from(e.target.files))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <button 
                onClick={() => setSelectedTask(null)}
                disabled={isVerifying}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleVerify(selectedTask._id, 'rejected')}
                disabled={isVerifying}
                className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button 
                onClick={() => handleVerify(selectedTask._id, 'verified')}
                disabled={isVerifying}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
