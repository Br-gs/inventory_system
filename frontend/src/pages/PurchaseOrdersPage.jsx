import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {PurchaseOrderList} from '../components';

const PurchaseOrdersPage = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>
                        Create and manage purchase orders to your suppliers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PurchaseOrderList 
                        refreshTrigger={refreshTrigger} 
                        onRefresh={handleRefresh} 
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default PurchaseOrdersPage;