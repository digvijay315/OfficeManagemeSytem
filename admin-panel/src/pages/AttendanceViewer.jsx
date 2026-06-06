import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, MapPin, Clock, CheckCircle, User, Filter, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { showLoader, closeLoader, showAlert } from '../utils/swalUtils';

export default function AttendanceViewer() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [filterDate, setFilterDate] = useState(''); // Empty means all dates
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAttendance = async () => {
    showLoader('Loading', 'Fetching attendance records...');
    try {
      const res = await api.get(`/admin/attendance?page=${page}&limit=10`);
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
    fetchAttendance();
  }, [page]);

  const filteredList = filterDate 
    ? attendanceList.filter(log => log.date === filterDate)
    : attendanceList;

  const getMapLink = (location) => {
    if (!location) return '#';
    // If it looks like coordinates or any text, google maps search handles it well
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
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
        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm flex items-center gap-3 w-full md:w-auto">
          <Filter size={24} className="shrink-0" />
          <div>
            <p className="text-xs font-semibold text-teal-100 uppercase tracking-wider">Filter Date</p>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-white font-bold text-lg outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800">
            {filterDate ? `Attendance for ${filterDate}` : 'All Attendance Logs'}
          </h3>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-sm text-indigo-600 hover:underline font-medium">
              Clear Filter
            </button>
          )}
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
              {filteredList.map((log) => (
                <tr key={log.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="p-5 font-bold text-gray-800">{log.date}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      {log.staff_pic ? (
                        <img src={log.staff_pic} alt={log.staff_name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
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
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                      <a href={getMapLink(log.start_location)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        <MapPin size={16} className="text-emerald-500"/> View Start GPS
                      </a>
                      {log.end_location ? (
                        <a href={getMapLink(log.end_location)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                          <MapPin size={16} className="text-rose-500"/> View End GPS
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <MapPin size={16} className="text-gray-300"/> Not Checked Out
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    {log.image_url ? (
                      <a href={log.image_url} target="_blank" rel="noreferrer">
                        <img src={log.image_url} alt="Proof" className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200 hover:border-indigo-400 transition-colors cursor-pointer shadow-sm" />
                      </a>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                        <span className="text-xs font-medium">No Pic</span>
                      </div>
                    )}
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
              {filteredList.length === 0 && (
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
    </div>
  );
}
