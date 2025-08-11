import { useState, useEffect, useCallback, useMemo} from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale, Filler} from "chart.js";
import "chartjs-adapter-date-fns";
import {reportsService} from "../api";
import toast from 'react-hot-toast';
import { ReportFilters } from "../components";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale, Filler);

const ReportsPage = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        product_id: '',
        start_date: '',
        end_date: '',
    })
    const [stagedFilters, setStagedFilters] = useState(filters); 

    const fetchReports = useCallback(async (currentFilters) => {
        setLoading(true);
        try {
            const controller = new AbortController();

            const response = await reportsService.getInventoryReport(currentFilters, {signal: controller.signal});
            setReportData(response.data);
        } catch (error) {
            toast.error("Failed to fetch report data");
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports(filters);
        setStagedFilters
    }, [fetchReports, setStagedFilters , filters]);

    const handleStagedFilterChange = (e) => {
        const { name, value } = e.target;
        setStagedFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        setFilters(stagedFilters);
    };

    const clearFilters = () => {
        const cleared = { product_id: '', start_date: '', end_date: '' };
        setStagedFilters(cleared);
        setFilters(cleared);
    };

    const salesChartData = useMemo(() => {
        const salesByMonth = reportData?.sales_by_month ?? [];
        return {
            labels : salesByMonth.map(d => d.month),
            datasets: [{
                label: 'Sales by Month',
                data: salesByMonth.map(d => d.total_quantity),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192)',
                fill: true,
                tension: 0.1,
            }],
        };
    }, [reportData]);

    const salesChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 750,
            easing: 'easeOutQuart'
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend:{ position: 'top'},
            title: {display: true, text: 'Monthly Sales Trend' },
            tooltip: {
                callbacks: {
                    label: (context) => `units sold: ${context.parsed.y}`,
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Month' },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Total Quantity Sold' },
            }
        }
    }), []);

    const topProductsChartData = useMemo(() => {
        const topSellingProducts = reportData?.top_selling_products ?? [];
        return {
            labels : topSellingProducts.map(p => p.product__name),
            datasets: [{
                label: 'Number of Sales Transactions',
                data: topSellingProducts.map(p => p.total_quantity_sold),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            }],
        };
    }, [reportData]);

    const topProductsChartOptions = useMemo(() => ({
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 750,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: { display: false },
            title : { display: true, text: 'Top 5 Selling Products' },
            tooltip: {
                callbacks: {
                    label: (context) => `Total Sales Transactions: ${context.parsed.x}`,
                }
            }
        }
    }), []);

    const stockLevelsChartData = useMemo(() => {
        const stockLevels = reportData?.stock_levels ?? [];
        return {
            labels : stockLevels.map(p => p.name),
            datasets: [{
                label: 'Quantity in Stock',
                data: stockLevels.map(p => p.quantity),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
            }],
        };
    }, [reportData]);

    const stockLevelsChartOptions =  useMemo(() => ({
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 750,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top 10 Products by Stock Level' },
            tooltip: {
                callbacks: {
                    label: (context) => `Stock: ${context.parsed.x}`,
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                title: { display: true, text: 'Quantity in Stock' }
            }
        }
    }), []);

    if (loading) return <p>Generating reports... </p>
    if (!reportData || Object.keys(reportData).length === 0) { return <p>No report data available</p>; }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Inventory Reports</h1>

            <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sales">Monthly Sales</TabsTrigger>
                    <TabsTrigger value="topProducts">Top Products</TabsTrigger>
                    <TabsTrigger value="stockLevels">Stock Levels</TabsTrigger>
                </TabsList>

                <TabsContent value="sales">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Trend</CardTitle>
                            <CardDescription>Filter by product and date range to analyze sales.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <ReportFilters 
                            filters={stagedFilters}
                            onFilterChange={handleStagedFilterChange}
                            onApplyFilters={handleApplyFilters}
                            onClearFilters={clearFilters}
                        />
                        {loading ? <p>Loading graph...</p> : 
                            (reportData?.sales_by_month?.length > 0 ? 
                            <div style={{ position: 'relative', height: '400px' }}><Line data={salesChartData} options={{...salesChartOptions, maintainAspectRatio: false}} /></div> : 
                            <p>There are no sales data for the selected filters.</p>)
                        }
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="topProducts">
                    <Card>
                        <CardHeader><CardTitle>Top 5 Products by Units Sold</CardTitle></CardHeader>
                        <CardContent>
                        {loading ? <p>Loading  graph...</p> :
                            (reportData?.top_selling_products?.length > 0 ?
                            <div style={{ position: 'relative', height: '400px' }}><Bar data={topProductsChartData} options={{ ...topProductsChartOptions, maintainAspectRatio: false }} /></div> :
                            <p>There is no data on best-selling products.</p>)
                        }
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stockLevels">
                    <Card>
                        <CardHeader><CardTitle>Top 10 Products by Stock Level</CardTitle></CardHeader>
                        <CardContent>
                        {loading ? <p>Loading graph...</p> :
                            (reportData?.stock_levels?.length > 0 ?
                            <div style={{ position: 'relative', height: '500px' }}><Bar data={stockLevelsChartData} options={{ ...stockLevelsChartOptions, maintainAspectRatio: false }} /></div> :
                            <p>No stock level data available.</p>)
                        }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ReportsPage;

