import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  // --- ADDED FOR SYNC BUTTON ---
  const [syncMessage, setSyncMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  // -----------------------------

  useEffect(() => {
    const email = localStorage.getItem("email");
    const login = localStorage.getItem("Login");

    if (login !== "success" || !email) {
      navigate("/login");
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const res = await fetch(
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
    window.dispatchEvent(new Event("storage")); // sync header
    navigate("/login");
  };

  // --- ADDED FOR SYNC BUTTON ---
  const handleSyncEmails = async () => {
    setIsSyncing(true);
    setSyncMessage("Syncing in progress, this may take a moment...");
    const email = localStorage.getItem("email");

    try {
      const response = await fetch('http://127.0.0.1:8000/app/api/manual-sync/', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          // Send email in the body so the backend knows which user to sync
          body: JSON.stringify({ email: email }) 
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Sync failed. Please try again.");
      }
      
      setSyncMessage(data.message);

    } catch (err) {
      setSyncMessage(err.message);
    } finally {
      setIsSyncing(false);
    }
  };
  // -----------------------------

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

      {/* --- ADDED SYNC BUTTON AND MESSAGE SECTION --- */}
      <div className="mt-6 border-t pt-6">
        <button
          onClick={handleSyncEmails}
          disabled={isSyncing}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Sync Emails Now"}
        </button>
        {syncMessage && (
          <p className="mt-4 text-center text-sm text-gray-700">{syncMessage}</p>
        )}
      </div>
      {/* ------------------------------------------- */}

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
