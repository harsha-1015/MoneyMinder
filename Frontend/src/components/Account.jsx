import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Account() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [syncMessage, setSyncMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const handleConnectGoogle = () => {
        if (!currentUser?.uid) return;
        window.location.href = `http://localhost:8000/app/google/connect/?uid=${currentUser.uid}`;
    };

    const handleSync = async () => {
        if (!currentUser) return;
        
        // Call manual sync endpoint
        setSyncMessage('Syncing emails... This may take a moment.');
        try {
            const response = await axios.post('http://127.0.0.1:8000/app/api/manual-sync/', { 
                uid: currentUser.uid 
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.data.status === 'success') {
                setSyncMessage(response.data.message);
                // Refresh user data to update last_sync time and connection status
                await fetchUserData();
            } else {
                setSyncMessage(response.data.message || 'Sync completed with issues.');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to sync emails. Please try again.';
            setSyncMessage(`Error: ${errorMsg}`);
            console.error('Sync error:', err);
        }
    };

    const fetchUserData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/app/api/get-user', {
                uid: currentUser.uid,
            });
            setUserData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to fetch user data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        fetchUserData();
    }, [currentUser, navigate]);

    if (loading) {
        return <div className="text-center py-10">Loading account details...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Account Information</h1>
            {userData ? (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <p className="mb-2"><strong>Full Name:</strong> {userData.full_name}</p>
                    <p className="mb-2"><strong>Email:</strong> {userData.email}</p>
                    <p className="mb-2"><strong>Gender:</strong> {userData.gender}</p>
                    <p className="mb-2"><strong>Occupation:</strong> {userData.occupation}</p>
                    <p className="mb-2"><strong>Salary:</strong> ₹{parseFloat(userData.salary).toLocaleString()}</p>
                    <p className="mb-4"><strong>Marital Status:</strong> {userData.marital_status}</p>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${userData?.google_access_token ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="font-medium">
                                    Google {userData?.google_access_token ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            
                            {userData?.google_access_token ? (
                                <button
                                    onClick={handleSync}
                                    className="font-bold py-2 px-4 rounded text-sm bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    Sync Emails Now
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnectGoogle}
                                    className="font-bold py-2 px-4 rounded text-sm bg-green-500 hover:bg-green-600 text-white"
                                >
                                    Connect Email
                                </button>
                            )}
                        </div>
                        
                        {userData?.google_access_token && (
                            <div className="mt-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">Last sync:</span>{' '}
                                    {userData.last_email_sync 
                                        ? new Date(userData.last_email_sync).toLocaleString() 
                                        : 'Never synced'}
                                </p>
                                {syncMessage && (
                                    <p className={`mt-1 ${syncMessage.includes('Error:') ? 'text-red-500' : 'text-green-600'}`}>
                                        {syncMessage}
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {!userData?.google_access_token && (
                            <p className="text-sm text-gray-500 mt-2">
                                Connect your Google account to sync email transactions automatically.
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <p>No user data found.</p>
            )}
        </div>
    );
}