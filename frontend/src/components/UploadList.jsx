import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, Users, ClipboardList, User, AlertCircle, Trash2, ChevronRight, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

function UploadList() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTasks: 0,
    tasksPerAgent: []
  });
  const [distributionDetails, setDistributionDetails] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [agentTasks, setAgentTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(false);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setDistributionDetails(null);
    } else {
      toast.error('Please select a valid CSV or Excel file');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/tasks/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.message) {
        setDistributionDetails(response.data.distribution);
        toast.success('Tasks distributed successfully!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
          icon: '✅',
        });
        setFile(null);
        // Refresh stats after successful upload
        fetchStats();
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Error uploading file. Please try again.';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (error.response.data.invalidRows) {
              errorMessage = (
                <div>
                  <p>Invalid data in the following rows:</p>
                  <ul className="mt-2">
                    {error.response.data.invalidRows.map((row, index) => (
                      <li key={index} className="text-sm">
                        Row {index + 1}: Missing {!row.FirstName ? 'FirstName' : ''} {!row.Phone ? 'Phone' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            } else {
              errorMessage = error.response.data.message || 'Invalid file format or empty data';
            }
            break;
          case 401:
            errorMessage = 'Please login again to continue';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = error.response.data.message || 'An error occurred while uploading the file';
        }
      }

      toast.error(errorMessage, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        icon: '❌',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClearTasks = async () => {
    if (!window.confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('http://localhost:5000/api/tasks/clear', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.message) {
        toast.success('All tasks cleared successfully!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
          icon: '✅',
        });
        setDistributionDetails(null);
        // Refresh stats after clearing
        fetchStats();
      }
    } catch (error) {
      console.error('Error clearing tasks:', error);
      toast.error(error.response?.data?.message || 'Error clearing tasks. Please try again.', {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        icon: '❌',
      });
    } finally {
      setClearing(false);
    }
  };

  const handleAgentClick = async (agentId) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
      return;
    }

    setLoadingTasks(true);
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
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleMarkTaskCompleted = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/tasks/task/${taskId}/complete`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh the agent's tasks without closing the list
      if (expandedAgent) {
        const response = await axios.get(`http://localhost:5000/api/tasks/agent/${expandedAgent}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setAgentTasks(prev => ({
          ...prev,
          [expandedAgent]: response.data
        }));
      }
      
      toast.success('Task marked as completed');
    } catch (error) {
      console.error('Error marking task as completed:', error);
      toast.error('Failed to mark task as completed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Agents Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Agents</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalAgents}</p>
            </div>
          </div>
        </div>

        {/* Total Tasks Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <ClipboardList className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        {/* Average Tasks per Agent Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Tasks/Agent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalAgents > 0 ? (stats.totalTasks / stats.totalAgents).toFixed(1) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Tasks Button */}
      <div className="flex justify-end">
        <button
          onClick={handleClearTasks}
          disabled={clearing || stats.totalTasks === 0}
          className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${clearing || stats.totalTasks === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
        >
          {clearing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Tasks
            </>
          )}
        </button>
      </div>

      {/* Distribution Details */}
      {distributionDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Distribution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{distributionDetails.totalTasks}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Base Tasks per Agent</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{distributionDetails.tasksPerAgent}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Agents with Extra Tasks</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{distributionDetails.agentsWithExtraTasks}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tasks per Agent Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks Distribution</h3>
          {stats.totalTasks > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Tasks: {stats.totalTasks}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Agent Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tasks Assigned
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.tasksPerAgent.map((agent, index) => (
                <React.Fragment key={index}>
                  <tr 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleAgentClick(agent._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        {expandedAgent === agent._id ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        {agent.agentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.taskCount}
                    </td>
                  </tr>
                  {expandedAgent === agent._id && (
                    <tr>
                      <td colSpan="2" className="px-6 py-4">
                        {loadingTasks ? (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Assigned Tasks</h4>
                            {agentTasks[agent._id]?.tasks?.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${agentTasks[agent._id]?.stats?.completionPercentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {agentTasks[agent._id]?.stats?.completionPercentage}%
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {agentTasks[agent._id]?.stats?.completedTasks} of {agentTasks[agent._id]?.stats?.totalTasks} completed
                                  </span>
                                </div>
                                {agentTasks[agent._id]?.tasks.map((task, taskIndex) => (
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkTaskCompleted(task._id);
                                          }}
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
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
          <FileSpreadsheet className="w-6 h-6 mr-2" />
          Upload Task List
        </h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
                  {file ? file.name : 'Select a CSV or Excel file'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supported formats: CSV, XLSX, XLS
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">File Requirements</h4>
                <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  <li>File must contain FirstName and Phone columns</li>
                  <li>Notes column is optional</li>
                  <li>Exactly 5 agents must exist in the system</li>
                  <li>Tasks will be distributed equally among agents</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${uploading || !file ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {uploading ? 'Uploading...' : 'Upload and Distribute Tasks'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadList;