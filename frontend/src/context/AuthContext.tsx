import React, {createContext, useContext, useState} from 'react';
import axios from 'axios';

//Create the context
interface AuthContextType {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
    user: string | null;
    setUser: (value: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

//Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<string| null>(null);

    //This hook checks if a user is logged in or not upon loading the app
    React.useEffect(() => {
        const checkAuth = async () => {
            try {
                const apiUrl = import.meta.env.VITE_BACKEND_API_URL + "/users/user_logged_in";
                const response = await axios.get(apiUrl, {withCredentials: true});
                if (response.status === 200) {
                    setIsAuthenticated(true);
                    setUser(response.data.data); // Assuming the user data is in response.data.data
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{isAuthenticated, setIsAuthenticated, user, setUser}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };