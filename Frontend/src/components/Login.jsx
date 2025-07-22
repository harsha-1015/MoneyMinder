import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Import from your firebase.js

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Use Firebase to sign in the user
            await signInWithEmailAndPassword(auth, email, password);
            
            // On successful login, Firebase's onAuthStateChanged listener in App.jsx
            // will update the user state. We can then navigate to the account page.
            navigate('/account');

        } catch (err) {
            // Display user-friendly error messages
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else {
                setError('Failed to log in. Please try again.');
            }
            console.error("Firebase login error:", err);
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
