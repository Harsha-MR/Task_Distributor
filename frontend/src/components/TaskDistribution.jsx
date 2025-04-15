import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Circle, AlertCircle, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TaskDistribution = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [agentTasks, setAgentTasks] = useState({});
  const [isClearingTasks, setIsClearingTasks] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await axios.get('http://localhost:5000/api/tasks/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch task statistics');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching task statistics');
      console.error('Error fetching task statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentClick = async (agentId) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/tasks/agent/${agentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAgentTasks(prev => ({
        ...prev,
        [agentId]: response.data
      }));
      setExpandedAgent(agentId);
    } catch (error) {
      console.error('Error fetching agent tasks:', error);
      toast.error('Failed to fetch tasks for this agent');
    }
  };

  const handleMarkTaskCompleted = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh the tasks for the expanded agent
      if (expandedAgent) {
        handleAgentClick(expandedAgent);
      }
      // Refresh the overall stats
      fetchStats();
    } catch (error) {
      console.error('Error marking task as completed:', error);
      toast.error('Failed to mark task as completed');
    }
  };

  const handleClearAllTasks = async () => {
    try {
      setIsClearingTasks(true);
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/tasks/clear', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh the stats
      fetchStats();
    } catch (error) {
      console.error('Error clearing all tasks:', error);
      toast.error('Failed to clear all tasks');
    } finally {
      setIsClearingTasks(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Users className="w-6 h-6 mr-2" />
          Task Distribution
        </h2>
        <button
          onClick={handleClearAllTasks}
          disabled={isClearingTasks || !stats?.totalTasks}
          className={`px-4 py-2 rounded-md text-white ${
            isClearingTasks || !stats?.totalTasks
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isClearingTasks ? 'Clearing...' : 'Clear All Tasks'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Agents</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.tasksPerAgent?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalTasks || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Circle className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Tasks per Agent</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.tasksPerAgent?.length > 0 
                    ? (stats.totalTasks / stats.tasksPerAgent.length).toFixed(1) 
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tasks Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats?.tasksPerAgent?.map((agent) => (
                <React.Fragment key={agent._id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.email || 'No email available'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agentTasks[agent._id]?.tasks?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <button
                        onClick={() => handleAgentClick(agent._id)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {expandedAgent === agent._id ? 'Hide Tasks' : 'View Tasks'}
                      </button>
                    </td>
                  </tr>
                  {expandedAgent === agent._id && (
                    <tr>
                      <td colSpan="4" className="px-0 py-0">
                        <div className="bg-gray-50 dark:bg-gray-700 p-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Assigned Tasks</h4>
                          {agentTasks[agent._id]?.tasks?.length > 0 ? (
                            <div className="space-y-3">
                              {agentTasks[agent._id].tasks.map((task, taskIndex) => (
                                <div key={taskIndex} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {task.firstName}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {task.phone}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(task.assignedAt).toLocaleDateString()}
                                      </span>
                                      <button
                                        onClick={() => handleMarkTaskCompleted(task._id)}
                                        disabled={task.completed}
                                        className={`p-1 rounded-full ${
                                          task.completed 
                                            ? 'text-green-500 cursor-default' 
                                            : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900'
                                        }`}
                                      >
                                        {task.completed ? (
                                          <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                          <Circle className="h-5 w-5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  {task.notes && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                      {task.notes}
                                    </p>
                                  )}
                                  {task.completed && (
                                    <p className="mt-1 text-xs text-green-500">
                                      Completed on {new Date(task.completedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                              No tasks assigned to this agent
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaskDistribution; 