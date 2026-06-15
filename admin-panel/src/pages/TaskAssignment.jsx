import { useState, useEffect } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader } from '../utils/swalUtils';
import { Calendar, User, FileText, AlertTriangle, ClipboardList } from 'lucide-react';

export default function TaskAssignment() {
  const [staffList, setStaffList] = useState([]);
  const [predefinedTasks, setPredefinedTasks] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'regular',
    customer: {
      name: '',
      mobile: '',
      location: {
        address: '',
        lat: null,
        lng: null
      }
    }
  });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/admin/staff?limit=1000');
        setStaffList(res.data.data);
      } catch (err) {
        console.error('Error fetching staff');
      }
    };

    const fetchPredefined = async () => {
      try {
        const res = await api.get('/admin/predefined-tasks?limit=1000');
        setPredefinedTasks(res.data.data);
      } catch (err) {
        console.error('Error fetching predefined tasks');
      }
    };
    fetchStaff();
    fetchPredefined();
  }, []);

  const handleSelectPredefined = (e) => {
    const selectedTitle = e.target.value;
    if (selectedTitle === '') {
      setFormData({ ...formData, title: '', description: '' });
      return;
    }
    const matchedTask = predefinedTasks.find(t => t.title === selectedTitle);
    if (matchedTask) {
      setFormData({ ...formData, title: matchedTask.title, description: matchedTask.description || '' });
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!formData.staff_id) return showAlert('Error', 'Please select a staff member', 'error');
    
    showLoader('Assigning Task', 'Please wait...');
    try {
      await api.post('/admin/tasks', formData);
      closeLoader();
      showAlert('Success', 'Task assigned successfully!', 'success');
      setFormData({ 
        ...formData, 
        title: '', 
        description: '',
        customer: { name: '', mobile: '', location: { address: '', lat: null, lng: null } }
      });
    } catch (err) {
      closeLoader();
      showAlert('Error', 'Error assigning task', 'error');
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showAlert('Error', 'Geolocation is not supported by your browser', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          customer: {
            ...prev.customer,
            location: {
              ...prev.customer.location,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }
        }));
        showAlert('Success', 'Location fetched successfully!', 'success');
      },
      (error) => {
        showAlert('Error', 'Unable to retrieve your location', 'error');
      }
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-8 rounded-2xl shadow-lg text-white flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <ClipboardList size={28} /> Assign Tasks
          </h2>
          <p className="text-blue-200">Assign regular or emergency tasks to your staff members.</p>
        </div>
        <div className="hidden md:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm">
          <ClipboardList size={32} />
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      
      <form onSubmit={handleAssign} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><User size={16}/> Select Staff</label>
            <select 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              value={formData.staff_id}
              onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
              required
            >
              <option value="">-- Choose Staff --</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={16}/> Task Date</label>
            <input 
              type="date" 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FileText size={16}/> Select from Library</label>
            <select 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              onChange={handleSelectPredefined}
            >
              <option value="">-- Type Custom Task --</option>
              {predefinedTasks.map(t => (
                <option key={t.id || t._id} value={t.title}>{t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FileText size={16}/> Task Title</label>
            <input 
              type="text" 
              placeholder="e.g. Clean the office, File reports"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
          <textarea 
            rows="4"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          ></textarea>
        </div>

        {/* Customer Details Section */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg">Customer Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input 
                type="text" 
                placeholder="Name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.customer.name}
                onChange={(e) => setFormData({...formData, customer: {...formData.customer, name: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Mobile</label>
              <input 
                type="text" 
                placeholder="Mobile No."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.customer.mobile}
                onChange={(e) => setFormData({...formData, customer: {...formData.customer, mobile: e.target.value}})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                placeholder="Full Address"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.customer.location.address}
                onChange={(e) => setFormData({...formData, customer: {...formData.customer, location: {...formData.customer.location, address: e.target.value}}})}
              />
              <button 
                type="button" 
                onClick={handleGetLocation}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 whitespace-nowrap transition-colors text-sm font-medium shadow-sm w-full sm:w-auto"
              >
                Get Geo Location
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Latitude (Optional)</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 28.7041"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.customer.location.lat || ''}
                  onChange={(e) => setFormData({...formData, customer: {...formData.customer, location: {...formData.customer.location, lat: e.target.value ? parseFloat(e.target.value) : null}}})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Longitude (Optional)</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 77.1025"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.customer.location.lng || ''}
                  onChange={(e) => setFormData({...formData, customer: {...formData.customer, location: {...formData.customer.location, lng: e.target.value ? parseFloat(e.target.value) : null}}})}
                />
              </div>
            </div>

            {formData.customer.location.lat && formData.customer.location.lng && (
              <p className="text-sm text-green-600 mt-2 font-medium bg-green-50 p-2 rounded-lg inline-block">✓ Geo Location recorded: {parseFloat(formData.customer.location.lat).toFixed(4)}, {parseFloat(formData.customer.location.lng).toFixed(4)}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Task Priority / Type</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="type" 
                value="regular"
                checked={formData.type === 'regular'}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-700">Regular Task</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="type" 
                value="emergency"
                checked={formData.type === 'emergency'}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle size={16}/> Emergency Task</span>
            </label>
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg shadow-blue-200 transform hover:-translate-y-1">
          Assign Task
        </button>
      </form>
      </div>
    </div>
  );
}
