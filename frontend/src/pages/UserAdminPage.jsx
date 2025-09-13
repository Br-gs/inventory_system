import { useState, useEffect, useCallback } from 'react';
import { authService } from '../api';
import toast from 'react-hot-toast';
import {UserCreateForm} from '@/components';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal, Plus, MapPin, Phone, Mail, Calendar } from 'lucide-react';

const UserAdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authService.getUsers();
            setUsers(response.data.results || response.data);
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
        const action = user.is_staff ? 'Remove Admin' : 'Grant Admin';
        if (window.confirm(`Are you sure you want to ${action} privileges for ${user.username}?`)) {
            try {
                const updateData = { 
                    is_staff: !user.is_staff,
                    profile: {
                        role: !user.is_staff ? 'admin' : 'employee'
                    }
                };
                await authService.updateUser(user.id, updateData);
                toast.success(`User ${user.username} admin status updated successfully.`);
                fetchUsers();
            } catch (error) {
                toast.error(`Failed to update user ${user.username} admin status.`);
                console.error('Error updating user admin status:', error);
            }
        }
    };

    const handleToggleLocationAccess = async (user) => {
        const newAccess = !user.profile?.can_change_location;
        const action = newAccess ? 'Grant' : 'Revoke';
        
        if (window.confirm(`${action} location change permissions for ${user.username}?`)) {
            try {
                const updateData = {
                    profile: {
                        ...user.profile,
                        can_change_location: newAccess
                    }
                };
                await authService.updateUser(user.id, updateData);
                toast.success(`Location permissions updated for ${user.username}.`);
                fetchUsers();
            } catch (error) {
                toast.error(`Failed to update location permissions for ${user.username}.`);
                console.error('Error updating location permissions:', error);
            }
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to delete user ${username}? This action cannot be undone.`)) {
            try {
                await authService.deleteUser(userId);
                toast.success(`User ${username} deleted successfully.`);
                fetchUsers();
            } catch (error) {
                toast.error(`Failed to delete user ${username}.`);
                console.error('Error deleting user:', error);
            }
        }
    };

    const handleUserCreated = () => {
        setShowCreateDialog(false);
        fetchUsers();
    };

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'admin': return 'default';
            case 'manager': return 'secondary';
            case 'employee': return 'outline';
            default: return 'outline';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>
                            Manage users, their roles, and location permissions.
                        </CardDescription>
                    </div>
                    
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Create a new user account and assign their role and default location.
                                </DialogDescription>
                            </DialogHeader>
                            <UserCreateForm 
                                onSuccess={handleUserCreated}
                                onClose={() => setShowCreateDialog(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User Info</TableHead>
                                    <TableHead>Role & Status</TableHead>
                                    <TableHead className="hidden lg:table-cell">Location Access</TableHead>
                                    <TableHead className="hidden xl:table-cell">Contact</TableHead>
                                    <TableHead className="hidden xl:table-cell">Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan="6" className="h-24 text-center">
                                            Loading users...
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan="6" className="h-24 text-center">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            {/* User Info */}
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{user.username}</div>
                                                    {(user.first_name || user.last_name) && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Role & Status */}
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    <Badge 
                                                        variant={getRoleBadgeVariant(user.is_staff ? 'admin' : user.profile?.role)}
                                                        className="w-fit"
                                                    >
                                                        {user.is_staff ? 'admin' : (user.profile?.role || 'employee')}
                                                    </Badge>
                                                </div>
                                            </TableCell>

                                            {/* Location Access */}
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="space-y-1 text-sm">
                                                    {user.profile?.default_location_name && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            <span>{user.profile.default_location_name}</span>
                                                        </div>
                                                    )}
                                                    {user.profile?.can_change_location && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Can Change Location
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Contact */}
                                            <TableCell className="hidden xl:table-cell">
                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">{user.email}</span>
                                                    </div>
                                                    {user.profile?.phone_number && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{user.profile.phone_number}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Joined */}
                                            <TableCell className="hidden xl:table-cell">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatDate(user.date_joined)}</span>
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem 
                                                            onClick={() => handleToggleAdmin(user)}
                                                        >
                                                            {user.is_staff ? 'Remove Admin' : 'Grant Admin'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleToggleLocationAccess(user)}
                                                        >
                                                            {user.profile?.can_change_location 
                                                                ? 'Revoke Location Access' 
                                                                : 'Grant Location Access'
                                                            }
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteUser(user.id, user.username)} 
                                                            className="text-red-500 focus:text-red-500"
                                                        >
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserAdminPage;