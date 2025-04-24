import React from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


const Register = () => {
    //Is authenticated state and setIsAuthenticated function from AuthContext
    const navigate = useNavigate();
    
    //Is authenticated state and setIsAuthenticated function from AuthContext
    const {setIsAuthenticated} = useAuth();

    //Local states and effects
    const [registerError, setRegisterError] = React.useState(false);
    const [registerErrorMessage, setRegisterErrorMessage] = React.useState("");



    //Form state management using useReducer
    const initialFormState = {
        email: "",
        password: "",
        confirm_password: "",
        fname: "",
        lname: "",
        platform: "",
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

        if (formState.password !== formState.confirm_password) {
            setRegisterError(true);
            setRegisterErrorMessage("Passwords do not match");
            window.scrollTo({top: 0, behavior: 'smooth'});
            dispatch({ type: "RESET" });
            return;
        }

        //Send form data to the server
        const apiUrl = import.meta.env.VITE_BACKEND_API_URL + "/users/register";

        const payload = {
            email_id: formState.email,
            password: formState.password,
            music_platform: formState.platform,
            first_name: formState.fname,
            last_name: formState.lname
        }

        dispatch({ type: "RESET" });

        try{
            const results = await axios.post(apiUrl, payload, {
                withCredentials: true
            });

            console.log("Register successful:", JSON.stringify(results.data));

            try {
                const results = await axios.get(import.meta.env.VITE_BACKEND_API_URL + "/users/send_verification_email", {
                    withCredentials: true
                });
                console.log("Verification email sent successfully:", JSON.stringify(results.data));

                //If registerError is true, reset it to false
                setRegisterError(false);
                setRegisterErrorMessage("");

                //Set isAuthenticated to true
                setIsAuthenticated(true);
                navigate('/');

            } catch (error) {

                //Handle errors
                if (axios.isAxiosError(error) && error.response) {
                    if (error.response.data.status === 409) {
                        // Handle invalid credentials error
                        setRegisterError(true);
                        setRegisterErrorMessage("Email already exists. Please try again.");
                    }
                    else if (error.response.data.status === 400 && error.response.data.message === "Invalid email") {
                        // Handle invalid email error
                        setRegisterError(true);
                        setRegisterErrorMessage("Invalid email address. Please try again.");
                    }
                    else if (error.response.data.status === 500) {
                        // Handle server error
                        setRegisterError(true);
                        setRegisterErrorMessage("Server error. Please try again later.");
                    }
                }
                else {
                    // Handle other errors
                    setRegisterError(true);
                    setRegisterErrorMessage("An unexpected error occurred. Please try again later.");
                }

                console.error(`Axios to ${import.meta.env.VITE_BACKEND_API_URL + "/users/send_verification_email"} Sending verification email failed:`, error);
            }
        }catch(error){
            console.error(`Axios to ${apiUrl} Register failed:`, error);
        }

        dispatch({ type: "RESET" });
        console.log("Form submitted:", formState);
    };

    return (
        <div className="flex items-center justify-center h-full w-full bg-blue-100">
        <div className="bg-white m-4 p-8 rounded shadow-md w-96">
            <div className={`bg-[#EA9B9B] w-full h-10 rounded flex flex-row justify-center items-center ${(registerError) ? '' : 'hidden'}`}><span className="text-red-700 rounded">❌ {registerErrorMessage}</span></div>
            <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
            <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                <input type="email" id="email" name="email" value={formState.email} className="w-full p-2 border border-gray-300 rounded" onChange={handleInputChange} required />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
                <input type="password" id="password" name="password" value={formState.password} className="w-full p-2 border border-gray-300 rounded" onChange={handleInputChange} required />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="password">Re-enter Password</label>
                <input type="password" id="confirm_password" name="confirm_password" value={formState.confirm_password} className="w-full p-2 border border-gray-300 rounded" onChange={handleInputChange} required />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">First Name</label>
                <input type="text" id="fname" name="fname" value={formState.fname} className="w-full p-2 border border-gray-300 rounded" onChange={handleInputChange} required />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">Last Name</label>
                <input type="text" id="lname" name="lname" value={formState.lname} className="w-full p-2 border border-gray-300 rounded" onChange={handleInputChange} required />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">Platform Preference</label>
                <div className="flex flex-row">
                    <div className="pr-2"><input type="radio" id="yt" value='yt' checked={formState.platform === 'yt'} name="platform" className="p-2 mx-1 border" onChange={handleInputChange} required/><label htmlFor="yt">YouTube Music</label></div>
                    <div><input type="radio" id="sp" value='sp' name="platform" checked={formState.platform === 'sp'} className="p-2 mx-1 border" onChange={handleInputChange} required/><label htmlFor="sp">Spotify</label></div>
                </div>
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Register</button>
            </form>
        </div>
        </div>
    );
}

export default Register;