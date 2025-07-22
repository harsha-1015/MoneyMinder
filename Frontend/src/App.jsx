import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // Import from your new firebase.js file
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

export const AuthContext = createContext(null);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  if (loading) {
    return <div>Loading application...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser }}>
        <Header />
        <Outlet />
        <Footer />
    </AuthContext.Provider>
  );
}

export default App;
