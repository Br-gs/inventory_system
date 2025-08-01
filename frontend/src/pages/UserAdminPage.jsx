import {useState, useEffect, useCallback} from 'react';
import {axiosClient} from '../api';
import toast from 'react-hot-toast';

const UserAdminPage = () => {
    const [users, setUsers] = useState([]);
    const [Loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get('/users/');
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
                await axiosClient.patch(`/users/${user.id}/`, { is_staff: !user.is_staff });
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
                await axiosClient.delete(`/users/${userId}/`);
                toast.success(`User ${username} deleted successfully.`);
                fetchUsers();
            } catch (error) {
                toast.error(`Failed to delete user ${username}.`);
                console.error('Error deleting user:', error);
            }
        }
    };

    if (Loading) return <div>Loading users...</div>;

    return (
        <div>
            <h1>User Management</h1>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Admin Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.first_name}</td>
                            <td>{user.last_name}</td>
                            <td>{user.is_staff ? 'Admin' : 'User'}</td>
                            <td>
                                <button onClick={() => handleToggleAdmin(user)}>
                                    {user.is_staff ? 'Deactivate Admin' : 'Activate Admin'}
                                </button>
                                <button onClick={() => handleDeleteUser(user.id, user.username)}>
                                    Delete User
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserAdminPage;