import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Use our robust auth hook
import {
  TrendingUp, Shield, Zap, PieChart, Smartphone, Users,
  ArrowRight, DollarSign, BarChart3, Wallet
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const { currentUser, backendUserData } = useAuth(); // Check for user from the context

  // Check if user has connected Google account
  const isGoogleConnected = currentUser && backendUserData?.google_access_token;

  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch today's analysis when user is connected
  useEffect(() => {
    const fetchTodaysAnalysis = async () => {
      if (!isGoogleConnected) return;
      
      setLoading(true);
      setError('');
      
      try {
        const today = new Date();
        const response = await fetch('http://127.0.0.1:8000/app/api/get-analysis/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: currentUser.uid,
            email: currentUser.email,
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            daily: true
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch today\'s analysis');
        }

        const data = await response.json();
        setTodayData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysAnalysis();
  }, [isGoogleConnected, currentUser]);

  const handleConnect = () => {
    // Correct backend URL for connecting to Google
    window.location.href = "http://localhost:8000/app/google/connect/";
  };

  const handleGetStarted = () => {
    // Navigate new users to the registration page
    navigate("/register");
  };

  // Show loading state while fetching today's data
  if (isGoogleConnected && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial insights...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Smart Analytics",
      description: "AI-powered insights to help you understand your spending patterns and optimize decisions."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bank-Level Security",
      description: "Your financial data is protected with enterprise-grade encryption and protocols."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Sync",
      description: "Instant synchronization across all devices for up-to-date financial info."
    },
    {
      icon: <PieChart className="w-8 h-8" />,
      title: "Budget Planning",
      description: "Create budgets and track progress with interactive charts and alerts."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile First",
      description: "Manage finances on-the-go with responsive, mobile-optimized design."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Family Sharing",
      description: "Share budgets and expenses with family while maintaining privacy controls."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "$2.5B+", label: "Money Tracked" },
    { number: "98%", label: "User Satisfaction" },
    { number: "24/7", label: "Support Available" }
  ];

  // Render today's analysis if user is connected
  const renderTodaysAnalysis = () => {
    if (!todayData || !todayData.transactions || todayData.transactions.length === 0) {
      return (
        <div className="max-w-4xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No transactions today</h2>
          <p className="text-gray-600 mb-6">Your transactions for today will appear here.</p>
          <button
            onClick={() => navigate('/analysis')}
            className="px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-medium transition-colors"
          >
            View Full Analysis
          </button>
        </div>
      );
    }

    const totalCredits = todayData.transactions
      .filter(tx => tx.transaction_type === 'credited')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
    const totalDebits = todayData.transactions
      .filter(tx => tx.transaction_type === 'debited')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Today's Financial Summary</h1>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600">₹{totalCredits.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">₹{totalDebits.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Net Balance</p>
            <p className={`text-2xl font-bold ${(totalCredits - totalDebits) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(totalCredits - totalDebits).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {todayData.transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{tx.description.substring(0, 50)}{tx.description.length > 50 ? '...' : ''}</p>
                    <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleTimeString()}</p>
                  </div>
                  <p className={`font-medium ${tx.transaction_type === 'credited' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.transaction_type === 'credited' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 text-center">
            <button
              onClick={() => navigate('/analysis')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center w-full py-2"
            >
              View All Transactions
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Insights Button */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/analysis')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-800 to-emerald-500 hover:from-blue-900 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            Get More Insights
          </button>
        </div>
      </div>
    );
  };

  // Show error state if there was an error fetching data
  if (isGoogleConnected && error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We couldn't load your financial data. Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 overflow-hidden ${isGoogleConnected ? 'pt-4' : 'pt-20'} font-inter relative`}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/2 w-40 h-40 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Hero - Only show if not connected */}
      {!isGoogleConnected && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
          {/* Floating Icons */}
          <DollarSign className="absolute top-20 left-10 w-8 h-8 text-emerald-500 opacity-40 animate-bounce delay-1000" />
          <BarChart3 className="absolute top-32 right-20 w-6 h-6 text-blue-800 opacity-40 animate-bounce delay-2000" />
          <Wallet className="absolute bottom-32 left-20 w-7 h-7 text-emerald-500 opacity-40 animate-bounce" />

          {/* Heading */}
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-6 py-3 bg-white rounded-full border border-gray-200 shadow-sm mb-8 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-emerald-500 mr-2" />
              <span className="text-sm text-gray-600 font-medium">Trusted by 50,000+ users worldwide</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight font-poppins">
              <span className="text-blue-800">Money</span>‑<span className="text-emerald-500">Minder</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed font-medium font-inter">
              Transform your financial future with AI-powered insights. Track expenses, build budgets, and achieve your goals with the most intuitive money management platform.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {!currentUser ? (
                <button
                  onClick={handleGetStarted}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-800 to-emerald-500 hover:from-blue-900 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-800/25 font-inter"
                >
                  <span className="flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-800 to-emerald-500 hover:from-blue-900 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-800/25 font-inter"
                >
                  <span className="flex items-center">
                    Connect to Google Account
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              )}

              <button className="px-8 py-4 border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm font-inter">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition duration-300 hover:bg-white">
                  <div className="text-2xl md:text-3xl font-bold text-blue-800 mb-1 font-poppins">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium font-inter">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Show today's analysis if connected */}
      {isGoogleConnected && renderTodaysAnalysis()}

      {/* Features - Only show if not connected */}
      {!isGoogleConnected && (
        <div className="relative z-10 py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-poppins">
                Everything you need to master your finances
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto font-medium font-inter">
                Powerful features designed to give you complete control over your financial life
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group relative p-8 bg-white rounded-2xl border border-gray-200 hover:border-blue-800/20 hover:shadow-xl transition duration-300 transform hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-800/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-emerald-500 rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-800 font-poppins transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 group-hover:text-gray-700 font-medium font-inter transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA - Only show if not connected */}
      {!isGoogleConnected && (
        <div className="relative z-10 py-20 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-3xl border border-gray-200 p-12 shadow-xl hover:shadow-2xl transition duration-300">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-poppins">
                Ready to take control of your finances?
              </h2>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto font-medium font-inter">
                Join thousands of users who’ve already transformed their financial lives with Money-Minder.
              </p>
              <button
                onClick={!currentUser ? handleGetStarted : handleConnect}
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-800 to-emerald-500 hover:from-blue-900 hover:to-emerald-600 text-white font-semibold rounded-xl transition duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-800/25 font-inter"
              >
                {!currentUser ? "Start Your Free Journey" : "Connect Your Account"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;