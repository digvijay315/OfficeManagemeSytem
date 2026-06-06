import { useState, useEffect } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader, showConfirm } from '../utils/swalUtils';
import { Wallet, IndianRupee, Calendar, CheckCircle, HandCoins, User } from 'lucide-react';
import Swal from 'sweetalert2';

export default function FundManagement() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [summaryData, setSummaryData] = useState([]);

  const fetchSummary = async (month) => {
    try {
      const res = await api.get(`/admin/funds/summary/${month}`);
      setSummaryData(res.data);
    } catch (err) {
      console.error('Error fetching fund summary');
      showAlert('Error', 'Failed to load fund summary', 'error');
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchSummary(selectedMonth);
    }
  }, [selectedMonth]);

  const handleGiveAdvance = async (staff_id, remainingSalary) => {
    const { value: formValues } = await Swal.fire({
      title: 'Give Advance / Fund',
      html:
        `<input id="swal-amount" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 outline-none" placeholder="Amount (Max: ₹${remainingSalary})">` +
        '<input id="swal-desc" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Reason / Description">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Give Fund',
      confirmButtonColor: '#4f46e5',
      preConfirm: () => {
        return {
          amount: document.getElementById('swal-amount').value,
          description: document.getElementById('swal-desc').value
        }
      }
    });

    if (formValues) {
      if (!formValues.amount || formValues.amount <= 0) return showAlert('Error', 'Invalid amount', 'error');
      if (Number(formValues.amount) > remainingSalary) return showAlert('Error', 'Amount exceeds remaining salary', 'error');

      showLoader('Processing', 'Recording advance...');
      try {
        await api.post('/admin/funds', {
          staff_id,
          amount: Number(formValues.amount),
          date: new Date().toISOString().split('T')[0],
          description: formValues.description || 'Advance'
        });
        closeLoader();
        showAlert('Success', 'Advance recorded successfully!', 'success');
        fetchSummary(selectedMonth);
      } catch (err) {
        closeLoader();
        showAlert('Error', 'Failed to record fund', 'error');
      }
    }
  };

  const handlePaySalary = async (staff_id, remainingSalary) => {
    const confirmed = await showConfirm(
      'Pay Final Salary', 
      `Are you sure you want to mark ₹${remainingSalary} as paid for ${selectedMonth}?`,
      'Yes, Pay Now'
    );
    if (!confirmed) return;

    showLoader('Processing', 'Recording salary payment...');
    try {
      await api.post('/admin/pay-salary', {
        staff_id,
        month: selectedMonth,
        amount: remainingSalary
      });
      closeLoader();
      showAlert('Success', 'Salary marked as paid!', 'success');
      fetchSummary(selectedMonth);
    } catch (err) {
      closeLoader();
      showAlert('Error', 'Failed to process payment', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Wallet size={28} /> Salary & Fund Management
          </h2>
          <p className="text-emerald-100">Manage monthly salaries, track given advances, and clear dues.</p>
        </div>
        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm flex items-center gap-3 w-full md:w-auto">
          <Calendar size={24} className="shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Select Month</p>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Payment Breakdown: {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm tracking-wider uppercase">
                <th className="p-5 font-semibold border-b border-gray-200">Staff</th>
                <th className="p-5 font-semibold border-b border-gray-200 text-right">Base Salary</th>
                <th className="p-5 font-semibold border-b border-gray-200 text-right">Total Advance</th>
                <th className="p-5 font-semibold border-b border-gray-200 text-right">Remaining</th>
                <th className="p-5 font-semibold border-b border-gray-200 text-center">Status</th>
                <th className="p-5 font-semibold border-b border-gray-200 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaryData.map((data) => (
                <tr key={data.staff_id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      {data.pic ? (
                        <img src={data.pic} alt={data.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                          <User size={18} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-800">{data.name}</p>
                        <p className="text-xs text-gray-500">{data.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-right font-medium text-gray-600">₹{data.baseSalary}</td>
                  <td className="p-5 text-right font-medium text-red-500">- ₹{data.totalAdvance}</td>
                  <td className="p-5 text-right font-bold text-gray-800 text-lg">₹{data.remainingSalary}</td>
                  <td className="p-5 text-center">
                    {data.isPaid ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        <CheckCircle size={14} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    {!data.isPaid ? (
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleGiveAdvance(data.staff_id, data.remainingSalary)}
                          className="flex items-center gap-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                          title="Give Advance"
                        >
                          <HandCoins size={16} /> Advance
                        </button>
                        <button 
                          onClick={() => handlePaySalary(data.staff_id, data.remainingSalary)}
                          className="flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
                          title="Pay Remaining Salary"
                        >
                          <IndianRupee size={16} /> Pay
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-400 italic">Settled for {selectedMonth}</span>
                    )}
                  </td>
                </tr>
              ))}
              {summaryData.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No staff records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
