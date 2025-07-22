import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);       // null while loading
  const [error, setError] = useState("");

  /* Fetch profile or redirect if not logged‑in */
  useEffect(() => {
    const email = localStorage.getItem("email");
    const login = localStorage.getItem("Login");

    if (login !== "success" || !email) {
      navigate("/login");
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const res  = await fetch(
          `http://127.0.0.1:8000/app/api/get-user-details?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Fetch failed");
        setUser(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUserDetails();
  }, [navigate]);

  /* Logout handler */
  const handleLogout = () => {
    localStorage.removeItem("Login");
    localStorage.removeItem("email");
    window.dispatchEvent(new Event("storage"));   // sync header
    navigate("/login");
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl shadow-lg bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-center">Account Details</h2>

      <div className="space-y-2">
        <p><strong>Full Name:</strong> {user.full_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Gender:</strong> {user.gender}</p>
        <p><strong>Occupation:</strong> {user.occupation}</p>
        <p><strong>Salary:</strong> ₹{user.salary}</p>
        <p><strong>Marital Status:</strong> {user.marital_status}</p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
      >
        LOGOUT
      </button>
    </div>
  );
}

export default Account;
