import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, Search, Edit, Trash2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { signerGroupsAPI } from '@/lib/api';
import { Input, Pagination, PaginationInfo } from '@/components/ui';

export default function SignerGroups() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Fetch signer groups using React Query
    const { data: signerGroupsResponse, isLoading, error } = useQuery({
        queryKey: ['signerGroups', currentPage, pageSize, searchTerm],
        queryFn: () => signerGroupsAPI.getSignerGroups({
            page: currentPage - 1, // Convert to 0-based for API
            limit: pageSize,
            search: searchTerm || undefined,
        }),
    });

    const signerGroups = signerGroupsResponse?.items || [];
    const totalPages = signerGroupsResponse?.totalPages || 0;

    const filteredGroups = signerGroups;

    if (isLoading) {
        return <SignerGroupsSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load signer groups. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Signer Groups</h1>
                    <p className="mt-1 text-sm text-secondary-600">
                        Organize users into groups for bulk document sending
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary inline-flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Group
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="card p-6">
                <div className="relative max-w-md">
                    <Input
                        placeholder="Search signer groups..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page when searching
                        }}
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none" />
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group) => (
                    <div key={group.id} className="card-hover p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary-600" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-secondary-900">{group.name}</h3>
                                    <p className="text-sm text-secondary-600 mt-1">{group.memberCount} members</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded">
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded">
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {group.description && (
                            <p className="text-sm text-secondary-600 mt-4">{group.description}</p>
                        )}

                        <div className="mt-4 pt-4 border-t border-secondary-200">
                            <p className="text-xs text-secondary-500">
                                Created {formatDate(group.createdAt, 'relative')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredGroups.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-secondary-400" />
                    <h3 className="mt-2 text-sm font-medium text-secondary-900">No signer groups found</h3>
                    <p className="mt-1 text-sm text-secondary-500">
                        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new signer group.'}
                    </p>
                    {!searchTerm && (
                        <div className="mt-6">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary inline-flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Group
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <PaginationInfo
                        currentPage={currentPage}
                        totalItems={signerGroupsResponse?.total || 0}
                        itemsPerPage={pageSize}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        maxVisiblePages={5}
                    />
                </div>
            )}

            {/* Create Modal Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Create Signer Group</h3>
                        <p className="text-sm text-secondary-600 mb-4">Create group functionality coming soon...</p>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="btn-secondary w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SignerGroupsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-start">
                <div>
                    <div className="h-8 bg-secondary-200 rounded w-32"></div>
                    <div className="h-4 bg-secondary-200 rounded w-64 mt-2"></div>
                </div>
                <div className="h-10 bg-secondary-200 rounded w-32"></div>
            </div>

            <div className="card p-6">
                <div className="h-10 bg-secondary-200 rounded max-w-md"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div className="h-12 w-12 bg-secondary-200 rounded-lg"></div>
                                <div className="ml-4">
                                    <div className="h-5 bg-secondary-200 rounded w-24"></div>
                                    <div className="h-4 bg-secondary-200 rounded w-16 mt-2"></div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <div className="h-8 w-8 bg-secondary-200 rounded"></div>
                                <div className="h-8 w-8 bg-secondary-200 rounded"></div>
                            </div>
                        </div>
                        <div className="h-4 bg-secondary-200 rounded w-full mt-4"></div>
                        <div className="h-3 bg-secondary-200 rounded w-24 mt-4 pt-4 border-t border-secondary-200"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}