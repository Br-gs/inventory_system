import axiosClient from "./axiosClient";

const reportsService = {
    getInventoryReport: (filters) => {
        const params = new URLSearchParams(filters);
        return axiosClient.get('/api/reports/', {params});
    },
};

export default reportsService;