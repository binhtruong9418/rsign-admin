import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Edit, Trash2, UserPlus, MoreVertical, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { usersAPI } from '@/lib/api';
import { Input, Select, Pagination, PaginationInfo, Modal } from '@/components/ui';
import { showToast } from '@/lib/toast';

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newUserData, setNewUserData] = useState({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: 'USER' as 'USER' | 'ADMIN',
    });
    const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    const queryClient = useQueryClient();

    // Fetch users using React Query
    const { data: usersResponse, isLoading, error } = useQuery({
        queryKey: ['users', currentPage, pageSize, searchTerm, statusFilter, roleFilter],
        queryFn: () => usersAPI.getUsers({
            page: currentPage - 1, // Convert to 0-based for API
            limit: pageSize,
            email: searchTerm || undefined,
            fullName: searchTerm || undefined,
            status: statusFilter || undefined,
            role: roleFilter || undefined,
        }),
    });

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: usersAPI.createUser,
        onSuccess: () => {
            showToast.success('User created successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowCreateModal(false);
            setNewUserData({
                email: '',
                password: '',
                fullName: '',
                phoneNumber: '',
                role: 'USER',
            });
        },
        onError: (error: any) => {
            showToast.error(error?.error || 'Failed to create user');
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'INACTIVE' }) =>
            usersAPI.updateUserStatus(userId, status),
        onSuccess: () => {
            showToast.success('User status updated successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowStatusModal(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            showToast.error(error?.error || 'Failed to update user status');
        },
    });

    const users = usersResponse?.items || [];
    const totalPages = usersResponse?.totalPages || 0;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleRoleChange = (value: string) => {
        setRoleFilter(value);
        setCurrentPage(1);
    };

    const handleCreateUser = () => {
        if (!newUserData.email || !newUserData.password || !newUserData.fullName) {
            showToast.error('Email, password, and full name are required');
            return;
        }
        createUserMutation.mutate(newUserData);
    };

    const handleUpdateStatus = () => {
        if (selectedUser) {
            updateStatusMutation.mutate({ userId: selectedUser.id, status: newStatus });
        }
    };

    const openStatusUpdateModal = (user: any) => {
        setSelectedUser(user);
        setNewStatus(user.status);
        setShowStatusModal(true);
        setOpenMenuId(null);
    };

    if (isLoading) {
        return <UserManagementSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load users. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
                    <p className="mt-1 text-sm text-secondary-600">
                        Manage users and their access permissions
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        className="btn-primary inline-flex items-center"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <Select
                        placeholder="All Statuses"
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        options={[
                            { value: '', label: 'All Statuses' },
                            { value: 'ACTIVE', label: 'Active' },
                            { value: 'INACTIVE', label: 'Inactive' },
                        ]}
                    />

                    {/* Role Filter */}
                    <Select
                        placeholder="All Roles"
                        value={roleFilter}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        options={[
                            { value: '', label: 'All Roles' },
                            { value: 'ADMIN', label: 'Admin' },
                            { value: 'USER', label: 'User' },
                        ]}
                    />

                    {/* Stats */}
                    <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        <Users className="h-4 w-4" />
                        <span>{usersResponse?.total || 0} total users</span>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Auth Provider
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-secondary-50 cursor-pointer" onClick={() => {
                                    // TODO: Open user detail modal or page
                                    console.log('View user:', user.id);
                                }}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-white">
                                                        {user.fullName?.charAt(0) || user.email.charAt(0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-secondary-900">
                                                    {user.fullName || user.email}
                                                </div>
                                                <div className="text-sm text-secondary-500">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        {user.phoneNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800'
                                            : user.status === 'SUSPENDED'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        {user.authProvider || 'LOCAL'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end space-x-3 relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === user.id ? null : user.id);
                                                }}
                                                className="text-secondary-400 hover:text-secondary-600 p-1 rounded hover:bg-secondary-100"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            {openMenuId === user.id && (
                                                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openStatusUpdateModal(user);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                                                    >
                                                        <Edit className="h-4 w-4 mr-3" />
                                                        Update Status
                                                    </button>
                                                    <div className="border-t border-secondary-200 my-1"></div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete user "${user.fullName || user.email}"?`)) {
                                                                // TODO: Implement delete
                                                            }
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-3" />
                                                        Delete User
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-secondary-200 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <PaginationInfo
                                currentPage={currentPage}
                                totalItems={usersResponse?.total || 0}
                                itemsPerPage={pageSize}
                            />
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                maxVisiblePages={5}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New User"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="email"
                            placeholder="user@example.com"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="John Doe"
                            value={newUserData.fullName}
                            onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Phone Number
                        </label>
                        <Input
                            placeholder="0123456789"
                            value={newUserData.phoneNumber}
                            onChange={(e) => setNewUserData({ ...newUserData, phoneNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={newUserData.role}
                            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as 'USER' | 'ADMIN' })}
                            options={[
                                { value: 'USER', label: 'User' },
                                { value: 'ADMIN', label: 'Admin' },
                            ]}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="btn-outline"
                            disabled={createUserMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateUser}
                            className="btn-primary"
                            disabled={createUserMutation.isPending}
                        >
                            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Update Status Modal */}
            <Modal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title="Update User Status"
            >
                <div className="space-y-4">
                    {selectedUser && (
                        <div className="bg-secondary-50 p-4 rounded-lg">
                            <p className="text-sm text-secondary-600">Update status for:</p>
                            <p className="font-medium text-secondary-900">{selectedUser.fullName || selectedUser.email}</p>
                            <p className="text-sm text-secondary-500">{selectedUser.email}</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                            options={[
                                { value: 'ACTIVE', label: 'Active - User is active' },
                                { value: 'INACTIVE', label: 'Inactive - User is banned' },
                            ]}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowStatusModal(false)}
                            className="btn-outline"
                            disabled={updateStatusMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateStatus}
                            className="btn-primary"
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function UserManagementSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-start">
                <div>
                    <div className="h-8 bg-secondary-200 rounded w-40"></div>
                    <div className="h-4 bg-secondary-200 rounded w-64 mt-2"></div>
                </div>
                <div className="h-10 bg-secondary-200 rounded w-32"></div>
            </div>

            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 bg-secondary-200 rounded"></div>
                    ))}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="px-6 py-4 bg-secondary-50">
                    <div className="grid grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-4 bg-secondary-200 rounded"></div>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-secondary-200">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-6 py-4">
                            <div className="grid grid-cols-6 gap-4 items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-secondary-200 rounded-full"></div>
                                    <div>
                                        <div className="h-4 bg-secondary-200 rounded w-32"></div>
                                        <div className="h-3 bg-secondary-200 rounded w-24 mt-2"></div>
                                    </div>
                                </div>
                                <div className="h-6 bg-secondary-200 rounded w-16"></div>
                                <div className="h-6 bg-secondary-200 rounded w-16"></div>
                                <div className="h-4 bg-secondary-200 rounded w-16"></div>
                                <div className="h-4 bg-secondary-200 rounded w-20"></div>
                                <div className="h-4 bg-secondary-200 rounded w-16"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}