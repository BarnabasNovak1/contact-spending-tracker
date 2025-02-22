import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Signup from "./pages/Signup";
import Login from "./pages/Login";  // Import Login page
import Dashboard from "./pages/Dashboard"; // Example dashboard page
import CommunicationTracker from './components/CommunicationTracker';
import './styles.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />  {/* Default route pointing to login */}
          <Route path="/login" element={<Login />} />  {/* Explicit route for login */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/communications" element={<CommunicationTracker />} /> 
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
