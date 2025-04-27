import React from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import './Navbar.css';


const Navbar = () => {
    
    const navigate = useNavigate();

    //setIsAuthenticated function from AuthContext
    const { setIsAuthenticated } = useAuth();

    //Temp logout function
    const handleLogout = async () => {
        // Perform logout logic here (e.g., clear tokens, redirect, etc.)

        try {
            const results = axios.get(import.meta.env.VITE_BACKEND_API_URL + "/users/logout", {
                withCredentials: true

            });
            console.log("Logout successful:");

            // Clear authentication state
            setIsAuthenticated(false);
            navigate("/login"); // Redirect to login page after logout
        } catch (error) {
            console.error(`Axios to ${import.meta.env.VITE_BACKEND_API_URL + "/users/logout"} Logout failed:`, error);
        }

        console.log("Logged out");
    };

  return (
    <nav className="navbar">
      <div className="navbar-flex">
        <div className="app-title"><Link to="/">MyApp</Link></div>
        <ul className="options-flex">
          <li>
          <Link to="/login" className="options">Login</Link>
          </li>
          <li>
            <Link to="/register" className="options">Register</Link>
          </li>
          <li>
            <a href="#" className="options" onClick={handleLogout}>Logout</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;