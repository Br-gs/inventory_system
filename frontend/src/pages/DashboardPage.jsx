import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from "react-router-dom";
import { reportsService } from '@/api';
import { LoadingSpinner } from '@/components';
import AuthContext from '@/context/authContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Package, Archive, TrendingUp, ArrowRight, ShoppingCart, History, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";


const AdminDashboard = () => {
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
    const dueOrdersCount = summaryData?.kpis?.due_purchase_orders_count ?? 0;

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

                <Link to="/suppliers">
                    <Card className={cn(dueOrdersCount > 0 && "border-red-500/50 bg-red-500/10 hover:bg-red-500/20")}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Payments Due</CardTitle>
                            <AlertTriangle className={cn("h-4 w-4", dueOrdersCount > 0 ? "text-red-500" : "text-muted-foreground")} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dueOrdersCount}</div>
                            <p className="text-xs text-muted-foreground">Suppliers with payments due or due within 7 days.</p>
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

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">
                    Welcome, {user?.first_name || user?.username}!
                </h1>
                <p className="text-muted-foreground">
                    From here, you can navigate to the sections of the application to view the inventory.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <ShoppingCart className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>Products</CardTitle>
                                <CardDescription>Check out the complete product catalog and current stock.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end">
                        <Link to="/products" className="w-full">
                            <Button className="w-full">View Products <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <History className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>Movements</CardTitle>
                                <CardDescription>Review the detailed history of all stock transactions.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end">
                        <Link to="/movements" className="w-full">
                            <Button variant="secondary" className="w-full">
                                View Movements History
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  return user?.is_staff ? <AdminDashboard /> : <UserDashboard />;
};

export default DashboardPage;