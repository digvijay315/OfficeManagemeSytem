import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, MapPin, Clock, CheckCircle, User, Filter, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { showLoader, closeLoader, showAlert } from '../utils/swalUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AttendanceViewer() {
  const AddressDisplay = ({ coords }) => {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const [lat, lon] = coords.split(',').map(s => s.trim());
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        setAddress(data.display_name || 'Address not found');
      } catch (err) {
        setAddress('Error fetching address');
      } finally {
        setLoading(false);
      }
    };

    if (!coords) return null;

    return (
      <div className="mt-1.5 text-xs bg-gray-50 p-1.5 rounded border border-gray-100">
        {!address && !loading && (
          <button onClick={fetchAddress} className="text-indigo-600 hover:underline font-semibold flex items-center gap-1">
            <MapPin size={12}/> Fetch Address
          </button>
        )}
        {loading && <span className="text-gray-400 animate-pulse">Fetching...</span>}
        {address && <span className="text-gray-600 font-medium">{address}</span>}
      </div>
    );
  };

  const [attendanceList, setAttendanceList] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/admin/staff?limit=1000');
        setStaffList(res.data.data);
      } catch (err) {
        console.error('Error fetching staff list');
      }
    };
    fetchStaff();
  }, []);

  const fetchAttendance = async (fDate = fromDate, tDate = toDate, sId = staffId, p = page) => {
    showLoader('Loading', 'Fetching attendance records...');
    try {
      const res = await api.get(`/admin/attendance?page=${p}&limit=10&fromDate=${fDate}&toDate=${tDate}&staff_id=${sId}`);
      console.log(res);
      
      setAttendanceList(res.data.data);
      setTotalPages(res.data.pages);
      closeLoader();
    } catch (err) {
      closeLoader();
      console.error('Error fetching attendance');
      showAlert('Error', 'Failed to fetch attendance logs', 'error');
    }
  };

  useEffect(() => {
    fetchAttendance(fromDate, toDate, staffId, page);
  }, [page]);

  const handleSearch = () => {
    if (page === 1) {
      fetchAttendance(fromDate, toDate, staffId, 1);
    } else {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setStaffId('');
    if (page === 1) {
      fetchAttendance('', '', '', 1);
    } else {
      setPage(1);
    }
  };

  const getFullImageUrl = (url) => {
  
    
    if (!url) return '';
    // If it's already an absolute URL or a Cloudinary URL
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('//') || url.includes('cloudinary.com')) {
      // Add https:// if it's missing protocol but is a cloudinary URL
      if (url.includes('cloudinary.com') && !url.startsWith('http') && !url.startsWith('//')) {
        return `https://${url}`;
      }
      return url;
    }
    const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getMapLink = (location) => {
    if (!location) return '#';
    // If it looks like coordinates or any text, google maps search handles it well
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const calculateWorkedHours = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return null;
    const parseTime = (timeStr) => {
      const parts = timeStr.split(' ');
      const time = parts[0];
      const modifier = parts[1];
      let [hours, minutes, seconds] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier && modifier.toUpperCase() === 'PM') hours = parseInt(hours, 10) + 12;
      const d = new Date();
      d.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds || 0, 10), 0);
      return d;
    };
  
    try {
      const start = parseTime(startTimeStr);
      const end = parseTime(endTimeStr);
      let diffMs = end - start;
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHrs}h ${diffMins}m`;
    } catch (e) {
      return 'N/A';
    }
  };

  const handleDownloadPDF = async () => {
    try {
      showLoader('Preparing PDF', 'Please wait...');
      const response = await api.get(`/admin/attendance/pdf?fromDate=${fromDate}&toDate=${toDate}&staff_id=${staffId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      closeLoader();
    } catch (err) {
      closeLoader();
      console.error('Error downloading PDF', err);
      showAlert('Error', 'Failed to generate PDF from server', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-500 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Calendar size={28} /> Staff Attendance
          </h2>
          <p className="text-teal-100">Monitor daily attendance, timings, and location proofs.</p>
        </div>
        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={24} className="shrink-0" />
            <span className="text-sm font-semibold text-teal-100 uppercase tracking-wider hidden md:block">Filter</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full justify-end">
            <div>
              <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-1">From Date</p>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent border border-teal-400/30 rounded p-1.5 text-white font-medium text-sm outline-none cursor-pointer w-full md:w-auto"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-1">To Date</p>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent border border-teal-400/30 rounded p-1.5 text-white font-medium text-sm outline-none cursor-pointer w-full md:w-auto"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider mb-1">Staff</p>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="bg-teal-700/50 border border-teal-400/30 rounded p-1.5 text-white font-medium text-sm outline-none cursor-pointer w-full md:w-auto"
              >
                <option value="" className="text-black">All Staff</option>
                {staffList.map(s => (
                  <option key={s._id} value={s._id} className="text-black">{s.name}</option>
                ))}
              </select>
            </div>
            <div className="self-end pb-0.5">
              <button 
                onClick={handleSearch}
                className="bg-white text-teal-700 px-4 py-1.5 rounded font-bold text-sm hover:bg-teal-50 transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800">
            {fromDate || toDate || staffId ? 'Filtered Attendance Logs' : 'All Attendance Logs'}
          </h3>
          <div className="flex items-center gap-4">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">
              <Download size={16} /> Download PDF
            </button>
            {(fromDate || toDate || staffId) && (
              <button onClick={clearFilters} className="text-sm text-indigo-600 hover:underline font-medium">
                Clear Filter
              </button>
            )}
          </div>
        </div>
      
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-5 font-semibold">Date</th>
                <th className="p-5 font-semibold">Staff Details</th>
                <th className="p-5 font-semibold">Time Log</th>
                <th className="p-5 font-semibold">Locations (GPS)</th>
                <th className="p-5 font-semibold">Selfie Proof</th>
                <th className="p-5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceList.map((log) => (
                <tr key={log.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="p-5 font-bold text-gray-800">{log.date}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      {log.staff_pic ? (
                        <img src={getFullImageUrl(log.staff_pic)} alt={log.staff_name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                          <User size={18} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-800">{log.staff_name}</p>
                        <p className="text-xs text-gray-500">{log.staff_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 text-sm font-medium">
                      <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-max"><Clock size={14}/> In: {log.start_time || 'N/A'}</span>
                      <span className="flex items-center gap-2 text-rose-600 bg-rose-50 px-2 py-1 rounded w-max"><Clock size={14}/> Out: {log.end_time || 'Working'}</span>
                      {log.start_time && log.end_time && (
                        <span className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-max mt-1 font-bold border border-indigo-100">
                          Total: {calculateWorkedHours(log.start_time, log.end_time)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                      <div>
                        <a href={getMapLink(log.start_location)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors font-semibold">
                          <MapPin size={16} className="text-emerald-500"/> Start GPS
                        </a>
                        {log.start_location && (
                          <>
                            <span className="text-xs text-gray-400 font-mono mt-1 block">{log.start_location}</span>
                            <AddressDisplay coords={log.start_location} />
                          </>
                        )}
                      </div>
                      {log.end_location ? (
                        <div className="pt-2 border-t border-gray-100">
                          <a href={getMapLink(log.end_location)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors font-semibold">
                            <MapPin size={16} className="text-rose-500"/> End GPS
                          </a>
                          <span className="text-xs text-gray-400 font-mono mt-1 block">{log.end_location}</span>
                          <AddressDisplay coords={log.end_location} />
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-400 pt-2 border-t border-gray-100">
                          <MapPin size={16} className="text-gray-300"/> Not Checked Out
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500">In</span>
                        {log.start_image_url ? (
                          <div onClick={() => setSelectedImage(getFullImageUrl(log.start_image_url))} className="cursor-pointer">
                            <img src={getFullImageUrl(log.start_image_url)} alt="In Proof" className="w-12 h-12 rounded-lg object-cover border-2 border-emerald-200 hover:border-emerald-400 transition-colors shadow-sm" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                            <span className="text-[10px] font-medium">No Pic</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500">Out</span>
                        {log.image_url ? (
                          <div onClick={() => setSelectedImage(getFullImageUrl(log.image_url))} className="cursor-pointer">
                            <img src={getFullImageUrl(log.image_url)} alt="Out Proof" className="w-12 h-12 rounded-lg object-cover border-2 border-rose-200 hover:border-rose-400 transition-colors shadow-sm" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                            <span className="text-[10px] font-medium">No Pic</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    {log.end_time ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                        <CheckCircle size={14}/> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                        <AlertCircle size={14} className="animate-pulse" /> Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {attendanceList.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar size={48} className="mb-4 text-gray-200" />
                      <p className="text-lg font-medium">No attendance records found.</p>
                      <p className="text-sm">No one has logged in yet for the selected date.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
}
