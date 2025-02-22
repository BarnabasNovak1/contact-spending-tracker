import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";  // Import Link for React Router

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await signup(email, password);
      navigate("/communications");
    } catch (error) {
      console.error("Signup failed:", error.message);
    }
  };

  return (
    <div className="signup-container container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        <button type="submit" className="signup-button">Sign Up</button>
      </form>
      <p>
        Already have an account?{" "}
        <Link to="/login" className="login-link">Login</Link>
      </p>
    </div>
  );
}
