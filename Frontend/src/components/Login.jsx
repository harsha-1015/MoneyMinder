import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext'; // Import from the new file

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { currentUser } = useContext(AuthContext);

    useEffect(() => {
        if (currentUser) {
            navigate('/account');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error("Firebase login error:", err.code, err.message);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('An unexpected error occurred. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 rounded-2xl shadow-lg bg-white">
            <h2 className="text-2xl font-semibold mb-6 text-center">Login to Your Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full p-3 border rounded-lg" 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="w-full p-3 border rounded-lg" 
                />
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg disabled:bg-blue-300"
                >
                    {loading ? 'Logging In...' : 'Login'}
                </button>

                <p className="text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-blue-600 hover:underline">
                        Sign up
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
