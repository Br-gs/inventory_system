import { Bar } from "react-chartjs-2";

export const StockLevelsChart = ({ data }) => {
    
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500 py-8">No stock data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Products by Stock Level' },
            tooltip: {
                callbacks: {
                    label: (context) => `Stock: ${context.parsed.x} units`,
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

    const chartData = {
        labels: data.map(p => p.name),
        datasets: [{
            label: 'Quantity in Stock',
            data: data.map(p => p.quantity),
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
        }],
    };

    return <Bar data={chartData} options={options} />;
};