import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { User, Mail, Lock, Briefcase, DollarSign, Heart, User as GenderIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            const backendResponse = await fetch('http://127.0.0.1:8000/app/api/create-profile/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebase_uid: user.uid,
                    full_name: formData.fullName,
                    email: user.email,
                    occupation: formData.occupation,
                    salary: parseInt(formData.salary, 10),
                    marital_status: formData.maritalStatus,
                    gender: formData.gender,
                }),
            });

            if (!backendResponse.ok) {
                throw new Error('Failed to save profile information.');
            }

            navigate('/login');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Google Fonts Import */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
            
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-[#1E3A8A] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Create Your Account
                            </h2>
                            <p className="text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Join MoneyMinder to take control of your finances
                            </p>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                {/* Full Name */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-[#6B7280]" />
                                    </div>
                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="Full Name"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>

                                {/* Email */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-[#6B7280]" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>

                                {/* Password */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-[#6B7280]" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password (min. 6 characters)"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>

                                {/* Occupation */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase className="h-5 w-5 text-[#6B7280]" />
                                    </div>
                                    <input
                                        type="text"
                                        name="occupation"
                                        placeholder="Occupation"
                                        value={formData.occupation}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>

                                {/* Salary */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-[#6B7280]" />
                                    </div>
                                    <input
                                        type="number"
                                        name="salary"
                                        placeholder="Monthly Salary (e.g., 50000)"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>

                                {/* Marital Status */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Heart className="h-5 w-5 text-[#6B7280]" />
                                    </div>
                                    <select
                                        name="maritalStatus"
                                        value={formData.maritalStatus}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent appearance-none"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    >
                                        <option>Single</option>
                                        <option>Married</option>
                                    </select>
                                </div>

                                {/* Gender */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <GenderIcon className="h-5 w-5 text-[#6B7280]" />
                                    </div>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent appearance-none"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#10B981] text-white py-3.5 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-lg disabled:opacity-70"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : (
                                    'Register Now'
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Already have an account?{' '}
                                <button 
                                    onClick={() => navigate('/login')} 
                                    className="text-[#1E3A8A] font-medium hover:text-[#10B981] transition-colors"
                                >
                                    Sign in
                                </button>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default Register;