import React from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


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
    <nav className="bg-gray-800 p-4 sticky top-0">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold"><Link to="/">MyApp</Link></div>
        <ul className="flex space-x-4">
          <li>
          <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
          </li>
          <li>
            <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
          </li>
          <li>
            <a href="#" className="text-gray-300 hover:text-white" onClick={handleLogout}>Logout</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;