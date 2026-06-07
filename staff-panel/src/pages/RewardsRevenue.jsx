import React, { useState, useEffect } from 'react';
import api from '../api';
import { IndianRupee, Gift, Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function RewardsRevenue() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [data, setData] = useState({ totalRevenue: 0, totalRewards: 0, revenueTasks: [], rewardTasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/staff/rewards-revenue?month=${month}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching rewards and revenue:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Rewards</h2>
          <p className="text-gray-500 text-sm mt-1">Track the rewards you earned from additional tasks.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          <CalendarIcon size={18} className="text-gray-500" />
          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-gray-700 focus:ring-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-1">Total Rewards Earned</p>
            <h3 className="text-4xl font-bold flex items-center gap-2">
              <IndianRupee size={32} /> {data.totalRewards}
            </h3>
            <p className="text-sm mt-4 text-blue-50 bg-white/20 inline-block px-3 py-1 rounded-full">Added to this month's salary</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <Gift size={160} className="-mr-10 -mb-10" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Rewards List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Gift size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Rewards from Additional Tasks</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {data.rewardTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No rewards earned this month.</div>
              ) : (
                data.rewardTasks.map(task => (
                  <div key={task._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-800 text-sm">{task.title}</h4>
                      <span className="font-bold text-blue-600">₹{task.rewardAmount}</span>
                    </div>
                    <p className="text-xs text-gray-600 my-1 truncate">{task.description}</p>
                    
                    {task.rewardSlipUrls && task.rewardSlipUrls.length > 0 && (
                      <div className="my-2">
                        <span className="text-[10px] text-gray-500 font-semibold block mb-1 uppercase tracking-wider">Payment Proof:</span>
                        <div className="flex flex-wrap gap-1">
                          {task.rewardSlipUrls.map((img, i) => (
                            <a key={i} href={img} target="_blank" rel="noreferrer" className="w-10 h-10 rounded border block overflow-hidden hover:border-blue-400">
                              <img src={img} className="w-full h-full object-cover" alt="Reward Proof" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <span>{task.date}</span>
                      {task.verificationStatus === 'verified' && (
                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> Verified</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
