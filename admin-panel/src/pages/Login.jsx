import { useState } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader } from '../utils/swalUtils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    showLoader('Logging in', 'Verifying credentials...');
    try {
      const res = await api.post('/auth/login', { email, password });
      closeLoader();
      if (res.data.user.role === 'admin' || res.data.user.role === 'subadmin') {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.location.href = '/';
      } else {
        showAlert('Access Denied', 'Only admin or subadmin can login here.', 'error');
      }
    } catch (err) {
      closeLoader();
      showAlert('Login Failed', 'Invalid credentials', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <img 
            src="/logo.png" 
            alt="S. NET DIGITAL BROADBAND" 
            className="w-48 mx-auto mb-4 object-contain" 
            style={{ clipPath: 'inset(4px)' }} 
          />
          <h1 className="text-2xl font-extrabold text-gray-800">S. NET DIGITAL BROADBAND</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Near LIC office, Lal Pokhra Dumka</p>
          <div className="text-xs text-gray-400 mt-2 space-y-0.5">
            <p>Phone: 7004451454 | Email: snetdumka@gmail.com</p>
            <p>GSTIN: 20BXRPP5495H1ZY | State: 20-Jharkhand</p>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h2 className="text-lg font-bold text-indigo-600">Admin Portal</h2>
          </div>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" 
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
