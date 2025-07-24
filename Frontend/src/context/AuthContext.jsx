// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
  });

  return () => unsubscribe();
}, []);


  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
