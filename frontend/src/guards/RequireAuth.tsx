import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const auth = useAuth();

    if (!auth || !auth.isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default RequireAuth;
