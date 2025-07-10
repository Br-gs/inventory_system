import axiosClient from "./axiosClient";

const inventoryService = {

    getProducts : (params, signal) => {
        return axiosClient.get('/api/products/', { params, signal });
    },
    getProductSuggestions : (searchTerm, signal) => {
        const params =  new URLSearchParams({ search: searchTerm });
        return axiosClient.get('/api/products/suggestions/', { params, signal });
    },
    getProductById : (id, signal) => {
        return axiosClient.get(`/api/products/${id}/`, { signal });
    },
    createProduct : (productData) => {
        return axiosClient.post('/api/products/', productData);
    },
    // PUT method for full updates
    updateProduct : (id, productData) => {
        return axiosClient.put(`/api/products/${id}/`, productData);
    },
    // PATCH method for partial updates
    partialUpdateProduct : (id, partialProductData) => {
        return axiosClient.patch(`/api/products/${id}/`, partialProductData);
    },
    deleteProduct : (id) => {
        return axiosClient.delete(`/api/products/${id}/`);
    },

    getInventoryMovements : (params) => {
        return axiosClient.get('/api/inventory-movements/', { params });
    },
    createInventoryMovement : (movementData) => {
        return axiosClient.post('/api/inventory-movements/', movementData);
    },
};

export default inventoryService;