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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const loginUser = useCallback(async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.login(username, password);
            if (response.status !== 200) {
                throw new Error("Login failed");
            }
            const data = response.data;
            setAuthTokens(data);
            setUser(jwtDecode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
        } catch (err) {
            const apiMsg = err.response?.data?.detail || err.response?.data?.message;
            setError(apiMsg || err.message || "An error occurred during login");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logoutUser = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (authTokens) {
                await authService.logout(authTokens.refresh);
            }
        } catch (error) {
            console.error("Error during logout:", error);
            setError("Failed to log out. Please try again.");
        } finally {
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem('authTokens');
            setLoading(false);
        }
    }, [authTokens]);

    // Automatically refresh token before it expires
    useEffect(() => {
        if (!authTokens) {
            setLoading(false);
            return;
        }

        const { exp } = jwtDecode(authTokens.access);
        const timeToRefresh = exp * 1000 - Date.now() - 60000;
        const timeoutId = setTimeout(async () => {
            try {
                const { data } = await authService.refreshToken(authTokens.refresh);
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                localStorage.setItem('authTokens', JSON.stringify(data));
            } catch (err) {
                console.error("Error refreshing token:", err);
                logoutUser();
            }
        }, Math.max(timeToRefresh, 0));

        // Set loading to false after setting up the timeout
        setLoading(false);
        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId);
    }, [authTokens, logoutUser]);


    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        loading,
        error,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    );
};

export default AuthContext;