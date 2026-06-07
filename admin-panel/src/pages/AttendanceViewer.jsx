import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, MapPin, Clock, CheckCircle, User, Filter, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { showLoader, closeLoader, showAlert } from '../utils/swalUtils';

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
                          <a href={log.start_image_url} target="_blank" rel="noreferrer">
                            <img src={log.start_image_url} alt="In Proof" className="w-12 h-12 rounded-lg object-cover border-2 border-emerald-200 hover:border-emerald-400 transition-colors cursor-pointer shadow-sm" />
                          </a>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                            <span className="text-[10px] font-medium">No Pic</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500">Out</span>
                        {log.image_url ? (
                          <a href={log.image_url} target="_blank" rel="noreferrer">
                            <img src={log.image_url} alt="Out Proof" className="w-12 h-12 rounded-lg object-cover border-2 border-rose-200 hover:border-rose-400 transition-colors cursor-pointer shadow-sm" />
                          </a>
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
