import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UsersIcon, 
  VideoCameraIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { userProfile, authAxios, isAdmin } = useAuth();
  const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS ? 
    import.meta.env.VITE_ADMIN_EMAILS.split(',').map(email => email.trim()) : 
    ['seenew1729@gmail.com']; // Fallback for development
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalVideos: 0,
    totalNotes: 0,
    totalFavorites: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    database: 'checking',
    apiServer: 'checking',
    storage: 'checking'
  });
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    console.log('🔍 AdminDashboard mounted');
    console.log('🔍 userProfile:', userProfile);
    console.log('🔍 isAdmin:', isAdmin);
    
    if (userProfile && !isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    
    if (userProfile && isAdmin) {
      fetchAdminStats();
      checkSystemHealth();
    }
  }, [userProfile, isAdmin]);

  const fetchAdminStats = async () => {
    try {
      console.log('🔍 Fetching admin stats...');
      setLoading(true);
      setError(null);
      
      const response = await authAxios.get('/admin/stats');
      console.log('✅ Admin stats response:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('❌ Failed to fetch admin stats:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      setError(`Failed to load admin statistics: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const response = await authAxios.get('/admin/health');
      setSystemHealth(response.data);
    } catch (err) {
      console.error('Failed to check system health:', err);
      setSystemHealth({
        database: 'error',
        apiServer: 'error',
        storage: 'error'
      });
    }
  };

  const fetchAllUsers = async () => {
    try {
      setActionLoading(true);
      const response = await authAxios.get('/admin/users');
      setUsers(response.data);
      setShowUsersModal(true);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showNotification('Failed to fetch users', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      setActionLoading(true);
      const response = await authAxios.get('/admin/users/active');
      setUsers(response.data);
      setShowUsersModal(true);
    } catch (err) {
      console.error('Failed to fetch active users:', err);
      showNotification('Failed to fetch active users', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await authAxios.delete(`/admin/users/${userId}`);
      showNotification('User deleted successfully');
      setUsers(users.filter(user => user._id !== userId));
      fetchAdminStats(); // Refresh stats
    } catch (err) {
      console.error('Failed to delete user:', err);
      showNotification(`Failed to delete user: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteVideo = async (videoId, videoTitle) => {
    if (!confirm(`Are you sure you want to delete video "${videoTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await authAxios.delete(`/admin/videos/${videoId}`);
      showNotification('Video deleted successfully');
      setVideos(videos.filter(video => video._id !== videoId));
      fetchAdminStats(); // Refresh stats
    } catch (err) {
      console.error('Failed to delete video:', err);
      showNotification(`Failed to delete video: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const cleanupData = async () => {
    if (!confirm('This will remove all inactive data. Are you sure?')) {
      return;
    }

    try {
      setActionLoading(true);
      // This would be a new endpoint for cleanup
      showNotification('Cleanup feature coming soon!', 'info');
    } catch (err) {
      console.error('Failed to cleanup data:', err);
      showNotification('Failed to cleanup data', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthStatusText = (status) => {
    switch (status) {
      case 'healthy':
        return 'Online';
      case 'unhealthy':
        return 'Offline';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-500';
      case 'unhealthy':
        return 'bg-red-500/10 text-red-500';
      case 'checking':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="dark:text-gray-400 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <div className="dark:text-white text-gray-900 text-xl mb-2">Admin Dashboard Error</div>
          <div className="dark:text-gray-400 text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchAdminStats}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : notification.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
              {notification.type === 'error' && <XCircleIcon className="w-5 h-5" />}
              {notification.type === 'info' && <ExclamationTriangleIcon className="w-5 h-5" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="dark:text-gray-400 text-gray-600">
              Welcome back, {userProfile?.name || 'Admin'}
            </p>
          </div>
          <button 
            onClick={fetchAdminStats}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>



        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button 
            onClick={fetchAllUsers}
            className="youtube-card p-6 hover:scale-105 transition-transform cursor-pointer"
            disabled={actionLoading}
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium dark:text-gray-400 text-gray-600">Total Users</p>
                <p className="text-2xl font-bold dark:text-white text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </button>

                     <button 
             onClick={fetchActiveUsers}
             className="youtube-card p-6 hover:scale-105 transition-transform cursor-pointer"
             disabled={actionLoading}
           >
             <div className="flex items-center">
               <div className="p-3 bg-green-500/10 rounded-lg">
                 <UsersIcon className="w-6 h-6 text-green-500" />
               </div>
               <div className="ml-4">
                 <p className="text-sm font-medium dark:text-gray-400 text-gray-600">Active Users</p>
                 <p className="text-2xl font-bold dark:text-white text-gray-900">{stats.activeUsers}</p>
               </div>
             </div>
           </button>

          <div className="youtube-card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium dark:text-gray-400 text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold dark:text-white text-gray-900">{stats.totalNotes}</p>
              </div>
            </div>
          </div>

          <div className="youtube-card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <StarIcon className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium dark:text-gray-400 text-gray-600">Total Favorites</p>
                <p className="text-2xl font-bold dark:text-white text-gray-900">{stats.totalFavorites}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="youtube-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold dark:text-white text-gray-900">Recent Activity</h2>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 dark:text-gray-400 text-gray-600" />
              <span className="text-sm dark:text-gray-400 text-gray-600">Last 24 hours</span>
            </div>
          </div>

          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 dark:bg-gray-800/50 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === 'user' && (
                      <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                    {activity.type === 'video' && (
                      <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                        <VideoCameraIcon className="w-4 h-4 text-purple-500" />
                      </div>
                    )}
                    {activity.type === 'note' && (
                      <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium dark:text-white text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs dark:text-gray-400 text-gray-600">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="dark:text-gray-400 text-gray-500 text-4xl mb-4">📊</div>
              <p className="dark:text-gray-400 text-gray-600">No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="youtube-card p-6">
            <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
                             <button 
                 onClick={fetchAllUsers}
                 className="w-full flex items-center space-x-3 p-3 dark:bg-gray-800/50 bg-white border border-gray-200 rounded-lg dark:hover:bg-gray-700/50 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                 disabled={actionLoading}
               >
                 <EyeIcon className="w-5 h-5 dark:text-white text-gray-900" />
                 <span className="text-sm dark:text-white text-gray-900 font-medium">View All Users</span>
                 {actionLoading && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 animate-spin" />}
               </button>
                                             <button 
                  onClick={fetchActiveUsers}
                  className="w-full flex items-center space-x-3 p-3 dark:bg-gray-800/50 bg-white border border-gray-200 rounded-lg dark:hover:bg-gray-700/50 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                  disabled={actionLoading}
                >
                  <UsersIcon className="w-5 h-5 dark:text-white text-gray-900" />
                  <span className="text-sm dark:text-white text-gray-900 font-medium">View Active Users</span>
                  {actionLoading && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 animate-spin" />}
                </button>
                             <button 
                 onClick={cleanupData}
                 className="w-full flex items-center space-x-3 p-3 dark:bg-gray-800/50 bg-white border border-gray-200 rounded-lg dark:hover:bg-gray-700/50 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                 disabled={actionLoading}
               >
                 <TrashIcon className="w-5 h-5 dark:text-white text-gray-900" />
                 <span className="text-sm dark:text-white text-gray-900 font-medium">Cleanup Data</span>
                 {actionLoading && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 animate-spin" />}
               </button>
            </div>
          </div>

          <div className="youtube-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">System Status</h3>
              <button 
                onClick={checkSystemHealth}
                className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20 transition-colors"
                disabled={actionLoading}
              >
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-300 text-gray-700">Database</span>
                <div className="flex items-center space-x-2">
                  {getHealthStatusIcon(systemHealth.database)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getHealthStatusColor(systemHealth.database)}`}>
                    {getHealthStatusText(systemHealth.database)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-300 text-gray-700">API Server</span>
                <div className="flex items-center space-x-2">
                  {getHealthStatusIcon(systemHealth.apiServer)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getHealthStatusColor(systemHealth.apiServer)}`}>
                    {getHealthStatusText(systemHealth.apiServer)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-gray-300 text-gray-700">Storage</span>
                <div className="flex items-center space-x-2">
                  {getHealthStatusIcon(systemHealth.storage)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getHealthStatusColor(systemHealth.storage)}`}>
                    {getHealthStatusText(systemHealth.storage)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="youtube-card p-6">
            <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">Admin Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-600">Logged in as</p>
                <p className="text-sm font-medium dark:text-white text-gray-900">{userProfile?.email}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-600">Role</p>
                <p className="text-sm font-medium dark:text-white text-gray-900">Administrator</p>
              </div>
                             <div>
                 <p className="text-xs dark:text-gray-400 text-gray-600">Last login</p>
                 <p className="text-sm dark:text-gray-300 text-gray-700">
                   {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleString() : 'Just now'}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="youtube-card p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                         <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                 {users.length > 0 && users[0].lastLogin && new Date(users[0].lastLogin) > new Date(Date.now() - 5 * 60 * 1000) 
                   ? `Currently Active Users (${users.length})` 
                   : `All Users (${users.length})`
                 }
               </h2>
              <button 
                onClick={() => setShowUsersModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 dark:bg-gray-800/50 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium dark:text-white text-gray-900">{user.name || 'Unknown'}</p>
                      <p className="text-sm dark:text-gray-400 text-gray-600">{user.email}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500">
                        Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ADMIN_EMAILS.includes(user.email) && (
                      <span className="px-2 py-1 text-xs bg-purple-500/10 text-purple-500 rounded-full">Admin</span>
                    )}
                                         <button
                       onClick={() => deleteUser(user._id, user.email)}
                       className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                       disabled={ADMIN_EMAILS.includes(user.email) || actionLoading}
                     >
                       Delete
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Videos Modal */}
      {showVideosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="youtube-card p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white text-gray-900">All Videos ({videos.length})</h2>
              <button 
                onClick={() => setShowVideosModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {videos.map((video) => (
                <div key={video._id} className="flex items-center justify-between p-3 dark:bg-gray-800/50 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <VideoCameraIcon className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium dark:text-white text-gray-900">{video.title || 'Untitled'}</p>
                      <p className="text-sm dark:text-gray-400 text-gray-600">{video.url}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500">
                        Notes: {video.notes?.length || 0} | 
                        Screenshots: {video.screenshots?.length || 0} | 
                        Created: {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {video.favorite && (
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                    )}
                                         <button
                       onClick={() => deleteVideo(video._id, video.title)}
                       className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                       disabled={actionLoading}
                     >
                       Delete
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 