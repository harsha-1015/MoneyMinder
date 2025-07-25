import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Header() {
  const { currentUser } = useAuth(); // Use the context to get the user
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // No need to manually set state, the context will update automatically
      navigate("/login"); // Redirect to login after logout
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
        <h1 className="text-2xl font-bold">
          <Link to="/">Money‑Minder</Link>
        </h1>

        <nav>
          <ul className="flex gap-6 text-sm md:text-base font-medium items-center">
            <li><Link to="/" className="hover:text-yellow-400 transition">HOME</Link></li>
            <li><Link to="/analysis" className="hover:text-yellow-400 transition">ANALYSIS</Link></li>
            <li><Link to="/contact" className="hover:text-yellow-400 transition">CONTACT</Link></li>

            {currentUser ? (
              <>
                <li><Link to="/account" className="hover:text-yellow-400 transition">ACCOUNT</Link></li>
                <li>
                  <button onClick={handleLogout} className="hover:text-yellow-400 transition font-medium">
                    LOGOUT
                  </button>
                </li>
              </>
            ) : (
              <li><Link to="/login" className="hover:text-yellow-400 transition">LOGIN</Link></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;