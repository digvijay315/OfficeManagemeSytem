import { useState, useEffect } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader } from '../utils/swalUtils';
import Swal from 'sweetalert2';
import { UserPlus, Mail, Lock, DollarSign, MapPin, Building, CreditCard, FileText, CheckCircle, UploadCloud, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, Phone } from 'lucide-react';

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

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUpload, setLoadingUpload] = useState("");
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', mobile: '', salary: '', 
    address: '',
    documentName: '', documentNo: '',
    bankName: '', accountNo: '', ifscCode: '', branchName: '',
    joinedDate: new Date().toISOString().split('T')[0],
    Upload: { pic: [], document: [] }
  });

  const fetchStaff = async () => {
    try {
      const res = await api.get(`/admin/staff?page=${page}&limit=10`);
      setStaffList(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Error fetching staff');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page]);

  const showStaffDetails = (staff) => {
    const picHtml = staff.Upload?.pic?.length > 0 
      ? `<img src="${staff.Upload.pic[0]}" class="w-24 h-24 rounded-full mx-auto object-cover border-4 border-indigo-100 shadow-sm" />` 
      : `<div class="w-24 h-24 rounded-full mx-auto bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-3xl">${staff.name.charAt(0).toUpperCase()}</div>`;
    
    let docHtml = '';
    if (staff.Upload?.document?.length > 0) {
      docHtml = staff.Upload.document.map((doc, idx) => `<a href="${doc}" target="_blank" class="text-indigo-600 hover:underline">Doc ${idx+1}</a>`).join(', ');
    } else {
      docHtml = 'No documents uploaded';
    }

    Swal.fire({
      title: 'Staff Profile',
      html: `
        <div class="text-left space-y-4">
          <div class="text-center mb-6">
            ${picHtml}
            <h2 class="text-xl font-bold mt-3">${staff.name}</h2>
            <p class="text-gray-500">${staff.email}</p>
            <p class="text-sm font-medium mt-1"><span class="text-indigo-600">Mobile:</span> ${staff.mobile || 'N/A'}</p>
            <span class="inline-block mt-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Joined: ${staff.joinedDate || 'N/A'}</span>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 class="font-bold text-gray-800 mb-2 border-b pb-2">Employment & Documents</h4>
            <p class="text-sm"><span class="font-semibold text-gray-600">Salary:</span> ₹${staff.salary}</p>
            <p class="text-sm"><span class="font-semibold text-gray-600">Address:</span> ${staff.address || 'N/A'}</p>
            <p class="text-sm"><span class="font-semibold text-gray-600">ID Name:</span> ${staff.documentName || 'N/A'}</p>
            <p class="text-sm"><span class="font-semibold text-gray-600">ID No:</span> ${staff.documentNo || 'N/A'}</p>
            <p class="text-sm mt-2"><span class="font-semibold text-gray-600">Proofs:</span> ${docHtml}</p>
          </div>

          <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 class="font-bold text-blue-900 mb-2 border-b border-blue-200 pb-2">Bank Details</h4>
            <p class="text-sm text-blue-800"><span class="font-semibold">Bank:</span> ${staff.bankName || 'N/A'}</p>
            <p class="text-sm text-blue-800"><span class="font-semibold">Branch:</span> ${staff.branchName || 'N/A'}</p>
            <p class="text-sm text-blue-800"><span class="font-semibold">A/C No:</span> ${staff.accountNo || 'N/A'}</p>
            <p class="text-sm text-blue-800"><span class="font-semibold">IFSC:</span> ${staff.ifscCode || 'N/A'}</p>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-2xl',
      }
    });
  };

  const handleFileChange = async (e, fieldName) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoadingUpload(fieldName);
    const uploadData = new FormData();
    files.forEach((file) => uploadData.append("files", file));

    try {
      const res = await api.post("/upload/upload-files", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData((prev) => ({
        ...prev,
        Upload: {
          ...prev.Upload,
          [fieldName]: res.data.urls,
        },
      }));
    } catch (error) {
      console.error("Upload failed:", error);
      showAlert('Error', 'File upload failed!', 'error');
    } finally {
      setLoadingUpload("");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!editId && !formData.password) {
      return showAlert('Error', 'Password is required for new staff', 'error');
    }

    showLoader(editId ? 'Updating Staff' : 'Adding Staff', 'Please wait...');
    try {
      if (editId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/admin/staff/${editId}`, payload);
      } else {
        await api.post('/admin/staff', formData);
      }
      
      setFormData({ 
        name: '', email: '', password: '', mobile: '', salary: '', 
        address: '',
        documentName: '', documentNo: '',
        bankName: '', accountNo: '', ifscCode: '', branchName: '',
        joinedDate: new Date().toISOString().split('T')[0],
        Upload: { pic: [], document: [] }
      });
      setEditId(null);
      fetchStaff();
      closeLoader();
      showAlert('Success', editId ? 'Staff updated successfully!' : 'Staff added successfully!', 'success');
    } catch (err) {
      closeLoader();
      showAlert('Error', err.response?.data?.error || 'Error adding/updating staff', 'error');
    }
  };

  const handleEdit = (staff, e) => {
    e.stopPropagation();
    setEditId(staff.id || staff._id);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      mobile: staff.mobile || '',
      password: '',
      salary: staff.salary || '',
      address: staff.address || '',
      documentName: staff.documentName || '',
      documentNo: staff.documentNo || '',
      bankName: staff.bankName || '',
      accountNo: staff.accountNo || '',
      ifscCode: staff.ifscCode || '',
      branchName: staff.branchName || '',
      joinedDate: staff.joinedDate || new Date().toISOString().split('T')[0],
      Upload: staff.Upload || { pic: [], document: [] }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (staffId, e) => {
    e.stopPropagation();
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Staff?',
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
        await api.delete(`/admin/staff/${staffId}`);
        closeLoader();
        showAlert('Deleted', 'Staff member deleted.', 'success');
        fetchStaff();
      } catch (err) {
        closeLoader();
        showAlert('Error', 'Failed to delete staff.', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Add Staff Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 p-8 rounded-2xl shadow-lg text-white flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            {editId ? 'Edit Staff Member' : 'Onboard New Staff'}
          </h2>
          <p className="text-indigo-200">
            {editId ? 'Update details for the selected staff member.' : 'Fill out the detailed employee profile to add them to the system.'}
          </p>
        </div>
        <div className="hidden md:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm">
          {editId ? <Edit2 size={32} /> : <UserPlus size={32} />}
        </div>
      </div>

      <form onSubmit={handleAddStaff} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg"><UserPlus size={20}/></span> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" icon={UserPlus} type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <InputField label="Email Address" icon={Mail} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <InputField label="Mobile Number" icon={Phone} type="text" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="e.g. 9876543210" />
            <InputField label="Password" icon={Lock} type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editId} placeholder={editId ? "Leave blank to keep unchanged" : ""} />
            <InputField label="Monthly Salary (₹)" icon={DollarSign} type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} required />
            <InputField label="Joining Date" icon={Calendar} type="date" value={formData.joinedDate} onChange={(e) => setFormData({...formData, joinedDate: e.target.value})} required />
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin size={14} className="text-indigo-500" /> Complete Address
              </label>
              <textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                rows="2"
              ></textarea>
            </div>
            <div className="md:col-span-2 border-t border-dashed border-gray-200 pt-6 mt-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UploadCloud size={14} className="text-indigo-500" /> Profile Picture {loadingUpload === 'pic' && <span className="text-indigo-600 normal-case ml-2 animate-pulse">(Uploading...)</span>}
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-50 border border-gray-200 hover:bg-gray-100 px-6 py-3 rounded-xl transition-colors font-medium text-sm text-gray-600">
                  Choose Image
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'pic')} className="hidden" />
                </label>
                {formData.Upload.pic.length > 0 && <span className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-4 py-2 rounded-lg"><CheckCircle size={16}/> Uploaded Successfully</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Bank & Financial Details */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <span className="bg-emerald-100 text-emerald-700 p-2 rounded-lg"><Building size={20}/></span> Bank Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InputField label="Bank Name" icon={Building} type="text" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} placeholder="e.g. HDFC Bank" />
            <InputField label="Branch Name" icon={MapPin} type="text" value={formData.branchName} onChange={(e) => setFormData({...formData, branchName: e.target.value})} placeholder="e.g. Connaught Place" />
            <InputField label="Account Number" icon={CreditCard} type="text" value={formData.accountNo} onChange={(e) => setFormData({...formData, accountNo: e.target.value})} placeholder="e.g. 501002938475" />
            <InputField label="IFSC Code" icon={FileText} type="text" value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value})} placeholder="e.g. HDFC0001234" />
          </div>
        </div>

        {/* Identity Documents */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <span className="bg-blue-100 text-blue-700 p-2 rounded-lg"><FileText size={20}/></span> Identity Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" /> Document Type
              </label>
              <select
                value={formData.documentName}
                onChange={(e) => setFormData({...formData, documentName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              >
                <option value="">Select Document</option>
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <InputField label="Document Number" icon={FileText} type="text" value={formData.documentNo} onChange={(e) => setFormData({...formData, documentNo: e.target.value})} placeholder="e.g. 1234-5678-9012" />
            <div className="md:col-span-2 border-t border-dashed border-gray-200 pt-6 mt-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UploadCloud size={14} className="text-indigo-500" /> Upload Document Proof {loadingUpload === 'document' && <span className="text-indigo-600 normal-case ml-2 animate-pulse">(Uploading...)</span>}
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-50 border border-gray-200 hover:bg-gray-100 px-6 py-3 rounded-xl transition-colors font-medium text-sm text-gray-600">
                  Choose Files (Images/PDF)
                  <input type="file" multiple onChange={(e) => handleFileChange(e, 'document')} className="hidden" />
                </label>
                {formData.Upload.document.length > 0 && <span className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-4 py-2 rounded-lg"><CheckCircle size={16}/> {formData.Upload.document.length} File(s) Uploaded</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex gap-4">
          <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-indigo-900 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 cursor-pointer transform hover:-translate-y-1" disabled={!!loadingUpload}>
            {editId ? 'Update Staff Member' : 'Complete Onboarding & Add Staff'}
          </button>
          {editId && (
            <button 
              type="button"
              onClick={() => {
                setEditId(null);
                setFormData({
                  name: '', email: '', password: '', mobile: '', salary: '', 
                  address: '', documentName: '', documentNo: '',
                  bankName: '', accountNo: '', ifscCode: '', branchName: '',
                  joinedDate: new Date().toISOString().split('T')[0],
                  Upload: { pic: [], document: [] }
                });
              }}
              className="bg-gray-100 text-gray-700 px-8 rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Staff Directory List */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Staff Directory</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm tracking-wider uppercase">
                <th className="p-5 font-semibold border-b border-gray-200">Profile</th>
                <th className="p-5 font-semibold border-b border-gray-200">Name & ID</th>
                <th className="p-5 font-semibold border-b border-gray-200">Role</th>
                <th className="p-5 font-semibold border-b border-gray-200">Salary</th>
                <th className="p-5 font-semibold border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr 
                  key={staff.id || staff._id} 
                  onClick={() => showStaffDetails(staff)}
                  className="border-b border-gray-50 hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                  title="Click to view full details"
                >
                  <td className="p-5">
                    {staff.Upload?.pic?.length > 0 ? (
                      <img src={staff.Upload.pic[0]} alt={staff.name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 group-hover:border-indigo-300 transition-colors" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border-2 border-transparent">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-gray-800">{staff.name}</p>
                    <p className="text-sm text-gray-500">{staff.email}</p>
                    {staff.mobile && <p className="text-xs text-gray-400 mt-0.5">{staff.mobile}</p>}
                  </td>
                  <td className="p-5">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-5 font-bold text-emerald-600 text-lg">
                    ₹{staff.salary}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => handleEdit(staff, e)}
                        className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Staff"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(staff.id || staff._id, e)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Staff"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <UserPlus size={48} className="mb-4 text-gray-200" />
                      <p className="text-lg font-medium">No staff members found.</p>
                      <p className="text-sm">Add a new staff member to see them listed here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
