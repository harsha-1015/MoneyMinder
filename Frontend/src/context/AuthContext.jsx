import { createContext, useState, useEffect, useMemo, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

const AuthContext = createContext(null); // No longer exported

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [backendUserData, setBackendUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const response = await axios.post('http://localhost:8000/app/api/get-user', {
            uid: user.uid,
          });
          setBackendUserData(response.data);
        } catch (error) {
          console.error('Failed to fetch backend user data:', error);
          setBackendUserData(null);
        }
      } else {
        setBackendUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ currentUser, backendUserData }), [currentUser, backendUserData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// FIX: Custom hook to access the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};