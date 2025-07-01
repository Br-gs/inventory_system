import axiosClient from "./axiosClient";

const authService = {
    login : (username, password) => {
        return axiosClient.post('/api/token/', {username, password});
    },
    register : (userData) => {
        return axiosClient.post('/api/register/', userData);
    },
    logout : (refreshToken) => {
        return axiosClient.post('/api/logout/', {refresh: refreshToken});
    },
    refreshToken : (refreshToken) => {
        return axiosClient.post('/api/token/refresh/', {refresh: refreshToken});
    },
};

export default authService;