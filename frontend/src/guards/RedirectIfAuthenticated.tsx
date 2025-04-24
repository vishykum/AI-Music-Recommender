import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const auth = useAuth();

    if (auth && auth.isAuthenticated) {
        return <Navigate to="/" />;
    }

    return children;
}

export default RedirectIfAuthenticated;