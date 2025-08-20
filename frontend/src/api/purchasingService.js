import axiosClient from './axiosClient';

const purchasingService = {

    getPurchaseOrders: (params, signal) => {
    return axiosClient.get('/api/purchase-orders/', { params, signal });
    },

    createPurchaseOrder: (poData) => {
    return axiosClient.post('/api/purchase-orders/', poData);
    },

    receivePurchaseOrder: (id) => {
    return axiosClient.post(`/api/purchase-orders/${id}/receive/`);
    },
  
    updatePurchaseOrder: (id, poData) => {
        return axiosClient.put(`/api/purchase-orders/${id}/`, poData);
    },
    deletePurchaseOrder: (id) => {
        return axiosClient.delete(`/api/purchase-orders/${id}/`);
    }
};

export default purchasingService;