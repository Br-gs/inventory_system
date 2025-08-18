import axiosClient from './axiosClient';

const suppliersService = {
    
  getSuppliers: (params, signal) => {
    return axiosClient.get('/api/suppliers/', { params, signal });
  },

  getSupplierById: (id) => {
    return axiosClient.get(`/api/suppliers/${id}/`);
  },

  createSupplier: (supplierData) => {
    return axiosClient.post('/api/suppliers/', supplierData);
  },

  updateSupplier: (id, supplierData) => {
    return axiosClient.put(`/api/suppliers/${id}/`, supplierData);
  },

  deleteSupplier: (id) => {
    return axiosClient.delete(`/api/suppliers/${id}/`);
  },
};

export default suppliersService;