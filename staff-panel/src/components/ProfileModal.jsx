import { useState, useEffect } from 'react';
import api from '../api';
import { X, User, Mail, Phone, MapPin, Building, CreditCard, FileText, UploadCloud, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ProfileModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', address: '',
    documentName: '', documentNo: '',
    bankName: '', accountNo: '', ifscCode: '', branchName: '',
    Upload: { pic: [], document: [] }
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/staff/profile');
      const staff = res.data;
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        mobile: staff.mobile || '',
        address: staff.address || '',
        documentName: staff.documentName || '',
        documentNo: staff.documentNo || '',
        bankName: staff.bankName || '',
        accountNo: staff.accountNo || '',
        ifscCode: staff.ifscCode || '',
        branchName: staff.branchName || '',
        Upload: staff.Upload || { pic: [], document: [] }
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Error fetching profile', 'error');
    }
  };

  const handleFileChange = async (e, fieldName) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(fieldName);
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
      Swal.fire('Error', 'File upload failed!', 'error');
    } finally {
      setUploading("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/staff/profile', formData);
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user')), ...res.data.user }));
      Swal.fire('Success', 'Profile updated successfully!', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Error updating profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Name</label>
                <input className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Mobile</label>
                <input className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Address</label>
                <textarea className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} />
              </div>
            </div>

            <hr className="border-gray-100" />
            <h3 className="font-bold text-gray-700">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Bank Name</label>
                <input className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.bankName} onChange={e=>setFormData({...formData, bankName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Account No</label>
                <input className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.accountNo} onChange={e=>setFormData({...formData, accountNo: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">IFSC Code</label>
                <input className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.ifscCode} onChange={e=>setFormData({...formData, ifscCode: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Branch Name</label>
                <input className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.branchName} onChange={e=>setFormData({...formData, branchName: e.target.value})} />
              </div>
            </div>

            <hr className="border-gray-100" />
            <h3 className="font-bold text-gray-700">Documents & Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Document Type</label>
                <select className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.documentName} onChange={e=>setFormData({...formData, documentName: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="PAN Card">PAN Card</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Document No</label>
                <input className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.documentNo} onChange={e=>setFormData({...formData, documentNo: e.target.value})} />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Profile Picture {uploading === 'pic' && '(Uploading...)'}</label>
                {formData.Upload.pic.length > 0 && (
                  <div className="mb-3">
                    <img src={formData.Upload.pic[0]} alt="Profile" className="w-24 h-24 rounded-lg object-cover border border-gray-200 shadow-sm" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'pic')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Document Proof {uploading === 'document' && '(Uploading...)'}</label>
                {formData.Upload.document.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {formData.Upload.document.map((doc, idx) => (
                      <a key={idx} href={doc} target="_blank" rel="noreferrer" className="block shrink-0">
                        <img src={doc} alt={`Doc ${idx+1}`} className="w-24 h-24 rounded-lg object-cover border border-gray-200 shadow-sm hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
                <input type="file" multiple onChange={(e) => handleFileChange(e, 'document')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
            </div>

          </form>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
          <button form="profile-form" type="submit" disabled={loading} className="px-6 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
