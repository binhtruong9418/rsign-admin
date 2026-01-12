import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Folder,
    Search,
    Calendar,
    Users,
    CheckCircle,
    Clock,
    Send,
    Filter,
    MoreVertical,
    TrendingUp,
    Trash2,
} from 'lucide-react';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { documentBatchAPI } from '@/lib/api';
import { Input, Select, Pagination, Button, Card } from '@/components/ui';
import type { DocumentBatchFilters } from '@/types';
import { toast } from 'react-hot-toast';

export default function DocumentBatches() {
    const [filters, setFilters] = useState<DocumentBatchFilters>({
        page: 0,
        limit: 10,
        status: undefined,
        search: '',
        dateFrom: undefined,
        dateTo: undefined,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Fetch document batches
    const { data: batchesResponse, isLoading, error, refetch } = useQuery({
        queryKey: ['document-batches', filters, currentPage],
        queryFn: () => documentBatchAPI.getDocumentBatches({
            ...filters,
            page: currentPage - 1, // Convert to 0-based for API
        }),
    });

    const batches = batchesResponse?.items || [];
    const totalPages = batchesResponse?.totalPages || 0;
    const totalBatches = batchesResponse?.total || 0;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    const handleFilterChange = (newFilters: Partial<DocumentBatchFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSendBatch = async (batchId: string) => {
        if (!confirm('Are you sure you want to send all documents in this batch for signing?')) {
            return;
        }

        try {
            const result = await documentBatchAPI.sendDocumentBatch(batchId);

            if (result.success) {
                toast.success(`Successfully sent ${result.sentCount} documents. ${result.failedCount > 0 ? `${result.failedCount} failed.` : ''}`);
                refetch(); // Refresh the list
            } else {
                toast.error('Failed to send batch');
            }
        } catch (error: any) {
            toast.error(error.error || 'Failed to send batch');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'DRAFT': 'bg-gray-100 text-gray-800',
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'IN_PROGRESS': 'bg-blue-100 text-blue-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800',
        };
        const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';

        return (
            <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                colorClass
            )}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const getCompletionRate = (batch: any) => {
        const rate = batch.completionRate || 0;
        const color = rate === 100 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600';
        return (
            <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                        className={cn("h-2 rounded-full", {
                            'bg-green-500': rate === 100,
                            'bg-yellow-500': rate >= 50 && rate < 100,
                            'bg-red-500': rate < 50
                        })}
                        style={{ width: `${rate}%` }}
                    />
                </div>
                <span className={cn('text-sm font-medium', color)}>
                    {rate}%
                </span>
            </div>
        );
    };

    if (isLoading) {
        return <DocumentBatchesSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load document batches. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Document Batches</h1>
                    <p className="mt-1 text-sm text-secondary-600">
                        Monitor and manage bulk document operations
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                    <span className="text-sm text-secondary-600">
                        Total: {totalBatches} batches
                    </span>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                            <Input
                                type="text"
                                placeholder="Search batches..."
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange({ search: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Status
                        </label>
                        <Select
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange({
                                status: e.target.value as 'COMPLETED' | 'PENDING' | 'IN_PROGRESS' | 'DRAFT' | 'CANCELLED' | undefined || undefined
                            })}
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'DRAFT', label: 'Draft' },
                                { value: 'PENDING', label: 'Pending' },
                                { value: 'IN_PROGRESS', label: 'In Progress' },
                                { value: 'COMPLETED', label: 'Completed' },
                                { value: 'CANCELLED', label: 'Cancelled' },
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            From Date
                        </label>
                        <Input
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(e) => handleFilterChange({ dateFrom: e.target.value || undefined })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            To Date
                        </label>
                        <Input
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(e) => handleFilterChange({ dateTo: e.target.value || undefined })}
                        />
                    </div>
                </div>
            </Card>

            {/* Batches List */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Batch
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Documents
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Progress
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
                            {batches.map((batch) => (
                                <tr 
                                    key={batch.batchId} 
                                    className="hover:bg-secondary-50 cursor-pointer"
                                    onClick={() => navigate(`/admin/documents?batchId=${batch.batchId}`)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Folder className="h-5 w-5 text-secondary-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-secondary-900">
                                                    {batch.title || `Batch ${batch.batchId.slice(0, 8)}`}
                                                </div>
                                                <div className="text-sm text-secondary-500">
                                                    ID: {batch.batchId.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(batch.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-900">
                                            {batch.documentCount} total
                                        </div>
                                        <div className="text-xs text-secondary-500">
                                            {batch.completedCount} completed, {batch.pendingCount} pending
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getCompletionRate(batch)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-900">
                                            {formatDate(batch.createdAt)}
                                        </div>
                                        <div className="text-xs text-secondary-500">
                                            by {batch.createdBy.fullName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === batch.batchId ? null : batch.batchId);
                                                }}
                                                className="text-secondary-400 hover:text-secondary-600 p-1 rounded hover:bg-secondary-100"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            {openMenuId === batch.batchId && (
                                                <div className="absolute right-0 top-8 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/admin/documents?batchId=${batch.batchId}`);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                                                    >
                                                        <Folder className="h-4 w-4 mr-3" />
                                                        View Documents
                                                    </button>
                                                    {batch.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSendBatch(batch.batchId);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                                                            >
                                                                <Send className="h-4 w-4 mr-3" />
                                                                Send Batch
                                                            </button>
                                                            <div className="border-t border-secondary-200 my-1"></div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Delete this batch?')) {
                                                                        // TODO: Implement delete batch
                                                                    }
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-3" />
                                                                Delete Batch
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {batches.length === 0 && (
                    <div className="text-center py-12">
                        <Folder className="mx-auto h-12 w-12 text-secondary-400" />
                        <h3 className="mt-2 text-sm font-medium text-secondary-900">No batches found</h3>
                        <p className="mt-1 text-sm text-secondary-500">
                            Create some documents to see batches here.
                        </p>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-secondary-600">
                        Page {currentPage} of {totalPages} ({totalBatches} total batches)
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
}

// Skeleton loader component
function DocumentBatchesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-8 bg-secondary-200 rounded w-48 animate-pulse" />
                    <div className="h-4 bg-secondary-200 rounded w-64 mt-2 animate-pulse" />
                </div>
            </div>

            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i}>
                            <div className="h-4 bg-secondary-200 rounded w-20 mb-2 animate-pulse" />
                            <div className="h-10 bg-secondary-200 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                {[...Array(6)].map((_, i) => (
                                    <th key={i} className="px-6 py-3 text-left">
                                        <div className="h-4 bg-secondary-200 rounded w-20 animate-pulse" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {[...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    {[...Array(6)].map((_, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-4 bg-secondary-200 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}