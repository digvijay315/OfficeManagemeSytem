import { useState, useEffect } from 'react';
import api from '../api';
import { showAlert, showLoader, closeLoader, showConfirm } from '../utils/swalUtils';
import { ListPlus, Trash2, Library, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomTasks() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/admin/predefined-tasks?page=${page}&limit=10`);
      setTasks(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('Error fetching predefined tasks');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    showLoader('Saving', 'Adding predefined task...');
    try {
      await api.post('/admin/predefined-tasks', formData);
      setFormData({ title: '', description: '' });
      fetchTasks();
      closeLoader();
      showAlert('Success', 'Predefined task added!', 'success');
    } catch (err) {
      closeLoader();
      showAlert('Error', 'Failed to add task', 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Delete Task', 'Remove this predefined task?');
    if (!confirmed) return;

    showLoader('Deleting', 'Removing task...');
    try {
      await api.delete(`/admin/predefined-tasks/${id}`);
      fetchTasks();
      closeLoader();
      showAlert('Deleted', 'Task removed', 'success');
    } catch (err) {
      closeLoader();
      showAlert('Error', 'Failed to delete task', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 p-8 rounded-2xl shadow-lg text-white flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Library size={28} /> Task Library
          </h2>
          <p className="text-purple-200">Manage your predefined tasks for quick assignment.</p>
        </div>
        <div className="hidden md:flex h-16 w-16 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm">
          <Library size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ListPlus size={20} className="text-purple-600" />
            Add Predefined Task
          </h2>
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              rows="3"
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-900 transition-colors shadow-lg shadow-purple-200 transform hover:-translate-y-1">
            Add to Library
          </button>
        </form>
      </div>

      <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
          <Library size={20} className="text-purple-600" /> Saved Tasks
        </h2>
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id || task._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div>
                <h3 className="font-bold text-gray-800">{task.title}</h3>
                <p className="text-sm text-gray-500">{task.description}</p>
              </div>
              <button 
                onClick={() => handleDelete(task.id || task._id)}
                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg">
              No predefined tasks added yet.
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
