import React, { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
// import API from "services/api";
import { Line } from "react-chartjs-2";
import API from "services/api";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PriceEvolution {
    date: string;
    price: number;
}


const Dashboard = () => {
    const [data, setData] = useState<PriceEvolution[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await API.get("/wallet/get_data");
                setData(response.data);

                // const fakeData: PriceEvolution[] = [
                //     { date: "2025-01-01", price: 1000 },
                //     { date: "2025-01-02", price: 1020 },
                //     { date: "2025-01-03", price: 980 },
                //     { date: "2025-01-04", price: 1050 },
                //     { date: "2025-01-05", price: 1100 },
                //     { date: "2025-01-06", price: 1080 },
                //     { date: "2025-01-07", price: 1150 },
                // ];
                // await new Promise((resolve) => setTimeout(resolve, 1000));
                // setData(fakeData);
                setError(null);
            } catch (err) {
                setError("Failed to fetch data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const chartData = {
        labels: data.map((entry) => entry.date),
        datasets: [
            {
                label: "Crypto Wallet Price Evolution",
                data: data.map((entry) => entry.price),
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
            title: {
                display: true,
                text: "Crypto Wallet Price Evolution",
            },
        },
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Crypto Wallet</h1>
            {isLoading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!isLoading && !error && data.length > 0 && (
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <Line data={chartData} options={chartOptions} />
                </div>
            )}
            {!isLoading && !error && data.length === 0 && <p>No data available.</p>}
        </div>
    );
};

export default Dashboard;
