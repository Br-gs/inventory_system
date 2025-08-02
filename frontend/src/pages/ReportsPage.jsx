import { useState, useEffect, useCallback } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import {reportsService} from "../api";
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ReportsPpage = () => {
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
        }]
    };

    const topProductsChartData = {
        labels : reportData.top_selling_products.map(p => p.product__name),
        datasets: [{
            label: 'Sales number',
            data: reportData.top_selling_products.map(p => p.total_movements),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        }]
    };

    const stockLevelsChartData = {
        labels : reportData.stock_levels.map(p => p.name),
        datasets: [{
            label: 'Quantity in Stock',
            data: reportData.stock_levels.map(p => p.quantity),
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
        }]
    };

    return (
        <div>
            <h1>Inventory Reports</h1>
            <div>
                
                <div>
                    <h3>Sales by Month</h3>
                    <Bar data={salesChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>

                <div>
                    <h3>Top 5 Selling Products</h3>
                    <Pie data={topProductsChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>

                <div>
                    <h3>top 10 products by stock level </h3>
                    <Bar data={stockLevelsChartData} options={{ responsive: true, indexAxis: 'y' }} />
                </div>
                
            </div>
        </div>
    );
};

export default ReportsPpage;

