// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"; // Correct imports
import { auth } from "../firebase"; // Make sure to export auth from firebase.js

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return unsubscribe; // Clean up the subscription on unmount
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password); // Correct usage
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password); // Correct usage
  };

  const logout = () => {
    return signOut(auth); // Correct usage
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
