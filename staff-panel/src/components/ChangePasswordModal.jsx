import { useState } from 'react';
import api from '../api';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }
    setError('');
    setLoading(true);
    try {
      await api.put('/staff/password', { currentPassword, newPassword });
      Swal.fire('Success', 'Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </div>
        <div className="p-6">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
          <form id="password-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
              <input type="password" required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <input type="password" required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
          <button form="password-form" type="submit" disabled={loading} className="px-6 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
