import { Line } from "react-chartjs-2";

export const SalesChart = ({ data }) => {
    
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-8">No sales data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Monthly Sales Trend' },
            tooltip: {
                callbacks: {
                    label: (context) => `Units sold: ${context.parsed.y}`,
                }
            }
        },
        scales: {
            x: { title: { display: true, text: 'Month' } },
            y: { 
                beginAtZero: true, 
                title: { display: true, text: 'Total Quantity Sold' } 
            }
        }
    };

    const chartData = {
        labels: data.map(d => d.month),
        datasets: [{
            label: 'Sales by Month',
            data: data.map(d => d.total_quantity),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1,
        }],
    };

    return <Line data={chartData} options={options} />;
};
