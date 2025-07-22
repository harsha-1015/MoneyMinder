import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("Login") === "success"
  );

  /* Listen for login/logout in other tabs or components */
  useEffect(() => {
    const syncLogin = () =>
      setIsLoggedIn(localStorage.getItem("Login") === "success");
    window.addEventListener("storage", syncLogin);
    return () => window.removeEventListener("storage", syncLogin);
  }, []);

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
        <h1 className="text-2xl font-bold">
          <Link to="/">Money‑Minder</Link>
        </h1>

        <nav>
          <ul className="flex gap-6 text-sm md:text-base font-medium">
            <li><Link to="/"          className="hover:text-yellow-400 transition">HOME</Link></li>
            <li><Link to="/analysis" className="hover:text-yellow-400 transition">ANALYSIS</Link></li>
            <li><Link to="/contact"  className="hover:text-yellow-400 transition">CONTACT</Link></li>

            {isLoggedIn ? (
              <li><Link to="/account" className="hover:text-yellow-400 transition">ACCOUNT</Link></li>
            ) : (
              <li><Link to="/login"   className="hover:text-yellow-400 transition">LOGIN</Link></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
