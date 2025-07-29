import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

axiosClient.interceptors.request.use(
    (config) => {
        const tokenString = localStorage.getItem('authTokens');
        if (tokenString) {
            const token = JSON.parse(tokenString).access;
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {

            if (originalRequest.url ===  '/api/token/refresh/') {
                console.error('Refresh token request failed. Logging out.');
                localStorage.removeItem('authTokens');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                const tokenString = localStorage.getItem('authTokens');
                if (!tokenString) {
                    console.error('No auth tokens found. Redirecting to login.');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                const refreshToken = JSON.parse(tokenString).refresh;
                const {data: newTokens} = await axios.post(`${import.meta.env.VITE_API_URL}/api/token/refresh/`, {refresh: refreshToken});
                localStorage.setItem('authTokens', JSON.stringify(newTokens));
                originalRequest.headers['Authorization'] = `Bearer ${newTokens.access}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                localStorage.removeItem('authTokens');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;