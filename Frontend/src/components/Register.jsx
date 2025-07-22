import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Import from your firebase.js

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        occupation: '',
        salary: '',
        maritalStatus: 'Single',
        gender: 'Male',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Step 1: Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Step 2: Send user profile data to your Django backend
            const backendResponse = await fetch('http://127.0.0.1:8000/app/api/create-profile/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebase_uid: user.uid, // Send the unique Firebase UID
                    full_name: formData.fullName,
                    email: user.email,
                    occupation: formData.occupation,
                    salary: parseInt(formData.salary, 10),
                    marital_status: formData.maritalStatus,
                    gender: formData.gender,
                }),
            });

            if (!backendResponse.ok) {
                // This could happen if the backend fails to create the profile
                throw new Error('Failed to save profile information.');
            }

            // If both are successful, navigate to the login page
            navigate('/login');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 rounded-2xl shadow-lg bg-white">
            <h2 className="text-2xl font-semibold mb-6 text-center">Create Your Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
                <input type="password" name="password" placeholder="Password (min. 6 characters)" value={formData.password} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
                <input type="text" name="occupation" placeholder="Occupation" value={formData.occupation} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
                <input type="number" name="salary" placeholder="Monthly Salary (e.g., 50000)" value={formData.salary} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-3 border rounded-lg">
                    <option>Single</option>
                    <option>Married</option>
                </select>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border rounded-lg">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                </select>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg disabled:bg-blue-300">
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>
        </div>
    );
};

export default Register;
