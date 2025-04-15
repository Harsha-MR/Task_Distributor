import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, Users, ClipboardList, User, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function UploadList() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTasks: 0,
    tasksPerAgent: []
  });
  const [distributionDetails, setDistributionDetails] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [agentTasks, setAgentTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

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
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setDistributionDetails(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload', {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: '❌',
        position: 'top-center',
      });
      return;
    }

    // Validate file extension
    const allowedExtensions = ['.csv', '.xlsx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(`.${fileExtension}`)) {
      toast.error('Invalid file format. Please upload a CSV or Excel file (.csv, .xlsx)', {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: '❌',
        position: 'top-center',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/tasks/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.message) {
        setDistributionDetails(response.data.distribution);
        toast.success('Tasks have been successfully uploaded and distributed!', {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          },
          icon: '✅',
          position: 'top-center',
        });
        setFile(null);
        fetchStats();
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Error uploading file. Please try again.';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (error.response.data.message === 'No agents found. Please add agents before uploading tasks.') {
              errorMessage = (
                <div className="text-left">
                  <p className="font-semibold mb-2">No agents found!</p>
                  <p className="text-sm">Please add agents before uploading tasks. You can add agents by clicking the "Add Agent" button in the Agents section.</p>
                </div>
              );
            } else if (error.response.data.message === 'No valid tasks found in the file') {
              errorMessage = 'The file does not contain any valid tasks. Please check the file and try again.';
            } else if (error.response.data.invalidRows) {
              errorMessage = (
                <div className="text-left">
                  <p className="font-semibold mb-2">Invalid data found in the following rows:</p>
                  <ul className="list-disc pl-4 space-y-1">
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
            errorMessage = 'Your session has expired. Please login again to continue';
            break;
          case 500:
            errorMessage = 'Server error occurred. Please try again later';
            break;
          default:
            errorMessage = error.response.data.message || 'An error occurred while uploading the file';
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
        },
        icon: '❌',
        position: 'top-center',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAgentClick = async (agentId) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
      return;
    }

    try {
      setLoadingTasks(true);
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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: {
              background: '#10B981',
            },
            icon: '✅',
          },
          error: {
            style: {
              background: '#EF4444',
            },
            icon: '❌',
          },
        }}
      />
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

      {/* Distribution Details */}
      {/* {distributionDetails && (
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
      )} */}

      {/* Tasks Distribution Table */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
          <Users className="w-6 h-6 mr-2" />
          Tasks Distribution
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Agent Name
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
              {stats.tasksPerAgent.map((agent, index) => (
                <React.Fragment key={index}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.agentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.taskCount}
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
                      <td colSpan="4" className="px-6 py-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Assigned Tasks</h4>
                          {loadingTasks ? (
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                          ) : agentTasks[agent._id]?.tasks?.length > 0 ? (
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
      </div> */}

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
                  {file ? file.name : 'Select a file'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supported formats: CSV, XLSX
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