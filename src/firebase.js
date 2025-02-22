// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"; // Firebase auth imports
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5CJYsP5Q69s2-vz7wJDyFfwL5-8HN3co",
  authDomain: "contact-spending-tracker.firebaseapp.com",
  projectId: "contact-spending-tracker",
  storageBucket: "contact-spending-tracker.firebasestorage.app",
  messagingSenderId: "776166500908",
  appId: "1:776166500908:web:1c359fd00bfb4bebaebf89",
  measurementId: "G-5X2475H456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
const auth = getAuth(app); // Firebase Auth instance
const db = getFirestore(app); // Firebase Firestore instance

// Export Auth, Firestore, and Auth functions
export { auth, db, createUserWithEmailAndPassword };
