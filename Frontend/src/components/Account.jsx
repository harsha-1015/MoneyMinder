import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Account() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [syncMessage, setSyncMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const handleSync = async () => {
        if (!currentUser) return;
        setSyncMessage('Syncing... Please wait.');
        try {
            const response = await axios.post('http://127.0.0.1:8000/app/api/sync-emails', { uid: currentUser.uid });
            setSyncMessage(response.data.message || 'Emails synced successfully!');
        } catch (err) {
            setSyncMessage(err.response?.data?.message || 'Failed to sync emails.');
            console.error(err);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            try {
                const response = await axios.post('http://localhost:8000/app/api/get-user', {
                    uid: currentUser.uid,
                });
                setUserData(response.data);
            } catch (err) {
                setError('Failed to fetch user data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

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
                    <button
                        onClick={handleSync}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sync Emails Now
                    </button>
                    {syncMessage && <p className="mt-4 text-green-500">{syncMessage}</p>}
                </div>
            ) : (
                <p>No user data found.</p>
            )}
        </div>
    );
}