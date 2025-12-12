import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Filter,
    Search,
    Plus,
    Eye,
    MoreVertical,
    Users,
    FileText,
    Clock,
} from 'lucide-react';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { documentsAPI } from '@/lib/api';
import type { DocumentFilters } from '@/types';
import { Input, Select, Pagination, PaginationInfo } from '@/components/ui';

export default function DocumentList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState<DocumentFilters>({
        status: searchParams.get('status') as any || undefined,
        signingMode: searchParams.get('signingMode') as any || undefined,
        search: searchParams.get('search') || '',
    });
    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page') || '1')
    );
    const [pageSize] = useState(10);

    // Fetch documents using React Query
    const { data: documentsResponse, isLoading, error } = useQuery({
        queryKey: ['documents', currentPage, pageSize, filters],
        queryFn: () => documentsAPI.getDocuments({
            page: currentPage - 1, // Convert to 0-based for API
            limit: pageSize,
            search: filters.search || undefined,
            status: filters.status || undefined,
            signingMode: filters.signingMode || undefined,
        }),
    });

    const documents = documentsResponse?.items || [];
    const totalPages = documentsResponse?.totalPages || 0;

    const handleFilterChange = (newFilters: Partial<DocumentFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        setCurrentPage(1); // Reset to first page when filtering

        // Update URL params
        const params = new URLSearchParams();
        Object.entries(updatedFilters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        params.set('page', '1');
        setSearchParams(params);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    if (isLoading) {
        return <DocumentListSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load documents. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Documents</h1>
                    <p className="mt-1 text-sm text-secondary-600">
                        Manage and track all your digital signature documents
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        to="/admin/documents/create"
                        className="btn-primary inline-flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Document
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Input
                            placeholder="Search documents..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange({ search: e.target.value })}
                            className="pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <Select
                        placeholder="All Statuses"
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange({ status: e.target.value as any || undefined })}
                        options={[
                            { value: '', label: 'All Statuses' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'in-progress', label: 'In Progress' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ]}
                    />

                    {/* Signing Mode Filter */}
                    <Select
                        placeholder="All Modes"
                        value={filters.signingMode || ''}
                        onChange={(e) => handleFilterChange({ signingMode: e.target.value as any || undefined })}
                        options={[
                            { value: '', label: 'All Modes' },
                            { value: 'INDIVIDUAL', label: 'Individual' },
                            { value: 'SHARED', label: 'Shared' },
                        ]}
                    />

                    {/* Filter Button */}
                    <button className="btn-secondary inline-flex items-center justify-center">
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Documents Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Document
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Mode
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {documents.map((document) => (
                                <tr key={document.id} className="hover:bg-secondary-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-primary-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-secondary-900">
                                                    {document.title}
                                                </div>
                                                <div className="text-sm text-secondary-500">
                                                    Created by {document.createdBy?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                            getStatusColor(document.status)
                                        )}>
                                            {getStatusLabel(document.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {document.signingMode === 'SHARED' ? (
                                                <Users className="h-4 w-4 text-secondary-400 mr-2" />
                                            ) : (
                                                <Clock className="h-4 w-4 text-secondary-400 mr-2" />
                                            )}
                                            <span className="text-sm text-secondary-600">
                                                {document.signingMode}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        {formatDate(document.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button className="text-primary-600 hover:text-primary-900">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button className="text-secondary-400 hover:text-secondary-600">
                                                <MoreVertical className="h-4 w-4" />
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
                                totalItems={documentsResponse?.total || 0}
                                itemsPerPage={pageSize}
                            />
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                maxVisiblePages={5}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DocumentListSkeleton() {
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 bg-secondary-200 rounded"></div>
                    ))}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="px-6 py-4 bg-secondary-50">
                    <div className="grid grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-4 bg-secondary-200 rounded"></div>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-secondary-200">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-6 py-4">
                            <div className="grid grid-cols-5 gap-4 items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-secondary-200 rounded-lg"></div>
                                    <div>
                                        <div className="h-4 bg-secondary-200 rounded w-32"></div>
                                        <div className="h-3 bg-secondary-200 rounded w-24 mt-2"></div>
                                    </div>
                                </div>
                                <div className="h-6 bg-secondary-200 rounded w-20"></div>
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