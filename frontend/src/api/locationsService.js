import axiosClient from './axiosClient';

const locationsService = {
    getLocations: (params, signal) => {
        return axiosClient.get('/api/locations/', { params, signal });
    },

    getLocationById: (id) => {
        return axiosClient.get(`/api/locations/${id}/`);
    },

    createLocation: (locationData) => {
        return axiosClient.post('/api/locations/', locationData);
    },

    updateLocation: (id, locationData) => {
        return axiosClient.put(`/api/locations/${id}/`, locationData);
    },

    deleteLocation: (id) => {
        return axiosClient.delete(`/api/locations/${id}/`);
    },
};

export default locationsService;