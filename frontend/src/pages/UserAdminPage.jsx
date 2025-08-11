import {useState, useEffect, useCallback} from 'react';
import {axiosClient} from '../api';
import toast from 'react-hot-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from 'lucide-react';

const UserAdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/api/users/');
            setUsers(response.data.results);
        } catch (error) {
            toast.error('Failed to fetch users');
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleAdmin = async (user) => {
        const action = user.is_staff ? 'Deactivate Admin' : 'Activate Admin';
        if (window.confirm(`Are you sure you want to ${action} for ${user.username}?`)) {
            try {
                await axiosClient.patch(`/api/users/${user.id}/`, { is_staff: !user.is_staff });
                toast.success(`User ${user.username} admin status updated successfully.`);
                fetchUsers();
            } catch (error) {
                toast.error(`Failed to update user ${user.username} admin status.`);
                console.error('Error updating user admin status:', error);
            }
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to delete user ${username}? this action cannot be undone.`)) {
            try {
                await axiosClient.delete(`/api/users/${userId}/`);
                toast.success(`User ${username} deleted successfully.`);
                fetchUsers();
            } catch (error) {
                toast.error(`Failed to delete user ${username}.`);
                console.error('Error deleting user:', error);
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Forward users to administrators or remove them from the system.</CardDescription> 
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>First Name</TableHead>
                                <TableHead>Last Name</TableHead>
                                <TableHead>Admin Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan="4" className="h-24 text-center">Cargando...</TableCell></TableRow>
                            ) : users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.first_name}</TableCell>
                                    <TableCell>{user.last_name}</TableCell>
                                    <TableCell> 
                                        <Badge variant={user.is_staff ? 'default' : 'secondary'}>
                                            {user.is_staff ? 'Admin' : 'Usuario'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open Menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align='end'>
                                                <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                                                    {user.is_staff ? 'Remove Admin' : 'Become Admin'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id, user.username)} className="text-red-500 focus:text-red-500">
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserAdminPage;