import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Home, BarChart3, Mail, User, LogOut, UserCircle, Sparkles, Menu } from "lucide-react";

function Header() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <>
      {/* Google Fonts Import */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg' 
          : 'bg-white/90 backdrop-blur-sm'
      }`}>
        
        {/* Subtle accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1E3A8A] via-[#10B981] to-[#1E3A8A] opacity-60"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#10B981] rounded-xl flex items-center justify-center transform hover:scale-110 hover:rotate-3 transition-all duration-300 shadow-lg shadow-[#1E3A8A]/25">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] rounded-full animate-pulse"></div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 hover:text-[#1E3A8A] transition-all duration-300" style={{fontFamily: 'Poppins, sans-serif'}}>
                Money‑Minder
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex gap-1 text-sm lg:text-base font-medium items-center" style={{fontFamily: 'Inter, sans-serif'}}>
              {[
                { name: 'HOME', path: '/', icon: Home },
                { name: 'ANALYSIS', path: '/analysis', icon: BarChart3 },
                { name: 'CONTACT', path: '/contact', icon: Mail }
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="group relative px-2 lg:px-4 py-2 rounded-xl transition-all duration-300 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <item.icon className="w-4 h-4 text-gray-600 group-hover:text-[#1E3A8A] transition-colors duration-300" />
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 font-medium">
                      {item.name}
                    </span>
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#1E3A8A] to-[#10B981] group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                  </Link>
                </li>
              ))}

              {currentUser ? (
                <>
                  <li>
                    <Link
                      to="/account"
                      className="group relative px-2 lg:px-4 py-2 rounded-xl transition-all duration-300 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <UserCircle className="w-4 h-4 text-gray-600 group-hover:text-[#1E3A8A] transition-colors duration-300" />
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 font-medium">
                        ACCOUNT
                      </span>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="group relative px-2 lg:px-4 py-2 rounded-xl transition-all duration-300 hover:bg-red-50 flex items-center space-x-2 border border-transparent hover:border-red-200"
                    >
                      <LogOut className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors duration-300" />
                      <span className="text-gray-700 group-hover:text-red-600 transition-colors duration-300 font-medium">
                        LOGOUT
                      </span>
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/login"
                    className="relative px-4 lg:px-6 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#10B981] hover:from-[#1E3A8A]/90 hover:to-[#10B981]/90 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#1E3A8A]/25 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>LOGIN</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all duration-300"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden transition-all duration-500 ease-in-out ${
          isMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="relative bg-white border-t border-gray-200">
            <nav className="relative z-10 px-4 py-6">
              <ul className="space-y-2">
                {[
                  { name: 'HOME', path: '/', icon: Home },
                  { name: 'ANALYSIS', path: '/analysis', icon: BarChart3 },
                  { name: 'CONTACT', path: '/contact', icon: Mail },
                  ...(currentUser ? [
                    { name: 'ACCOUNT', path: '/account', icon: UserCircle }
                  ] : [
                    { name: 'LOGIN', path: '/login', icon: User }
                  ])
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full group flex items-center space-x-3 px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-all duration-300 transform hover:translate-x-2"
                    >
                      <item.icon className="w-5 h-5 text-gray-600 group-hover:text-[#1E3A8A] transition-colors duration-300" />
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300 font-medium" style={{fontFamily: 'Inter, sans-serif'}}>
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
                
                {currentUser && (
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full group flex items-center space-x-3 px-4 py-3 rounded-xl text-left hover:bg-red-50 transition-all duration-300 transform hover:translate-x-2 border border-transparent hover:border-red-200"
                    >
                      <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors duration-300" />
                      <span className="text-gray-700 group-hover:text-red-600 transition-colors duration-300 font-medium" style={{fontFamily: 'Inter, sans-serif'}}>
                        LOGOUT
                      </span>
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;