import inventoryService from './inventoryService';

const reportsService = {
    getInventoryReport: (params) => {
        return inventoryService.getInventoryReport(params);
    },
};

export default reportsService;