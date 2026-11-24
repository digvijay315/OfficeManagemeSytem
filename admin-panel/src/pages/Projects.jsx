import { useState, useEffect } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader, showConfirm } from '../utils/swalUtils';
import { 
  FolderKanban, Plus, Search, Filter, Calendar, ExternalLink, 
  Globe, Server, ShieldCheck, Clock, AlertTriangle, CheckCircle2, 
  Trash2, Edit, Eye, X, Phone, Mail, Building2, Tag, Laptop, 
  Code2, Smartphone, DollarSign, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Layers, AlertCircle
} from 'lucide-react';

const PROJECT_TYPES = ['Website', 'Mobile App', 'Software', 'Web Application', 'E-Commerce', 'Desktop App', 'Other'];
const CATEGORIES = ['Hospital', 'Shop', 'College', 'School', 'Restaurant', 'Corporate', 'Real Estate', 'Coaching', 'NGO', 'Other'];
const STATUSES = ['In Progress', 'Live', 'Completed', 'Maintenance', 'On Hold', 'Cancelled'];
const DURATIONS = ['6 Months', '1 Year', '2 Years', '3 Years', '5 Years', 'Lifetime'];
const SERVICE_TYPES = [
  'Domain',
  'Server / Hosting Renewal',
  'AMC Renewal',
  'SSL Certificate',
  'SMS Gateway',
  'WhatsApp API Gateway',
  'Business Email',
  'Play Store / App Store',
  'Cloud Storage / CDN',
  'Other Custom Service'
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    liveProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    expiringSoonCount: 0,
    expiredCount: 0
  });

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRenewalAlert, setFilterRenewalAlert] = useState(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const initialFormState = {
    name: '',
    projectType: 'Website',
    category: 'Shop',
    status: 'In Progress',
    projectUrl: '',
    techStack: '',
    description: '',
    
    // Dates
    startDate: '',
    endDate: '',
    publishDate: '',

    // Base Costs & Initial Renewals
    softwarePrice: '',
    serverPrice: '',
    serverDuration: '1 Year',
    serverStartDate: '',
    serverExpiryDate: '',

    amcPrice: '',
    amcDuration: '1 Year',
    amcStartDate: '',
    amcExpiryDate: '',

    // Add More items
    additionalServices: [],

    // Client Details
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientOrganization: '',
    clientAddress: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Helper to auto-calculate expiry date
  const calculateExpiryDate = (startDateStr, durationStr) => {
    if (!startDateStr) return '';
    const date = new Date(startDateStr);
    if (isNaN(date.getTime())) return '';

    let years = 1;
    let months = 0;

    if (durationStr === '6 Months') {
      months = 6;
      years = 0;
    } else if (durationStr === '1 Year') {
      years = 1;
    } else if (durationStr === '2 Years') {
      years = 2;
    } else if (durationStr === '3 Years') {
      years = 3;
    } else if (durationStr === '5 Years') {
      years = 5;
    } else if (durationStr === 'Lifetime') {
      years = 20;
    }

    date.setFullYear(date.getFullYear() + years);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  // Helper for status badge
  const getDaysRemainingInfo = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'expired', 
        label: `Expired ${Math.abs(diffDays)}d ago`, 
        days: diffDays, 
        badgeClass: 'bg-red-50 text-red-700 border-red-200' 
      };
    } else if (diffDays <= 30) {
      return { 
        status: 'expiring_soon', 
        label: `Expiring in ${diffDays}d`, 
        days: diffDays, 
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-300' 
      };
    } else {
      return { 
        status: 'active', 
        label: `${diffDays}d left`, 
        days: diffDays, 
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      };
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/projects/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching project stats:', err);
    }
  };

  // Fetch Projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        search,
        category: filterCategory,
        projectType: filterType,
        status: filterStatus,
        renewalAlert: filterRenewalAlert ? 'true' : 'false'
      });
      const res = await api.get(`/admin/projects?${params.toString()}`);
      setProjects(res.data.data);
      setTotalPages(res.data.pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching projects:', err);
      showAlert('Error', 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [page, search, filterType, filterCategory, filterStatus, filterRenewalAlert]);

  // Handle Server Start Date / Duration change
  const handleServerDateChange = (start, duration) => {
    const sDate = start !== undefined ? start : formData.serverStartDate;
    const dur = duration !== undefined ? duration : formData.serverDuration;
    const autoExpiry = calculateExpiryDate(sDate, dur);
    setFormData(prev => ({
      ...prev,
      serverStartDate: sDate,
      serverDuration: dur,
      serverExpiryDate: autoExpiry || prev.serverExpiryDate
    }));
  };

  // Handle AMC Start Date / Duration change
  const handleAmcDateChange = (start, duration) => {
    const sDate = start !== undefined ? start : formData.amcStartDate;
    const dur = duration !== undefined ? duration : formData.amcDuration;
    const autoExpiry = calculateExpiryDate(sDate, dur);
    setFormData(prev => ({
      ...prev,
      amcStartDate: sDate,
      amcDuration: dur,
      amcExpiryDate: autoExpiry || prev.amcExpiryDate
    }));
  };

  // Add Dynamic Additional Service
  const handleAddService = () => {
    const today = new Date().toISOString().split('T')[0];
    const expiry = calculateExpiryDate(today, '1 Year');
    setFormData(prev => ({
      ...prev,
      additionalServices: [
        ...prev.additionalServices,
        {
          serviceType: 'Domain',
          title: '',
          amount: '',
          duration: '1 Year',
          startDate: today,
          expiryDate: expiry,
          provider: '',
          notes: ''
        }
      ]
    }));
  };

  // Update Dynamic Additional Service
  const handleServiceChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.additionalServices];
      updated[index] = { ...updated[index], [field]: value };

      // Auto update expiry if startDate or duration changes
      if (field === 'startDate' || field === 'duration') {
        const sDate = field === 'startDate' ? value : updated[index].startDate;
        const dur = field === 'duration' ? value : updated[index].duration;
        if (sDate && dur) {
          updated[index].expiryDate = calculateExpiryDate(sDate, dur);
        }
      }

      return { ...prev, additionalServices: updated };
    });
  };

  // Remove Dynamic Additional Service
  const handleRemoveService = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }));
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingId(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      ...initialFormState,
      startDate: today,
      serverStartDate: today,
      serverExpiryDate: calculateExpiryDate(today, '1 Year'),
      amcStartDate: today,
      amcExpiryDate: calculateExpiryDate(today, '1 Year')
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (project) => {
    setEditingId(project._id);
    setFormData({
      name: project.name || '',
      projectType: project.projectType || 'Website',
      category: project.category || 'Shop',
      status: project.status || 'In Progress',
      projectUrl: project.projectUrl || '',
      techStack: project.techStack || '',
      description: project.description || '',

      startDate: project.startDate || '',
      endDate: project.endDate || '',
      publishDate: project.publishDate || '',

      softwarePrice: project.softwarePrice || '',
      serverPrice: project.serverPrice || '',
      serverDuration: project.serverDuration || '1 Year',
      serverStartDate: project.serverStartDate || '',
      serverExpiryDate: project.serverExpiryDate || '',

      amcPrice: project.amcPrice || '',
      amcDuration: project.amcDuration || '1 Year',
      amcStartDate: project.amcStartDate || '',
      amcExpiryDate: project.amcExpiryDate || '',

      additionalServices: Array.isArray(project.additionalServices) ? project.additionalServices.map(s => ({
        serviceType: s.serviceType || 'Domain',
        title: s.title || '',
        amount: s.amount || '',
        duration: s.duration || '1 Year',
        startDate: s.startDate || '',
        expiryDate: s.expiryDate || '',
        provider: s.provider || '',
        notes: s.notes || ''
      })) : [],

      clientName: project.clientName || '',
      clientPhone: project.clientPhone || '',
      clientEmail: project.clientEmail || '',
      clientOrganization: project.clientOrganization || '',
      clientAddress: project.clientAddress || ''
    });
    setIsFormModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert('Validation Error', 'Project name is required', 'warning');
      return;
    }

    showLoader(editingId ? 'Updating Project...' : 'Creating Project...', 'Please wait');
    try {
      const payload = {
        ...formData,
        softwarePrice: Number(formData.softwarePrice) || 0,
        serverPrice: Number(formData.serverPrice) || 0,
        amcPrice: Number(formData.amcPrice) || 0,
        additionalServices: formData.additionalServices.map(s => ({
          ...s,
          amount: Number(s.amount) || 0
        }))
      };

      if (editingId) {
        await api.put(`/admin/projects/${editingId}`, payload);
        showAlert('Success', 'Project updated successfully!', 'success');
      } else {
        await api.post('/admin/projects', payload);
        showAlert('Success', 'New project added successfully!', 'success');
      }

      setIsFormModalOpen(false);
      fetchProjects();
      fetchStats();
    } catch (err) {
      console.error('Error saving project:', err);
      showAlert('Error', err.response?.data?.error || 'Failed to save project', 'error');
    } finally {
      closeLoader();
    }
  };

  // Delete Project
  const handleDelete = async (project) => {
    const confirmed = await showConfirm(
      'Delete Project?',
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    showLoader('Deleting...', 'Removing project');
    try {
      await api.delete(`/admin/projects/${project._id}`);
      showAlert('Deleted', 'Project deleted successfully', 'success');
      fetchProjects();
      fetchStats();
      if (selectedProject?._id === project._id) {
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      showAlert('Error', 'Failed to delete project', 'error');
    } finally {
      closeLoader();
    }
  };

  // Calculate live total amount in modal
  const calculateTotalModalAmount = () => {
    const sw = Number(formData.softwarePrice) || 0;
    const srv = Number(formData.serverPrice) || 0;
    const amc = Number(formData.amcPrice) || 0;
    const extras = formData.additionalServices.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return sw + srv + amc + extras;
  };

  // Status color badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Live':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Maintenance':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'On Hold':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 p-6 md:p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <FolderKanban className="text-indigo-200" size={28} />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Projects</h1>
          </div>
          <p className="text-indigo-200 text-sm md:text-base max-w-2xl">
            Track all completed and active client projects, delivery timelines, pricing, domain, server & AMC renewal dates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl shadow-lg shadow-indigo-950/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={20} className="stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Projects</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalProjects}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Layers size={24} />
          </div>
        </div>

        {/* Live Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live & Active</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.liveProjects}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.inProgressProjects}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</p>
            <p className="text-xl font-black text-indigo-700 mt-1">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Renewals Alert */}
        <div 
          onClick={() => setFilterRenewalAlert(!filterRenewalAlert)}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            filterRenewalAlert 
              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400' 
              : 'bg-white border-gray-100 shadow-sm hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${filterRenewalAlert ? 'text-amber-100' : 'text-gray-500'}`}>
                Renewals Alert
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-black ${filterRenewalAlert ? 'text-white' : 'text-amber-600'}`}>
                  {stats.expiringSoonCount + stats.expiredCount}
                </span>
                {(stats.expiringSoonCount > 0 || stats.expiredCount > 0) && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    filterRenewalAlert ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Action
                  </span>
                )}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              filterRenewalAlert ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
            }`}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, client, phone, URL..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Types</option>
            {PROJECT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter & Renewal Alerts Button Group (Side-by-Side) */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Renewal Alerts Button right beside Status */}
            <button
              type="button"
              onClick={() => { setFilterRenewalAlert(!filterRenewalAlert); setPage(1); }}
              className={`h-10 px-3.5 text-sm font-semibold rounded-xl border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                filterRenewalAlert
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
              }`}
              title="Filter projects with expiring or expired domains/servers/AMC"
            >
              <AlertTriangle size={16} className={filterRenewalAlert ? 'text-white' : 'text-amber-600'} />
              <span>Renewals Alert</span>
              {(stats.expiringSoonCount > 0 || stats.expiredCount > 0) && (
                <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  filterRenewalAlert ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {stats.expiringSoonCount + stats.expiredCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="inline-block animate-spin text-indigo-600 mb-3">
            <RefreshCw size={32} />
          </div>
          <p className="text-gray-500 font-medium">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <FolderKanban className="mx-auto text-gray-300 mb-4" size={54} />
          <h3 className="text-lg font-bold text-gray-800">No Projects Found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            {search || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' || filterRenewalAlert
              ? 'No projects match your current filters. Try resetting search or filter criteria.'
              : 'You have not added any projects yet. Click "Add New Project" to get started.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const totalProjectCost = (project.softwarePrice || 0) + 
              (project.serverPrice || 0) + 
              (project.amcPrice || 0) + 
              (Array.isArray(project.additionalServices) 
                ? project.additionalServices.reduce((sum, s) => sum + (s.amount || 0), 0) 
                : 0);

            const hasAlerts = project.renewalAlerts && project.renewalAlerts.length > 0;

            return (
              <div
                key={project._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(project.status)}`}>
                            {project.status}
                          </span>
                          {hasAlerts && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs">
                              <AlertTriangle size={11} className="text-amber-600" />
                              <span>Renewals Due</span>
                            </span>
                          )}
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {project.projectType}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {project.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                      </div>
                      
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl.startsWith('http') ? project.projectUrl : `https://${project.projectUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Live URL"
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>

                    {/* Client info */}
                    <div className="text-xs text-gray-600 space-y-1 mt-3">
                      {project.clientOrganization && (
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          <Building2 size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate">{project.clientOrganization}</span>
                        </div>
                      )}
                      {project.clientName && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="text-gray-400 font-semibold text-[10px]">CLIENT:</span>
                          <span className="font-medium">{project.clientName}</span>
                          {project.clientPhone && (
                            <span className="text-gray-400">({project.clientPhone})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body - Dates & Pricing */}
                  <div className="p-5 space-y-3">
                    {/* Key Dates */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[10px] font-semibold uppercase">Started</span>
                        <span className="font-medium text-gray-700">{project.startDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] font-semibold uppercase">Published / Live</span>
                        <span className="font-medium text-gray-700">{project.publishDate || project.endDate || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Renewal / Expiry Alerts on Card */}
                    {hasAlerts && (
                      <div className="space-y-1.5">
                        {project.renewalAlerts.slice(0, 2).map((alert, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border ${
                              alert.status === 'expired' 
                                ? 'bg-red-50 text-red-800 border-red-200' 
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 font-medium truncate">
                              <AlertTriangle size={13} className="shrink-0" />
                              <span className="truncate">{alert.item}</span>
                            </span>
                            <span className="font-bold text-[11px] shrink-0 ml-2">
                              {alert.status === 'expired' ? 'Expired' : `Due: ${alert.expiryDate}`}
                            </span>
                          </div>
                        ))}
                        {project.renewalAlerts.length > 2 && (
                          <p className="text-[11px] text-amber-600 font-semibold text-right">
                            +{project.renewalAlerts.length - 2} more renewals alert
                          </p>
                        )}
                      </div>
                    )}

                    {/* Breakdown Preview */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {project.softwarePrice > 0 && (
                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                          Site: ₹{project.softwarePrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      {project.serverPrice > 0 && (
                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                          Server: ₹{project.serverPrice.toLocaleString('en-IN')} ({project.serverDuration || '1Y'})
                        </span>
                      )}
                      {project.amcPrice > 0 && (
                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                          AMC: ₹{project.amcPrice.toLocaleString('en-IN')} ({project.amcDuration || '1Y'})
                        </span>
                      )}
                      {Array.isArray(project.additionalServices) && project.additionalServices.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                          +{project.additionalServices.length} Extra Service{project.additionalServices.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-gray-400 block">Total Value</span>
                    <span className="text-base font-black text-gray-900">
                      ₹{totalProjectCost.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedProject(project); setIsDetailModalOpen(true); }}
                      title="View Project Details"
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      onClick={() => openEditModal(project)}
                      title="Edit Project"
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                    >
                      <Edit size={17} />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      title="Delete Project"
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">
            Showing <span className="font-bold text-gray-800">{(page - 1) * 10 + 1}</span> to{' '}
            <span className="font-bold text-gray-800">{Math.min(page * 10, totalItems)}</span> of{' '}
            <span className="font-bold text-gray-800">{totalItems}</span> projects
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD / EDIT PROJECT MODAL
         ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-auto border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                  <FolderKanban size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    {editingId ? 'Edit Project' : 'Add New Project'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Fill in project milestones, dates, client info, and dynamic service renewals.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* SECTION 1: Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-2 h-5 bg-indigo-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">1. Project Overview</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Project Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. City Life Hospital Management System"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Project Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {PROJECT_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Project Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Live Project URL / Domain
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://dumkahospital.com"
                      value={formData.projectUrl}
                      onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Tech Stack */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Technologies / Stack (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React.js, Node.js, Express, MongoDB, Tailwind CSS"
                      value={formData.techStack}
                      onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Project Description & Notes
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Brief overview of client requirements, features, or notes..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Dates */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-2 h-5 bg-indigo-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">2. Project Dates</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Starting Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Target / Completion Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Live / Publish Date
                    </label>
                    <input
                      type="date"
                      value={formData.publishDate}
                      onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Client & Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-2 h-5 bg-indigo-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">3. Client Contact Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Client / Contact Person Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Kumar"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile / Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Client Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. contact@dumkahospital.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Organization / Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dumka Super Specialty Hospital"
                      value={formData.clientOrganization}
                      onChange={(e) => setFormData({ ...formData, clientOrganization: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Address / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Road, Court Area, Dumka, Jharkhand"
                      value={formData.clientAddress}
                      onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Base Pricing & Renewals */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-2 h-5 bg-indigo-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">4. Software, Server & AMC Pricing</h3>
                </div>

                <div className="space-y-4">
                  {/* Software / Site Price */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="max-w-xs">
                      <label className="block text-xs font-bold text-gray-800 mb-1">
                        Software / Website Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 35000"
                          value={formData.softwarePrice}
                          onChange={(e) => setFormData({ ...formData, softwarePrice: e.target.value })}
                          className="w-full pl-8 pr-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Server / Hosting Section */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase">
                        <Server size={14} className="text-indigo-600" /> Server / Hosting Details
                      </h4>
                      <span className="text-[11px] text-gray-500 font-medium">Includes renewal dates</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Server Price (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={formData.serverPrice}
                            onChange={(e) => setFormData({ ...formData, serverPrice: e.target.value })}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Duration / Validity</label>
                        <select
                          value={formData.serverDuration}
                          onChange={(e) => handleServerDateChange(undefined, e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {DURATIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Starting Date</label>
                        <input
                          type="date"
                          value={formData.serverStartDate}
                          onChange={(e) => handleServerDateChange(e.target.value, undefined)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Expiry / End Date</label>
                        <input
                          type="date"
                          value={formData.serverExpiryDate}
                          onChange={(e) => setFormData({ ...formData, serverExpiryDate: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AMC Section */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase">
                        <ShieldCheck size={14} className="text-emerald-600" /> Annual Maintenance Contract (AMC)
                      </h4>
                      <span className="text-[11px] text-gray-500 font-medium">Includes renewal dates</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">AMC Price (₹)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            placeholder="e.g. 6000"
                            value={formData.amcPrice}
                            onChange={(e) => setFormData({ ...formData, amcPrice: e.target.value })}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Duration / Validity</label>
                        <select
                          value={formData.amcDuration}
                          onChange={(e) => handleAmcDateChange(undefined, e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {DURATIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Starting Date</label>
                        <input
                          type="date"
                          value={formData.amcStartDate}
                          onChange={(e) => handleAmcDateChange(e.target.value, undefined)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Expiry / End Date</label>
                        <input
                          type="date"
                          value={formData.amcExpiryDate}
                          onChange={(e) => setFormData({ ...formData, amcExpiryDate: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Add More Dynamic Services (Domain, SSL, extra servers, etc.) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-5 bg-indigo-600 rounded-full"></span>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                      5. Additional Services & Renewals (Domain, SSL, Extra Servers, etc.)
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddService}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add More Service</span>
                  </button>
                </div>

                {formData.additionalServices.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
                    <p className="text-xs text-gray-500">
                      No additional services added yet. Click &quot;Add More Service&quot; to add Domain price, SSL, SMS Gateway or other recurring services.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.additionalServices.map((service, index) => (
                      <div
                        key={index}
                        className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                            <Tag size={13} className="text-indigo-600" /> Service #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(index)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove Service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Service Type */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Service Type
                            </label>
                            <select
                              value={service.serviceType}
                              onChange={(e) => handleServiceChange(index, 'serviceType', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              {SERVICE_TYPES.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>

                          {/* Title / Description */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Name / Domain / Notes
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. dumkahospital.com / AWS Mumbai"
                              value={service.title}
                              onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          {/* Amount */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Amount (₹)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                              <input
                                type="number"
                                placeholder="e.g. 1200"
                                value={service.amount}
                                onChange={(e) => handleServiceChange(index, 'amount', e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* Duration / Years */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Duration / Validity
                            </label>
                            <select
                              value={service.duration}
                              onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              {DURATIONS.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          {/* Starting Date */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Starting Date
                            </label>
                            <input
                              type="date"
                              value={service.startDate}
                              onChange={(e) => handleServiceChange(index, 'startDate', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          {/* Expiry Date */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Expiry / Renewal Date
                            </label>
                            <input
                              type="date"
                              value={service.expiryDate}
                              onChange={(e) => handleServiceChange(index, 'expiryDate', e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer / Submit */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 bg-white py-3">
                <div className="text-left">
                  <span className="text-xs text-gray-500 font-semibold block uppercase">Total Project Value</span>
                  <span className="text-xl font-black text-indigo-700">
                    ₹{calculateTotalModalAmount().toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition cursor-pointer"
                  >
                    {editingId ? 'Update Project' : 'Save Project'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW PROJECT DETAILS MODAL
         ======================================================== */}
      {isDetailModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col my-auto border border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-t-3xl">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getStatusBadge(selectedProject.status)}`}>
                    {selectedProject.status}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                    {selectedProject.projectType}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200">
                    {selectedProject.category}
                  </span>
                </div>
                <h2 className="text-2xl font-black">{selectedProject.name}</h2>
                {selectedProject.projectUrl && (
                  <a
                    href={selectedProject.projectUrl.startsWith('http') ? selectedProject.projectUrl : `https://${selectedProject.projectUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white mt-1 underline"
                  >
                    <ExternalLink size={13} />
                    <span>{selectedProject.projectUrl}</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Client Info Card */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Client Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {selectedProject.clientOrganization && (
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <Building2 size={16} className="text-indigo-600 shrink-0" />
                      <span>{selectedProject.clientOrganization}</span>
                    </div>
                  )}
                  {selectedProject.clientName && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-xs font-bold text-gray-400">CONTACT:</span>
                      <span>{selectedProject.clientName}</span>
                    </div>
                  )}
                  {selectedProject.clientPhone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone size={15} className="text-emerald-600 shrink-0" />
                      <a href={`tel:${selectedProject.clientPhone}`} className="hover:underline text-indigo-600 font-medium">
                        {selectedProject.clientPhone}
                      </a>
                    </div>
                  )}
                  {selectedProject.clientEmail && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail size={15} className="text-blue-600 shrink-0" />
                      <a href={`mailto:${selectedProject.clientEmail}`} className="hover:underline text-indigo-600">
                        {selectedProject.clientEmail}
                      </a>
                    </div>
                  )}
                  {selectedProject.clientAddress && (
                    <div className="md:col-span-2 text-xs text-gray-600">
                      <span className="font-semibold text-gray-500">Address: </span>
                      {selectedProject.clientAddress}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline & Dates */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Started</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedProject.startDate || 'N/A'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Target End</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedProject.endDate || 'N/A'}</span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase block">Published / Live</span>
                  <span className="text-sm font-bold text-indigo-900">{selectedProject.publishDate || 'N/A'}</span>
                </div>
              </div>

              {/* Services & Renewals Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Services, Pricing & Renewal Tracking
                </h4>

                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100/70 text-gray-700 font-semibold uppercase text-[10px] border-b border-gray-200">
                      <tr>
                        <th className="p-3">Service</th>
                        <th className="p-3">Tenure</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Renewal Status</th>
                        <th className="p-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Software / Site Price */}
                      {selectedProject.softwarePrice > 0 && (
                        <tr className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-gray-900 flex items-center gap-1.5">
                            <Laptop size={14} className="text-indigo-600" />
                            <span>Software / Site Development</span>
                          </td>
                          <td className="p-3 text-gray-500">One-time</td>
                          <td className="p-3 text-gray-500">-</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Completed
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            ₹{selectedProject.softwarePrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}

                      {/* Server / Hosting */}
                      {selectedProject.serverPrice > 0 && (
                        <tr className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-gray-900 flex items-center gap-1.5">
                            <Server size={14} className="text-indigo-600" />
                            <span>Server / Hosting</span>
                          </td>
                          <td className="p-3 text-gray-600">{selectedProject.serverDuration || '1 Year'}</td>
                          <td className="p-3 font-medium text-gray-800">{selectedProject.serverExpiryDate || 'N/A'}</td>
                          <td className="p-3">
                            {(() => {
                              const info = getDaysRemainingInfo(selectedProject.serverExpiryDate);
                              return info ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
                                  {info.label}
                                </span>
                              ) : <span className="text-gray-400">N/A</span>;
                            })()}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            ₹{selectedProject.serverPrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}

                      {/* AMC */}
                      {selectedProject.amcPrice > 0 && (
                        <tr className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-gray-900 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            <span>Annual Maintenance (AMC)</span>
                          </td>
                          <td className="p-3 text-gray-600">{selectedProject.amcDuration || '1 Year'}</td>
                          <td className="p-3 font-medium text-gray-800">{selectedProject.amcExpiryDate || 'N/A'}</td>
                          <td className="p-3">
                            {(() => {
                              const info = getDaysRemainingInfo(selectedProject.amcExpiryDate);
                              return info ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
                                  {info.label}
                                </span>
                              ) : <span className="text-gray-400">N/A</span>;
                            })()}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            ₹{selectedProject.amcPrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}

                      {/* Additional Services */}
                      {Array.isArray(selectedProject.additionalServices) && selectedProject.additionalServices.map((srv, idx) => {
                        const info = getDaysRemainingInfo(srv.expiryDate);
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-3 font-semibold text-gray-900 flex items-center gap-1.5">
                              <Tag size={13} className="text-indigo-600" />
                              <span>{srv.serviceType}</span>
                              {srv.title && <span className="text-gray-500 font-normal">({srv.title})</span>}
                            </td>
                            <td className="p-3 text-gray-600">{srv.duration || '1 Year'}</td>
                            <td className="p-3 font-medium text-gray-800">{srv.expiryDate || 'N/A'}</td>
                            <td className="p-3">
                              {info ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
                                  {info.label}
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold text-gray-900">
                              ₹{(srv.amount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="4" className="p-3 font-extrabold text-gray-800 text-right uppercase text-[11px]">
                          Grand Total Project Value:
                        </td>
                        <td className="p-3 text-right font-black text-indigo-700 text-sm">
                          ₹{(
                            (selectedProject.softwarePrice || 0) +
                            (selectedProject.serverPrice || 0) +
                            (selectedProject.amcPrice || 0) +
                            (Array.isArray(selectedProject.additionalServices)
                              ? selectedProject.additionalServices.reduce((sum, s) => sum + (s.amount || 0), 0)
                              : 0)
                          ).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Description & Tech Stack */}
              {(selectedProject.description || selectedProject.techStack) && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                  {selectedProject.techStack && (
                    <div>
                      <span className="font-bold text-gray-700 uppercase block mb-1">Tech Stack:</span>
                      <p className="text-gray-600">{selectedProject.techStack}</p>
                    </div>
                  )}
                  {selectedProject.description && (
                    <div>
                      <span className="font-bold text-gray-700 uppercase block mb-1">Description:</span>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedProject.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-3xl">
              <button
                onClick={() => {
                  const p = selectedProject;
                  setIsDetailModalOpen(false);
                  openEditModal(p);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit size={14} />
                <span>Edit Project</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
