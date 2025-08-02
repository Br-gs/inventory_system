import axiosClient from "./axiosClient";

const reportsService = {
    getInventoryReport: () => {
        return axiosClient.get('/api/reports/');
    },
};

export default reportsService;