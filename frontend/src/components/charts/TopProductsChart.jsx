import { Bar } from "react-chartjs-2";

export const TopProductsChart = ({ data }) => {
    
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-8">No products data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top Selling Products' },
            tooltip: {
                callbacks: {
                    label: (context) => `Total Sales: ${context.parsed.x} units`,
                }
            }
        },
        scales: {
            x: { 
                beginAtZero: true, 
                title: { display: true, text: 'Units Sold' } 
            }
        }
    };

    const chartData = {
        labels: data.map(p => p.product__name),
        datasets: [{
            label: 'Units Sold',
            data: data.map(p => p.total_quantity_sold),
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)'
            ],
        }],
    };

    return <Bar data={chartData} options={options} />;
};