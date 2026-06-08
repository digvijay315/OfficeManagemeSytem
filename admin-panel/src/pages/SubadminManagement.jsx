import { useState, useEffect } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader } from '../utils/swalUtils';
import Swal from 'sweetalert2';
import { UserPlus, Mail, Lock, ChevronLeft, ChevronRight, Edit2, Trash2, Phone, Shield } from 'lucide-react';

const InputField = ({ label, icon: Icon, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-indigo-500" />} {label}
    </label>
    <input 
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
      {...props}
    />
  </div>
);

export default function SubadminManagement() {
  const [subadminList, setSubadminList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', mobile: ''
  });

  const fetchSubadmins = async () => {
    try {
      const res = await api.get(`/admin/subadmins?page=${page}&limit=10`);
      setSubadminList(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Error fetching subadmins');
    }
  };

  useEffect(() => {
    fetchSubadmins();
  }, [page]);

  const handleAddSubadmin = async (e) => {
    e.preventDefault();
    if (!editId && !formData.password) {
      return showAlert('Error', 'Password is required for new subadmin', 'error');
    }

    showLoader(editId ? 'Updating Subadmin' : 'Adding Subadmin', 'Please wait...');
    try {
      if (editId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/admin/subadmins/${editId}`, payload);
      } else {
        await api.post('/admin/subadmins', formData);
      }
      
      setFormData({ name: '', email: '', password: '', mobile: '' });
      setEditId(null);
      fetchSubadmins();
      closeLoader();
      showAlert('Success', editId ? 'Subadmin updated successfully!' : 'Subadmin added successfully!', 'success');
    } catch (err) {
      closeLoader();
      showAlert('Error', err.response?.data?.error || 'Error adding/updating subadmin', 'error');
    }
  };

  const handleEdit = (subadmin, e) => {
    e.stopPropagation();
    setEditId(subadmin.id || subadmin._id);
    setFormData({
      name: subadmin.name || '',
      email: subadmin.email || '',
      mobile: subadmin.mobile || '',
      password: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (subadminId, e) => {
    e.stopPropagation();
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Subadmin?',
      text: "This will remove them permanently. You cannot undo this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete!'
    });

    if (isConfirmed) {
      showLoader('Deleting', 'Please wait...');
      try {
        await api.delete(`/admin/subadmins/${subadminId}`);
        closeLoader();
        showAlert('Deleted', 'Subadmin deleted.', 'success');
        fetchSubadmins();
      } catch (err) {
        closeLoader();
        showAlert('Error', 'Failed to delete subadmin.', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 p-8 rounded-2xl shadow-lg text-white flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            {editId ? 'Edit Subadmin' : 'Add New Subadmin'}
          </h2>
          <p className="text-purple-200">
            {editId ? 'Update details for the selected subadmin.' : 'Create a new subadmin account.'}
          </p>
        </div>
        <div className="hidden md:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm">
          {editId ? <Edit2 size={32} /> : <Shield size={32} />}
        </div>
      </div>

      <form onSubmit={handleAddSubadmin} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <span className="bg-purple-100 text-purple-700 p-2 rounded-lg"><UserPlus size={20}/></span> Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" icon={UserPlus} type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <InputField label="Email Address" icon={Mail} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <InputField label="Mobile Number" icon={Phone} type="text" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="e.g. 9876543210" />
            <InputField label="Password" icon={Lock} type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editId} placeholder={editId ? "Leave blank to keep unchanged" : ""} />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex gap-4">
          <button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-900 transition-all shadow-lg shadow-purple-200 cursor-pointer transform hover:-translate-y-1">
            {editId ? 'Update Subadmin' : 'Add Subadmin'}
          </button>
          {editId && (
            <button 
              type="button"
              onClick={() => {
                setEditId(null);
                setFormData({ name: '', email: '', password: '', mobile: '' });
              }}
              className="bg-gray-100 text-gray-700 px-8 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Subadmin Directory</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm tracking-wider uppercase">
                <th className="p-5 font-semibold border-b border-gray-200">Name</th>
                <th className="p-5 font-semibold border-b border-gray-200">Email</th>
                <th className="p-5 font-semibold border-b border-gray-200">Mobile</th>
                <th className="p-5 font-semibold border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subadminList.map((subadmin) => (
                <tr 
                  key={subadmin.id || subadmin._id} 
                  className="border-b border-gray-50 hover:bg-purple-50/50 transition-colors"
                >
                  <td className="p-5 font-bold text-gray-800">{subadmin.name}</td>
                  <td className="p-5 text-gray-600">{subadmin.email}</td>
                  <td className="p-5 text-gray-600">{subadmin.mobile || 'N/A'}</td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => handleEdit(subadmin, e)}
                        className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Subadmin"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(subadmin.id || subadmin._id, e)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Subadmin"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subadminList.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Shield size={48} className="mb-4 text-gray-200" />
                      <p className="text-lg font-medium">No subadmins found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
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
