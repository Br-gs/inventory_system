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
    const [userProfile, setUserProfile] = useState(null);
    const [accessibleLocations, setAccessibleLocations] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserProfile = useCallback(async () => {
        if (!authTokens) return;

        try {
            const response = await authService.getUserProfile();
            setUserProfile(response.data);
            
            // Fetch accessible locations
            const locationsResponse = await authService.getAccessibleLocations();
            setAccessibleLocations(locationsResponse.data.locations || []);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }, [authTokens]);

    const loginUser = useCallback(async (username, password) => {
        setError(null);
        try {
            const response = await authService.login(username, password);
            const { data } = response;
            
            setAuthTokens(data);
            const decodedUser = jwtDecode(data.access);
            setUser(decodedUser);
            localStorage.setItem('authTokens', JSON.stringify(data));
            
            // Fetch user profile and locations after login
            await fetchUserProfile();
        } catch (err) {
            const apiMsg = err.response?.data?.detail || err.response?.data?.message;
            setError(apiMsg || err.message || "An error occurred during login");
            throw err;
        }
    }, [fetchUserProfile]);

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
            setUserProfile(null);
            setAccessibleLocations([]);
            localStorage.removeItem('authTokens');
        }
    }, []);

    // Get user's default location
    const getDefaultLocation = useCallback(() => {
        if (!userProfile || !accessibleLocations.length) return null;
        
        return accessibleLocations.find(location => location.is_default) || accessibleLocations[0];
    }, [userProfile, accessibleLocations]);

    // Check if user can access a specific location
    const canAccessLocation = useCallback((locationId) => {
        if (!locationId) return false;
        if (user?.is_staff) return true; // Admins can access all locations
        
        return accessibleLocations.some(location => location.id.toString() === locationId.toString());
    }, [user, accessibleLocations]);

    // Check if user can change their location
    const canChangeLocation = useCallback(() => {
        if (user?.is_staff) return true;
        return userProfile?.can_change_location || false;
    }, [user, userProfile]);

    // Update user profile (useful for when user updates their info)
    const updateUserProfile = useCallback(async (profileData) => {
        try {
            const response = await authService.updateUserProfile(profileData);
            setUserProfile(response.data);
            
            // Refresh accessible locations if default location changed
            if (profileData.profile?.default_location) {
                const locationsResponse = await authService.getAccessibleLocations();
                setAccessibleLocations(locationsResponse.data.locations || []);
            }
            
            return response;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }, []);

    // Get current location (user's default or first accessible)
    const getCurrentLocation = useCallback(() => {
        return getDefaultLocation();
    }, [getDefaultLocation]);

    // Check if user is admin
    const isAdmin = useCallback(() => {
        return user?.is_staff || false;
    }, [user]);

    // Check if user is manager or higher
    const isManager = useCallback(() => {
        return user?.is_staff || userProfile?.role === 'manager';
    }, [user, userProfile]);
    
    useEffect(() => {
        if (!authTokens) {
            setInitialLoading(false);
            return;
        }

        // Fetch user profile on mount if tokens exist
        fetchUserProfile().finally(() => {
            setInitialLoading(false);
        });
    }, [authTokens, fetchUserProfile]);

    const contextData = {
        // Auth state
        user,
        userProfile,
        authTokens,
        accessibleLocations,
        initialLoading,
        error,
        
        // Auth methods
        loginUser,
        logoutUser,
        fetchUserProfile,
        updateUserProfile,
        
        // Location-related helpers
        getDefaultLocation,
        getCurrentLocation,
        canAccessLocation,
        canChangeLocation,
        
        // Permission helpers
        isAdmin,
        isManager,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {initialLoading ? null : children}
        </AuthContext.Provider>
    );
};

export default AuthContext;