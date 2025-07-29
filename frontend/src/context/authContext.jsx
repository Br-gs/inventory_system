import {createContext, useState, useEffect, useCallback} from 'react';
import { authService } from '../api';
import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    const [user, setUser] = useState(() =>
        localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) : null
    );
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);


    const loginUser = useCallback(async (username, password) => {
        setError(null);
        try {
            const response = await authService.login(username, password);
            const { data } = response;
            setAuthTokens(data);
            setUser(jwtDecode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
        } catch (err) {
            const apiMsg = err.response?.data?.detail || err.response?.data?.message;
            setError(apiMsg || err.message || "An error occurred during login");
            throw err;
        }
    }, []);

    const logoutUser = useCallback(async () => {
        setError(null);
        try {
            await authService.logout();
        } catch (error) {
            console.error("Error during logout:", error);
            setError("Failed to log out. Please try again.");
        } finally {
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem('authTokens');
        }
    }, []);

    // Automatically refresh token before it expires
    useEffect(() => {
        if (!authTokens) {
            setInitialLoading(false);
            return;
        }

        setInitialLoading(false);
    }, [authTokens, logoutUser]);


    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        initialLoading,
        error,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {initialLoading ? null : children}
        </AuthContext.Provider>
    );
};

export default AuthContext;