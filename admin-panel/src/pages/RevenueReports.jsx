import React, { useState, useEffect } from 'react';
import api from '../api';
import { IndianRupee, Gift, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function RevenueReports() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [data, setData] = useState({ totalRevenueThisMonth: 0, totalRewardsThisMonth: 0, staffData: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/revenue-reports?month=${month}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching revenue reports', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Revenue & Rewards Report</h2>
          <p className="text-gray-500 text-sm mt-1">Overview of staff revenue generation and rewards distribution.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 font-medium mb-1">Total Revenue ({month ? format(new Date(month + '-01'), 'MMMM yyyy') : 'All Time'})</p>
            <h3 className="text-4xl font-bold flex items-center gap-2">
              <IndianRupee size={32} /> {data.totalRevenueThisMonth || 0}
            </h3>
            <p className="text-sm mt-4 text-emerald-50 bg-white/20 inline-block px-3 py-1 rounded-full">For {month ? format(new Date(month + '-01'), 'MMMM yyyy') : 'All Time'}</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <IndianRupee size={160} className="-mr-10 -mb-10" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-1">Total Rewards Given</p>
            <h3 className="text-4xl font-bold flex items-center gap-2">
              <IndianRupee size={32} /> {data.totalRewardsThisMonth}
            </h3>
            <p className="text-sm mt-4 text-blue-50 bg-white/20 inline-block px-3 py-1 rounded-full">For {format(new Date(month + '-01'), 'MMMM yyyy')}</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <Gift size={160} className="-mr-10 -mb-10" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <UserIcon size={18} className="text-gray-500" /> Staff Performance ({month})
          </h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-gray-700 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Staff Member</th>
                  <th className="px-6 py-4 font-semibold text-right">Revenue Generated</th>
                  <th className="px-6 py-4 font-semibold text-right">Rewards Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.staffData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No data found for this month.</td>
                  </tr>
                ) : (
                  data.staffData.map(staff => (
                    <tr key={staff.staff_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {staff.pic ? (
                              <img src={staff.pic} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-gray-500">{staff.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{staff.name}</p>
                            <p className="text-xs text-gray-500">{staff.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-emerald-600 text-base">₹{staff.revenue}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-blue-600 text-base">₹{staff.rewards}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
