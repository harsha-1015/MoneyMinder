import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Use our robust auth hook
import {
  TrendingUp, Shield, Zap, PieChart, Smartphone, Users,
  ArrowRight, DollarSign, BarChart3, Wallet
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const { currentUser, backendUserData } = useAuth(); // Check for user from the context

  const handleConnect = () => {
    // Correct backend URL for connecting to Google
    window.location.href = "http://localhost:8000/app/google/connect/";
  };

  const handleGetStarted = () => {
    // Navigate new users to the registration page
    navigate("/register");
  };

  // Check if user has connected Google account
  const isGoogleConnected = currentUser && backendUserData?.google_access_token;

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

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden pt-20 font-inter relative">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/2 w-40 h-40 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Hero */}
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
            ) : isGoogleConnected ? (
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => navigate('/analysis')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-800 hover:from-emerald-600 hover:to-blue-900 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25 font-inter"
                >
                  <span className="flex items-center">
                    View Your Analysis
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <p className="text-sm text-emerald-600 font-medium">✓ Google Account Connected</p>
              </div>
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

      {/* Features */}
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

      {/* CTA */}
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
              onClick={!currentUser ? handleGetStarted : isGoogleConnected ? () => navigate('/analysis') : handleConnect}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-800 to-emerald-500 hover:from-blue-900 hover:to-emerald-600 text-white font-semibold rounded-xl transition duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-800/25 font-inter"
            >
              {!currentUser ? "Start Your Free Journey" : isGoogleConnected ? "View Your Analysis" : "Connect Your Account"}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;