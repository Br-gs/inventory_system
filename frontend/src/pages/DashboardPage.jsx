import { Link } from "react-router-dom";

const DashboardPage = () => {
    return (
        <div>
            <h1>Welcome to the Inventory Dashboard</h1>
            <p>Here you can manage your products and movements.</p>
            <ul>
                <li>
                    <Link to="/products">Manage Products</Link>
                </li>
                <li>
                    <Link to="/movements">View Movements</Link>
                </li>
            </ul>
        </div>
    );
};

export default DashboardPage;