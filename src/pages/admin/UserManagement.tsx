import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Edit, Trash2, Eye, UserPlus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { usersAPI } from '@/lib/api';
import { Input, Select, Pagination, PaginationInfo } from '@/components/ui';

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

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

    const users = usersResponse?.items || [];
    const totalPages = usersResponse?.totalPages || 0;

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
                    <button className="btn-primary inline-flex items-center">
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
                                <tr key={user.id} className="hover:bg-secondary-50">
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
                                                : 'bg-red-100 text-red-800'
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
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button className="text-primary-600 hover:text-primary-900">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button className="text-secondary-600 hover:text-secondary-900">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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