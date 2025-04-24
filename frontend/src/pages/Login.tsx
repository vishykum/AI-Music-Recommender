import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    //Is authenticated state and setIsAuthenticated function from AuthContext
    const navigate = useNavigate();

    //setIsAuthenticated function from AuthContext
    const {setIsAuthenticated} = useAuth();

    //Local states and effects

    const [loginError, setLoginError] = React.useState(false);

    //Form state management using useReducer
    const initialFormState = {
        email: "",
        password: "",
    };

    const formReducer = (state: any, action: any) => {
        switch (action.type) {
            case "SET_FIELD":
                return { ...state, [action.field]: action.value };
            case "RESET":
                return initialFormState;
            default:
                return state;
        }

    }

    const [formState, dispatch] = React.useReducer(formReducer, initialFormState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: "SET_FIELD", field: e.target.name, value: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        //Send form data to the server
        const apiUrl = import.meta.env.VITE_BACKEND_API_URL + "/users/login";

        const payload = {
            email_id: formState.email,
            password: formState.password
        }

        //If loginError is true, reset it to false
        setLoginError(false);

        dispatch({ type: "RESET" });

        try{
            const results = await axios.post(apiUrl, payload, {
                withCredentials: true
            });
            console.log("Login successful:", JSON.stringify(results.data));

            // Set isAuthenticated to true
            setIsAuthenticated(true);
            navigate("/");
        }catch(error){
            //Handle errors
            if (axios.isAxiosError(error) && error.response) {            
                if (error.response.status === 401) {
                    // Handle invalid credentials error

                    // Set login error state to true
                    setLoginError(true);

                    console.error("Invalid credentials. Please try again.");
                }
                else if (error.response.status === 500) {
                    // Handle server error
                    console.error("Server error. Please try again later.");
                }
                else {
                    // Handle other errors
                    console.error("An unexpected error occurred:", error.response.data.message);
                }
            }
        }

        console.log("Form submitted:", formState);
    };

    return (
        <div className="h-full w-full bg-blue-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                <input type="email" id="email" name="email" value={formState.email} className="w-full p-2 border border-gray-300 rounded" onChange={handleInputChange} required />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
                <input type="password" id="password" name="password" value={formState.password} className="w-full p-2 border border-gray-300 rounded" onChange={handleInputChange} required />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Login</button>
            <div className={`min-w-full text-center mt-2 text-red-500 ${(loginError) ? '' : 'hidden'}`}><span>Email id or password incorrect</span></div>
            </form>
        </div>
        </div>
    );
}

export default Login;