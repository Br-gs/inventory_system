import axiosClient from "./axiosClient";

const authService = {
    login: (username, password) => {
        return axiosClient.post('/api/token/', {username, password});
    },
    
    register: (userData) => {
        return axiosClient.post('/api/register/', userData);
    },
    
    logout: () => {
        return axiosClient.post('/api/logout/');
    },
    
    refreshToken: () => {
        return axiosClient.post('/api/token/refresh/');
    },
    
    changePassword: (passwordData) => {
        return axiosClient.patch('/api/user/change-password/', passwordData);
    },
    
    // User profile management
    getUserProfile: () => {
        return axiosClient.get('/api/user/profile/');
    },
    
    updateUserProfile: (profileData) => {
        return axiosClient.patch('/api/user/profile/', profileData);
    },
    
    // Location-related endpoints
    getAccessibleLocations: () => {
        return axiosClient.get('/api/user/accessible-locations/');
    },
    
    // Admin user management
    getUsers: (params) => {
        return axiosClient.get('/api/users/', { params });
    },
    
    createUser: (userData) => {
        return axiosClient.post('/api/users/', userData);
    },
    
    getUserById: (id) => {
        return axiosClient.get(`/api/users/${id}/`);
    },
    
    updateUser: (id, userData) => {
        return axiosClient.patch(`/api/users/${id}/`, userData);
    },
    
    deleteUser: (id) => {
        return axiosClient.delete(`/api/users/${id}/`);
    },
};

export default authService;