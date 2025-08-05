import { useState, useEffect, useCallback, useMemo} from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale, Filler} from "chart.js";
import "chartjs-adapter-date-fns";
import {reportsService} from "../api";
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale, Filler);

const ReportsPage = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sales');

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const response = await reportsService.getInventoryReport();
            setReportData(response.data);
        } catch (error) {
            toast.error("Failed to fetch report data");
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

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
                data: topSellingProducts.map(p => p.total_movements),
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
        <div>
            <h1>Inventory Reports</h1>

            <div className="tabs" style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc' }}>
                <button onClick={() => setActiveTab('sales')} style={activeTab === 'sales' ? { fontWeight: 'bold', borderBottom: '2px solid blue' } : {}}>
                    Monthly Sales
                </button>
                <button onClick={() => setActiveTab('topProducts')} style={activeTab === 'topProducts' ? { fontWeight: 'bold', borderBottom: '2px solid blue' } : {}}>
                    Top Products
                </button>
                <button onClick={() => setActiveTab('stockLevels')} style={activeTab === 'stockLevels' ? { fontWeight: 'bold', borderBottom: '2px solid blue' } : {}}>
                    Stock Levels
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                {activeTab === 'sales' && (
                    (reportData?.sales_by_month?.length ?? 0) > 0 ? (
                        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                            <h3>Monthly Sales Trend</h3>
                            <Line data={salesChartData} options={{...salesChartOptions, maintainAspectRatio: false}} />
                        </div>
                    ) : <p>No hay datos</p>
                )}

                {activeTab === 'topProducts' && (
                    (reportData?.top_selling_products?.length ?? 0) > 0 ? (
                            <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                            <Bar data={topProductsChartData} options={{ ...topProductsChartOptions, maintainAspectRatio: false }} />
                            </div>
                    ) : <p>No hay datos de productos más vendidos para mostrar.</p>
                )}

                {activeTab === 'stockLevels' && (
                    (reportData?.stock_levels?.length ?? 0) > 0 ? (
                        <div style={{ position: 'relative', height: '500px', width: '100%' }}>
                        <Bar data={stockLevelsChartData} options={{ ...stockLevelsChartOptions, maintainAspectRatio: false }} />
                        </div>
                    ) : <p>No hay datos de niveles de stock para mostrar.</p>
        )}
                
            </div>
        </div>
    );
};

export default ReportsPage;

