import { useState, useEffect } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader, showConfirm } from '../utils/swalUtils';
import { Wallet, IndianRupee, Calendar, CheckCircle, HandCoins, User, Clock, Check, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

export default function FundManagement() {
  const [activeTab, setActiveTab] = useState('salary'); // 'salary', 'requests', 'history'
  
  // Salary Tab State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [summaryData, setSummaryData] = useState([]);

  // Requests Tab State
  const [requests, setRequests] = useState([]);

  // History Tab State
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyMonth, setHistoryMonth] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');

  // Initial Fetch Staff List for filters
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/admin/staff');
        setStaffList(res.data.data || []);
      } catch (err) {
        console.error('Error fetching staff list');
      }
    };
    fetchStaff();
  }, []);

  // Fetch functions
  const fetchSummary = async (month) => {
    try {
      const res = await api.get(`/admin/funds/summary/${month}`);
      setSummaryData(res.data);
    } catch (err) {
      console.error('Error fetching fund summary');
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/funds/requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching requests');
    }
  };

  const fetchHistory = async () => {
    try {
      let url = `/admin/funds/history?page=${historyPage}&limit=10`;
      if (historyMonth) url += `&month=${historyMonth}`;
      if (selectedStaff) url += `&staff_id=${selectedStaff}`;
      const res = await api.get(url);
      setHistory(res.data.data);
      setHistoryTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Error fetching history');
    }
  };

  useEffect(() => {
    if (activeTab === 'salary' && selectedMonth) fetchSummary(selectedMonth);
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, selectedMonth, historyPage, historyMonth, selectedStaff]);



  const handlePaySalary = async (staff_id, remainingSalary) => {
    const { value: file } = await Swal.fire({
      title: 'Pay Final Salary',
      html: `
        <div class="text-left mb-4">
          <p class="text-sm text-gray-600 mb-2">You are paying the final salary of <b>₹${remainingSalary}</b> for <b>${selectedMonth}</b>.</p>
        </div>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 text-left mb-1">Upload Payment Slip (Optional)</label>
          <input type="file" id="swal-salary-slip" accept="image/*,application/pdf" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 outline-none border border-gray-200 rounded-xl p-2 cursor-pointer" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Pay & Upload',
      confirmButtonColor: '#10b981',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const fileInput = document.getElementById('swal-salary-slip');
        return fileInput.files.length > 0 ? fileInput.files[0] : null;
      }
    });

    if (file || file === null) {
      showLoader('Processing', 'Recording salary payment...');
      try {
        let slipUrl = '';
        if (file) {
          const formData = new FormData();
          formData.append('files', file);
          const uploadRes = await api.post('/upload/upload-files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const uploadData = uploadRes.data;
          if (uploadData.success && uploadData.urls.length > 0) {
            slipUrl = uploadData.urls[0];
          }
        }

        await api.post('/admin/pay-salary', {
          staff_id,
          month: selectedMonth,
          amount: remainingSalary,
          slipUrl
        });
        closeLoader();
        showAlert('Success', 'Salary marked as paid!', 'success');
        fetchSummary(selectedMonth);
      } catch (err) {
        closeLoader();
        showAlert('Error', 'Failed to process payment', 'error');
      }
    }
  };

  // Requests Tab Handlers
  const handleApproveRequest = async (request) => {
    const { value: file } = await Swal.fire({
      title: 'Approve Advance',
      html: `
        <div class="text-left mb-4">
          <p class="text-sm text-gray-600 mb-2">You are approving <b>₹${request.amount}</b> for <b>${request.name}</b>.</p>
          <p class="text-sm text-gray-600 mb-2">Reason: ${request.description}</p>
        </div>
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 text-left mb-1">Upload Payment Slip (Optional)</label>
          <input type="file" id="swal-slip-file" accept="image/*,application/pdf" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 outline-none border border-gray-200 rounded-xl p-2 cursor-pointer" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Approve Request',
      confirmButtonColor: '#10b981',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const fileInput = document.getElementById('swal-slip-file');
        return fileInput.files.length > 0 ? fileInput.files[0] : null;
      }
    });

    if (file || file === null) {
      showLoader('Approving', 'Processing request...');
      try {
        let slipUrl = '';
        if (file) {
          const formData = new FormData();
          formData.append('files', file);
          const uploadRes = await api.post('/upload/upload-files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const uploadData = uploadRes.data;
          if (uploadData.success && uploadData.urls.length > 0) {
            slipUrl = uploadData.urls[0];
          }
        }

        await api.put(`/admin/funds/request/${request.id}`, { status: 'approved', slipUrl });
        closeLoader();
        Swal.fire('Approved!', 'The advance request has been approved.', 'success');
        fetchRequests();
      } catch (err) {
        closeLoader();
        Swal.fire('Error', 'Failed to approve request', 'error');
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    const confirmed = await showConfirm('Reject Request', 'Are you sure you want to reject this advance request?', 'Yes, Reject', 'warning');
    if (confirmed) {
      try {
        await api.put(`/admin/funds/request/${requestId}`, { status: 'rejected' });
        fetchRequests();
        Swal.fire('Rejected', 'Request rejected', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to reject request', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Approved</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rejected</span>;
      case 'pending': default: return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Pending</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-8 rounded-2xl shadow-lg text-white">
        <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Wallet size={28} /> Financial Management
        </h2>
        <p className="text-emerald-100 mb-6">Manage monthly salaries, approve advance requests, and view payment history.</p>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-emerald-500/30 pb-0">
          <button 
            onClick={() => setActiveTab('salary')}
            className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === 'salary' ? 'bg-white text-emerald-800' : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'}`}
          >
            Salary Overview
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === 'requests' ? 'bg-white text-emerald-800' : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'}`}
          >
            Advance Requests
            {requests.length > 0 && <span className="bg-amber-400 text-emerald-900 px-2 py-0.5 rounded-full text-xs">{requests.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === 'history' ? 'bg-white text-emerald-800' : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'}`}
          >
            Advance History
          </button>
        </div>
      </div>

      {/* SALARY OVERVIEW TAB */}
      {activeTab === 'salary' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800">Payment Breakdown</h3>
            <div className="bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
              <Calendar size={20} className="text-emerald-600" />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-gray-800 font-bold outline-none cursor-pointer"
              />
            </div>
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
                            onClick={() => handlePaySalary(data.staff_id, data.remainingSalary)}
                            className="flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
                          >
                            <IndianRupee size={16} /> Pay
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-400 italic">Settled</span>
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
      )}

      {/* ADVANCE REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800">Pending Advance Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm tracking-wider uppercase border-b border-gray-200">
                  <th className="p-5 font-semibold">Staff</th>
                  <th className="p-5 font-semibold">Date Requested</th>
                  <th className="p-5 font-semibold">Reason</th>
                  <th className="p-5 font-semibold text-right">Amount</th>
                  <th className="p-5 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        {req.pic ? (
                          <img src={req.pic} alt={req.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                            <User size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-800">{req.name}</p>
                          <p className="text-xs text-gray-500">{req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 font-medium">{req.date}</td>
                    <td className="p-5 text-gray-600 max-w-xs truncate" title={req.description}>{req.description}</td>
                    <td className="p-5 text-right font-bold text-red-600 text-lg">₹{req.amount}</td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleApproveRequest(req)} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve Request">
                          <Check size={18} strokeWidth={3} />
                        </button>
                        <button onClick={() => handleRejectRequest(req.id)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Reject Request">
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No pending advance requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADVANCE HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800">Advance History</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select 
                value={selectedStaff} 
                onChange={(e) => {setSelectedStaff(e.target.value); setHistoryPage(1);}}
                className="px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">All Staff</option>
                {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <input 
                type="month" 
                value={historyMonth}
                onChange={(e) => {setHistoryMonth(e.target.value); setHistoryPage(1);}}
                className="px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button onClick={() => {setHistoryMonth(''); setSelectedStaff(''); setHistoryPage(1);}} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl border border-gray-300 font-medium transition-colors">
                Clear Filters
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm tracking-wider uppercase border-b border-gray-200">
                  <th className="p-5 font-semibold">Staff</th>
                  <th className="p-5 font-semibold">Date</th>
                  <th className="p-5 font-semibold">Description</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold">Slip</th>
                  <th className="p-5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        {item.pic ? (
                          <img src={item.pic} alt={item.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            <User size={14} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 text-sm">{item.date}</td>
                    <td className="p-5 text-gray-600 text-sm max-w-xs truncate" title={item.description}>
                      {item.type === 'salary' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider mr-2 border border-indigo-200">
                          Salary
                        </span>
                      )}
                      {item.description}
                    </td>
                    <td className="p-5">{getStatusBadge(item.status)}</td>
                    <td className="p-5">
                      {item.slipUrl ? (
                        <a href={item.slipUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                          <FileText size={16} /> View Slip
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-5 text-right font-bold text-gray-800">₹{item.amount}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No history found for the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {historyTotalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-sm text-gray-600">Page <b>{historyPage}</b> of <b>{historyTotalPages}</b></span>
              <div className="flex gap-2">
                <button 
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(p => p - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button 
                  disabled={historyPage === historyTotalPages}
                  onClick={() => setHistoryPage(p => p + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
