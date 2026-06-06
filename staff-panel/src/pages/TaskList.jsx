import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock, PlusCircle } from 'lucide-react';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/staff/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/staff/tasks/${taskId}`, 
        { status: 'completed', comment: comments[taskId] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
    } catch (err) {
      alert('Error updating task');
    }
  };

  const handleAddAdditionalTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/staff/tasks', 
        { ...newTask, date: new Date().toISOString().split('T')[0], type: 'additional' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setNewTask({ title: '', description: '' });
      fetchTasks();
    } catch (err) {
      alert('Error adding task');
    }
  };

  const emergencyTasks = tasks.filter(t => t.type === 'emergency' && t.status !== 'completed');
  const regularTasks = tasks.filter(t => t.type !== 'emergency' && t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const TaskCard = ({ task }) => (
    <div className={`p-5 rounded-xl border ${task.type === 'emergency' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} shadow-sm relative`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-bold text-lg ${task.type === 'emergency' ? 'text-red-700' : 'text-gray-800'}`}>
          {task.title}
        </h3>
        {task.type === 'emergency' && (
          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
            <AlertCircle size={12} /> Emergency
          </span>
        )}
        {task.type === 'additional' && (
          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-bold">Self Assigned</span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-4">{task.description}</p>
      
      {task.status !== 'completed' ? (
        <div className="mt-4 space-y-3">
          <input 
            type="text" 
            placeholder="Add a comment before completing (optional)" 
            className="w-full text-sm px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
            value={comments[task.id] || ''}
            onChange={(e) => setComments({...comments, [task.id]: e.target.value})}
          />
          <button 
            onClick={() => handleComplete(task.id || task._id)}
            className={`w-full py-2 rounded-lg text-white font-medium flex justify-center items-center gap-2 ${task.type === 'emergency' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <CheckCircle size={18} /> Mark as Completed
          </button>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-green-700 flex items-center gap-1 font-medium"><CheckCircle size={16}/> Completed</p>
          {task.comment && <p className="text-sm text-gray-500 mt-1 italic">"{task.comment}"</p>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">My Task Board</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} /> Log Additional Work
        </button>
      </div>

      {emergencyTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2"><AlertCircle size={20} /> Emergency Tasks (Priority)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyTasks.map(t => <TaskCard key={t.id || t._id} task={t} />)}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Clock size={20} /> Pending Tasks</h3>
        {regularTasks.length === 0 ? (
          <div className="bg-gray-50 p-8 text-center rounded-xl border border-dashed border-gray-300 text-gray-500">
            No pending tasks. Great job!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularTasks.map(t => <TaskCard key={t.id || t._id} task={t} />)}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><CheckCircle size={20} /> Completed Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
          {completedTasks.map(t => <TaskCard key={t.id || t._id} task={t} />)}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Log Additional Task</h3>
            <p className="text-sm text-gray-500 mb-4">Did you complete something that wasn't assigned? Log it here.</p>
            <form onSubmit={handleAddAdditionalTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
