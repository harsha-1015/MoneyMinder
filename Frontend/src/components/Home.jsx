import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("Login") === "success"
  );

  useEffect(() => {
    const sync = () =>
      setIsLoggedIn(localStorage.getItem("Login") === "success");
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleConnect = () => {
    window.location.href = "http://localhost:8000/app/google/connect/";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-gray-50">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
        Welcome to Money‑Minder
      </h1>
      <p className="text-gray-700 max-w-xl mb-6 text-lg">
        Take control of your personal finances with ease. Track your income,
        monitor your expenses, and get smart financial insights — all in one
        place.
      </p>

      {isLoggedIn ? (
        <button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-300"
        >
          Connect to your Google account
        </button>
      ) : (
        <Link
          to="/analysis"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-300"
        >
          Get Started
        </Link>
      )}
    </div>
  );
}

export default Home;
