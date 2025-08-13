import { useState, useEffect} from "react";
import { reportsService } from "@/api";
import toast from "react-hot-toast";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale, Filler} from "chart.js";
import "chartjs-adapter-date-fns";
import { ReportFilters,  LoadingSpinner, ChartContainer,SalesChart, TopProductsChart, StockLevelsChart } from "../components";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale, Filler);

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState("sales");
    
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [stockLevels, setStockLevels] = useState([]);
    
    const [loadingSales, setLoadingSales] = useState(true);
    const [loadingGeneral, setLoadingGeneral] = useState(true);
    
    const [filters, setFilters] = useState({
        product_id: '',
        start_date: '',
        end_date: '',
    });

    // for upload sales data
    const fetchSalesData = async (filtersToUse = {}) => {
        setLoadingSales(true);
        try {
            const response = await reportsService.getInventoryReport(filtersToUse);
            
            if (response.data && response.data.sales_by_month) {
                setSalesData(response.data.sales_by_month);
            } else {
                setSalesData([]);
            }
        } catch (error) {
            toast.error("Failed to fetch sales data");
            console.error("Error fetching sales data:", error);
            setSalesData([]);
        } finally {
            setLoadingSales(false);
        }
    };

    // for upload sales data 
    const fetchGeneralData = async () => {
        setLoadingGeneral(true);
        try {
            const response = await reportsService.getInventoryReport({});
            
            if (response.data) {
                setTopProducts(response.data.top_selling_products || []);
                setStockLevels(response.data.stock_levels || []);
            }
        } catch (error) {
            toast.error("Failed to fetch general data");
            console.error("Error fetching general data:", error);
            setTopProducts([]);
            setStockLevels([]);
        } finally {
            setLoadingGeneral(false);
        }
    };


    useEffect(() => {
        fetchSalesData();
        fetchGeneralData();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        
        fetchSalesData(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters = { product_id: '', start_date: '', end_date: '' };
        setFilters(clearedFilters);
        fetchSalesData(clearedFilters);
    };

    const isInitialLoading = loadingSales && loadingGeneral;

    if (isInitialLoading) {
        return (
            <LoadingSpinner></LoadingSpinner>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Inventory Reports</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sales">Monthly Sales</TabsTrigger>
                    <TabsTrigger value="topProducts">Top Products</TabsTrigger>
                    <TabsTrigger value="stockLevels">Stock Levels</TabsTrigger>
                </TabsList>

                <TabsContent value="sales">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Trend</CardTitle>
                            <CardDescription>Filter by product and date range to analyze sales patterns.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ReportFilters 
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onClearFilters={handleClearFilters}
                            />
                            {loadingSales ? (
                                <LoadingSpinner />
                            ) : (
                                <ChartContainer>
                                    <SalesChart data={salesData} />
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="topProducts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 5 Products by Units Sold</CardTitle>
                            <CardDescription>Overall best-selling products.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingGeneral ? (
                                <LoadingSpinner />
                            ) : (
                                <ChartContainer>
                                    <TopProductsChart data={topProducts} />
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stockLevels">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 10 Products by Stock Level</CardTitle>
                            <CardDescription>Current inventory levels across all products.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingGeneral ? (
                                <LoadingSpinner />
                            ) : (
                                <ChartContainer height="500px">
                                    <StockLevelsChart data={stockLevels} />
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};



export default ReportsPage;

