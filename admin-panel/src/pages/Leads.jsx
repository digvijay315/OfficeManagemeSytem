import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import Swal from 'sweetalert2';
import { PlusCircle, ClipboardList, CheckCircle, Clock, User, UserPlus, FileImage, X } from 'lucide-react';

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        leadType: 'Services',
        location: '',
        customerName: '',
        customerMobile: '',
        description: '',
    });
    const [photoUrl, setPhotoUrl] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch leads
    const fetchLeads = async (pageToFetch = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/leads?page=${pageToFetch}&limit=10`);
            setLeads(res.data.data || []);
            setTotalPages(res.data.pages || 1);
            setPage(res.data.page || 1);
        } catch (err) {
            console.error('Error fetching leads:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Staff for Assignment
    const fetchStaff = async () => {
        try {
            const res = await api.get('/admin/staff?limit=1000');
            setStaffList(res.data.data);
        } catch (err) {
            console.error('Error fetching staff:', err);
        }
    };

    useEffect(() => {
        fetchLeads(page);
    }, [page]);

    useEffect(() => {
        fetchStaff();
    }, []);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('files', file);
        try {
            const uploadRes = await api.post('/upload/upload-files', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (uploadRes.data.urls && uploadRes.data.urls.length > 0) {
                setPhotoUrl(uploadRes.data.urls[0]);
            }
                
        } catch (err) {
            Swal.fire('Error', 'Failed to upload photo', 'error');
        }
    };

    

    const removePhoto = () => {
        setPhotoUrl('');
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();

        const newLead = {
            ...formData,
            photo: photoUrl
        };

        try {
            await api.post('/admin/leads', newLead);
            await Swal.fire('Success', 'Lead created successfully', 'success');
            setShowForm(false);
            setFormData({
                leadType: 'Services',
                location: '',
                customerName: '',
                customerMobile: '',
                description: '',
            });
            setPhotoUrl('');
            fetchLeads(page);
        } catch (err) {
            Swal.fire('Error', 'Failed to create lead', 'error');
        }
    };

    const handleAssign = async (leadId, staffId) => {
        if (!staffId) return;
        
        try {
            await api.post(`/admin/leads/${leadId}/assign`, { staff_id: staffId });
            await Swal.fire('Assigned', 'Lead assigned to staff as a task', 'success');
            fetchLeads(page);
        } catch (err) {
            Swal.fire('Error', 'Failed to assign lead', 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="text-indigo-600" /> Lead Management
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Manage leads and assign them to staff members.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <PlusCircle size={20} /> Add New Lead
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Lead</h3>
                    <form onSubmit={handleCreateLead} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Type</label>
                                <select 
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.leadType}
                                    onChange={e => setFormData({...formData, leadType: e.target.value})}
                                >
                                    <option value="Services">Services</option>
                                    <option value="Sale">Sale</option>
                                    <option value="Internet connection">Internet connection</option>
                                    <option value="Fiber work">Fiber work</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                    placeholder="Enter Location"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.customerName}
                                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                                    placeholder="Enter Customer Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Mobile No.</label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.customerMobile}
                                    onChange={e => setFormData({...formData, customerMobile: e.target.value})}
                                    placeholder="Enter Mobile Number"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                                <textarea 
                                    required rows="3"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Enter details..."
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo Upload (Optional)</label>
                                {!photoUrl ? (
                                    <input 
                                        type="file" accept="image/*"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={handlePhotoUpload}
                                    />
                                ) : (
                                    <div className="relative inline-block mt-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                                        <img src={photoUrl} alt="Uploaded preview" className="w-24 h-24 object-cover rounded-lg" />
                                        <button 
                                            type="button" 
                                            onClick={removePhoto}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                                            title="Remove photo"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 mr-3 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Lead</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Lead Details</th>
                                <th className="px-6 py-4 font-semibold">Customer Info</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Assignment / Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                            ) : leads.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No leads found.</td></tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{lead.leadType}</div>
                                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={lead.description}>{lead.description}</div>
                                            {lead.photo && (
                                                <a href={lead.photo} target="_blank" rel="noreferrer" className="text-indigo-500 text-xs flex items-center gap-1 mt-2 hover:underline">
                                                    <FileImage size={12}/> View Photo
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">{lead.customerName}</div>
                                            <div className="text-gray-500 text-xs">{lead.customerMobile}</div>
                                            <div className="text-gray-500 text-xs mt-1">{lead.location}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold flex w-fit items-center gap-1"><Clock size={12}/> Pending</span>}
                                            {lead.status === 'assigned' && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex w-fit items-center gap-1"><User size={12}/> Assigned</span>}
                                            {lead.status === 'completed' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex w-fit items-center gap-1"><CheckCircle size={12}/> Completed</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.status === 'pending' ? (
                                                <select 
                                                    className="w-full max-w-[180px] px-3 py-1.5 border rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                                                    onChange={(e) => handleAssign(lead._id, e.target.value)}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Assign To...</option>
                                                    {staffList.map(staff => (
                                                        <option key={staff._id || staff.id} value={staff._id || staff.id}>{staff.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div>
                                                    {lead.assignedTo ? (
                                                        <div className="text-sm">
                                                            <span className="text-gray-500">Assigned: </span>
                                                            <span className="font-semibold">{lead.assignedTo.name}</span>
                                                        </div>
                                                    ) : '-'}
                                                    {lead.status === 'completed' && lead.completedBy && (
                                                        <div className="text-sm mt-1">
                                                            <span className="text-emerald-600 font-medium text-xs">Done by: {lead.completedBy.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                            Page <span className="font-semibold text-gray-800">{page}</span> of <span className="font-semibold text-gray-800">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button 
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
