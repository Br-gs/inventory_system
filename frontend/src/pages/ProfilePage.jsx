import { useContext } from "react";
import AuthContext from "../context/authContext";
import { ChangepasswordForm } from "../components";

const ProfilePage = () => {
    const {user} = useContext(AuthContext);

    if (!user) {
        return <div>Loading profile...</div>;
    }

    return (
        <div>
            <h1>Profile</h1>
            <div>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>First Name:</strong> {user.first_name}</p>
                <p><strong>Last Name:</strong> {user.last_name}</p>
            </div>

            <hr />

            <div>
                <h2>Change Password</h2>
                <p>Change your password here. Make sure to remember it!</p>
                <ChangepasswordForm />
            </div>
        </div>
    );
};

export default ProfilePage;