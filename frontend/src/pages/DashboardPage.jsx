import { useState, useEffect, useCallback } from 'react';
import { Link } from "react-router-dom";
import { reportsService } from '@/api';
import { LoadingSpinner } from '@/components';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

import { Package, Archive, TrendingUp, ArrowRight } from 'lucide-react';

const DashboardPage = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
        const response = await reportsService.getInventoryReport();
        setSummaryData(response.data);
        } catch (error) {
        console.error("Failed to fetch summary data:", error);
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    if (loading) return <LoadingSpinner></LoadingSpinner>;

    const salesChange = summaryData?.kpis?.sales_percentage_change ?? 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Active Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryData?.kpis?.total_products ?? 0}</div>
                    </CardContent>
                </Card>

                <Link to="/products?low_stock=true" >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Products with Low Stock</CardTitle>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryData?.kpis?.low_stock_count ?? 0}</div>
                            <p className="text-xs text-muted-foreground">Quantity less than or equal to 10</p>
                        </CardContent>
                    </Card>
                </Link>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales this month</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryData?.kpis?.sales_current_month ?? 0} units</div>
                        <p className={`text-xs ${salesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {salesChange >= 0 ? '+' : ''}{salesChange}% since last month
                        </p>
                    </CardContent>
                </Card>
            </div>    

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Recent Movements</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summaryData?.recent_movements?.map(mov => (
                        <TableRow key={mov.id}>
                            <TableCell className="font-medium">{mov.product_name}</TableCell>
                            <TableCell>{mov.movement_type_display}</TableCell>
                            <TableCell className="text-right">{mov.quantity}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Navigate to the main sections of the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link to="/products">
                            <Button className="w-full justify-between">
                                Manage Products <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/movements">
                            <Button variant="secondary" className="w-full justify-between">
                                View Transaction History <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/reports">
                            <Button variant="secondary" className="w-full justify-between">
                                View Detailed Reports <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;