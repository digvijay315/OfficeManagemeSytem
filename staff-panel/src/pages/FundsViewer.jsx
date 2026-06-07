import { useState, useEffect } from 'react';
import api from '../api';
import { IndianRupee, History, Wallet } from 'lucide-react';

export default function FundsViewer() {
  const [data, setData] = useState({ salary: 0, totalTaken: 0, remaining: 0, funds: [] });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const res = await api.get('/staff/funds');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching funds');
      }
    };
    fetchFunds();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-8 shadow-lg">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.name}!</h2>
          <p className="text-emerald-100 max-w-xl">
            Here you can track your base salary, view any advanced funds taken, and monitor your remaining balance for the month.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 right-32 w-32 h-32 rounded-full bg-emerald-400 opacity-20 blur-xl"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Monthly Salary</p>
            <p className="text-2xl font-bold text-gray-800">₹{data.salary}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Taken (Advances)</p>
            <p className="text-2xl font-bold text-red-600">₹{data.totalTaken}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-500 flex items-center gap-4 shadow-emerald-100/50">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">Remaining Balance</p>
            <p className="text-3xl font-bold text-emerald-600">₹{data.remaining}</p>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <History size={20} className="text-emerald-600" />
          Funds Received History
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.funds.map((fund) => (
                <tr key={fund.id || fund._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-500">{fund.date}</td>
                  <td className="p-4 text-gray-800">{fund.description || '-'}</td>
                  <td className="p-4 font-bold text-red-600 text-right">- ₹{fund.amount}</td>
                </tr>
              ))}
              {data.funds.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-500">No funds have been given yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
