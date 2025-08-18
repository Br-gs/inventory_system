import { useContext } from "react";
import AuthContext from "../context/authContext";
import { ChangepasswordForm, EditProfileForm } from "../components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ProfilePage = () => {
    const {user} = useContext(AuthContext);

    if (!user) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Your Profile</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>These are your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Name:</strong> {user.first_name || 'Not Specified'}</p>
                    <p><strong>Last Name:</strong> {user.last_name || 'Not Specified'}</p>
                    <p><strong>Rol:</strong> {user.is_staff ? 'Admin' : 'Regular User'}</p>
                    <EditProfileForm/>
                </CardContent>
            </Card>
            
            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Change your password here. Make sure to remember it!</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChangepasswordForm />
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;