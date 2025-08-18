import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {SupplierList} from '../components';

const SuppliersPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>Manage your business's list of suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierList 
            refreshTrigger={refreshTrigger} 
            onRefresh={handleRefresh} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SuppliersPage;