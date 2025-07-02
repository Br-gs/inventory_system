import { useContext } from "react";
import AuthContext from "../context/authContext";

const DashboardPage = () => {
    const {user, logoutUser} = useContext(AuthContext);

    return (
        <div className="dashboard-page">
            <h1>Dashboard</h1>
            <p>Welcome, {user?.username}!</p>
            <p>Your role is: {user?.is_staff ? 'Administrator' : 'Regular User'}</p>

            <button onClick={logoutUser}>Logout</button>

            <hr />
            <h2>Dashboard Features</h2>
            <ul>
                <li>View your profile</li>
                <li>Manage your account settings</li>
            </ul>
        </div>
    );
};

export default DashboardPage;