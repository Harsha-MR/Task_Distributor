import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserX, UserCheck, Pencil, Trash2, Users } from 'lucide-react';

function AgentList() {
  const [agents, setAgents] = useState([]);
  const [totalAgents, setTotalAgents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/agents', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAgents(response.data.data.agents);
      setTotalAgents(response.data.data.totalAgents);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching agents');
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await axios.delete(`http://localhost:5000/api/agents/${agentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchAgents(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Error deleting agent');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with total agents count */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Total Agents</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">{totalAgents} agents registered</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Agents list */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {agents.length > 0 ? (
            agents.map((agent) => (
              <div key={agent._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {agent.status === 'active' ? (
                      <UserCheck className="w-6 h-6 text-green-500" />
                    ) : (
                      <UserX className="w-6 h-6 text-red-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{agent.name}</h3>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <p>{agent.email}</p>
                        <p>{agent.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleDeleteAgent(agent._id)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No agents found. Add some agents to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgentList;