import { useState, useEffect, useCallback } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale } from "chart.js";
import "chartjs-adapter-date-fns";
import {reportsService} from "../api";
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, TimeScale);

const ReportsPage = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRepors = useCallback(async () => {
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
        fetchRepors();
    }, [fetchRepors]);

    if (loading) return <p>Generating reports... </p>
    if (!reportData) return <p>No report data available</p>;

    const salesChartData = {
        labels : reportData.sales_by_month.map(d => d.month),
        datasets: [{
            label: 'Sales by Month',
            data: reportData.sales_by_month.map(d => d.total_quantity),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192)',
            fill: true,
            tension: 0.1,
        }]
    };

    const salesChartOptions = {
        responsive: true,
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
                type: 'time',
                time: { unit: 'month', tooltipFormat: 'MMM yyyy' },
                title: { display: true, text: 'Month' },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Total Quantity Sold' },
            }
        }
    };

    const topProductsChartData = {
        labels : reportData.top_selling_products.map(p => p.product__name),
        datasets: [{
            label: 'Number of Sales Transactions',
            data: reportData.top_selling_products.map(p => p.total_movements),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
            ],
        }],
    };

    const topProductsChartOptions = {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: { display: false },
            title : { display: true, text: 'Top 5 Selling Products' },
            tooltip: {
                callbacks: {
                    label: (context) => `Total Sales Transactions: ${context.parsed.x}`,
                }
            }
        }
    };

    const stockLevelsChartData = {
        labels : reportData.stock_levels.map(p => p.name),
        datasets: [{
            label: 'Quantity in Stock',
            data: reportData.stock_levels.map(p => p.quantity),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
        }]
    };

    const stockLevelsChartOptions = {
        indexAxis: 'y',
        responsive: true,
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
    };


    return (
        <div>
            <h1>Inventory Reports</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                <div>
                    <Line data={salesChartData} options={salesChartOptions} />
                </div>

                <div>
                    <Bar data={topProductsChartData} options={topProductsChartOptions} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <Bar data={stockLevelsChartData} options={stockLevelsChartOptions} />
                </div>
                
            </div>
        </div>
    );
};

export default ReportsPage;

