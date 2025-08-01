import axiosClient from "./axiosClient";

const authService = {
    login : (username, password) => {
        return axiosClient.post('/api/token/', {username, password});
    },
    register : (userData) => {
        return axiosClient.post('/api/register/', userData);
    },
    logout : () => {
        return axiosClient.post('/api/logout/');
    },
    refreshToken : () => {
        return axiosClient.post('/api/token/refresh/');
    },
    changePassword : (passwordData) => {
        return axiosClient.patch('/api/user/change-password/', passwordData);
    },
};

export default authService;