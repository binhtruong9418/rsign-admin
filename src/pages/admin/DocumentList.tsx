import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Filter,
    Search,
    Plus,
    MoreVertical,
    Users,
    User,
    FileText,
    Clock,
    RotateCcw,
    CheckSquare,
    Calendar,
    ChevronDown,
    ChevronUp,
    Send,
    Trash2,
    Download,
} from 'lucide-react';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { documentsAPI, usersAPI } from '@/lib/api';
import type { EnhancedDocumentFilters } from '@/types';
import { Input, Select, Pagination, PaginationInfo, Button, Card } from '@/components/ui';
import { showToast } from '@/lib/toast';

export default function DocumentList() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Send document mutation
    const sendDocumentMutation = useMutation({
        mutationFn: (documentId: string) => documentsAPI.sendDocument(documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            showToast.success('Document sent for signing successfully');
        },
        onError: (error: any) => {
            showToast.error(error?.message || 'Failed to send document');
        },
    });

    // Delete document mutation
    const deleteDocumentMutation = useMutation({
        mutationFn: (documentId: string) => documentsAPI.deleteDocument(documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            showToast.success('Document deleted successfully');
        },
        onError: (error: any) => {
            showToast.error(error?.message || 'Failed to delete document');
        },
    });

    // Separate applied filters from draft filters
    const [appliedFilters, setAppliedFilters] = useState<EnhancedDocumentFilters>({
        status: searchParams.get('status') as any || undefined,
        signingMode: searchParams.get('signingMode') as any || undefined,
        search: searchParams.get('search') || '',
        batchId: searchParams.get('batchId') || undefined,
    });

    const [draftFilters, setDraftFilters] = useState<EnhancedDocumentFilters>({ ...appliedFilters });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(
        parseInt(searchParams.get('page') || '1')
    );
    const [pageSize] = useState(10);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Fetch users for creator filter
    const { data: usersData } = useQuery({
        queryKey: ['users-list'],
        queryFn: () => usersAPI.getUsers({ limit: 100 }),
    });

    // Fetch documents using applied filters only
    const { data: documentsResponse, isLoading, error } = useQuery({
        queryKey: ['documents', currentPage, pageSize, appliedFilters],
        queryFn: () => documentsAPI.getDocuments({
            page: currentPage - 1, // Convert to 0-based for API
            limit: pageSize,
            ...appliedFilters,
        }),
    });

    const documents = documentsResponse?.items || [];
    const totalPages = documentsResponse?.totalPages || 0;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    // Handle filter input changes (doesn't apply immediately)
    const handleFilterChange = (newFilters: Partial<EnhancedDocumentFilters>) => {
        setDraftFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Apply filters and reset to first page
    const applyFilters = () => {
        setAppliedFilters({ ...draftFilters });
        setCurrentPage(1);
    };

    // Reset all filters
    const resetFilters = () => {
        const emptyFilters: EnhancedDocumentFilters = {
            search: '',
            status: undefined,
            signingMode: undefined,
            signingFlow: undefined,
            batchId: undefined,
            createdById: undefined,
            assignedUserId: undefined,
            dateFrom: undefined,
            dateTo: undefined,
            hasDeadline: undefined,
            isTemplate: undefined,
        };
        setDraftFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Check if filters have changes
    const hasFilterChanges = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

    // Count active filters
    const activeFiltersCount = Object.values(appliedFilters).filter(value =>
        value !== undefined && value !== '' && value !== null
    ).length;

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
            <Card className="p-6">
                <div className="space-y-4">
                    {/* Basic Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Input
                                placeholder="Search documents..."
                                value={draftFilters.search || ''}
                                onChange={(e) => handleFilterChange({ search: e.target.value })}
                                className="pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none" />
                        </div>

                        {/* Status Filter */}
                        <Select
                            placeholder="All Statuses"
                            value={draftFilters.status || ''}
                            onChange={(e) => handleFilterChange({ status: e.target.value as any || undefined })}
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'DRAFT', label: 'Draft' },
                                { value: 'PENDING', label: 'Pending' },
                                { value: 'IN_PROGRESS', label: 'In Progress' },
                                { value: 'COMPLETED', label: 'Completed' },
                                { value: 'REJECTED', label: 'Rejected' },
                                { value: 'EXPIRED', label: 'Expired' },
                                { value: 'CANCELLED', label: 'Cancelled' },
                            ]}
                        />

                        {/* Signing Mode Filter */}
                        <Select
                            placeholder="All Modes"
                            value={draftFilters.signingMode || ''}
                            onChange={(e) => handleFilterChange({ signingMode: e.target.value as any || undefined })}
                            options={[
                                { value: '', label: 'All Modes' },
                                { value: 'INDIVIDUAL', label: 'Individual' },
                                { value: 'SHARED', label: 'Shared' },
                                { value: 'MULTI', label: 'Multi-Signature' },
                            ]}
                        />

                        {/* Advanced Filters Toggle */}
                        <Button
                            variant="outline"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="inline-flex items-center justify-center"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Advanced
                            {showAdvancedFilters ? (
                                <ChevronUp className="h-4 w-4 ml-2" />
                            ) : (
                                <ChevronDown className="h-4 w-4 ml-2" />
                            )}
                        </Button>

                        {/* Filter Actions */}
                        <div className="flex gap-2">
                            <Button
                                onClick={applyFilters}
                                disabled={!hasFilterChanges}
                                className="inline-flex items-center"
                            >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Apply
                                {activeFiltersCount > 0 && (
                                    <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                disabled={activeFiltersCount === 0}
                                className="inline-flex items-center"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </Button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="border-t border-secondary-200 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {/* Signing Flow */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Signing Flow
                                    </label>
                                    <Select
                                        value={draftFilters.signingFlow || ''}
                                        onChange={(e) => handleFilterChange({ signingFlow: e.target.value as any || undefined })}
                                        options={[
                                            { value: '', label: 'All Flows' },
                                            { value: 'PARALLEL', label: 'Parallel' },
                                            { value: 'SEQUENTIAL', label: 'Sequential' },
                                        ]}
                                    />
                                </div>

                                {/* Creator */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Created By
                                    </label>
                                    <Select
                                        value={draftFilters.createdById || ''}
                                        onChange={(e) => handleFilterChange({ createdById: e.target.value || undefined })}
                                        options={[
                                            { value: '', label: 'All Creators' },
                                            ...(usersData?.items || []).map(user => ({
                                                value: user.id,
                                                label: user.fullName || user.email
                                            }))
                                        ]}
                                    />
                                </div>

                                {/* Batch ID */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Batch ID
                                    </label>
                                    <Input
                                        placeholder="Enter batch ID..."
                                        value={draftFilters.batchId || ''}
                                        onChange={(e) => handleFilterChange({ batchId: e.target.value || undefined })}
                                    />
                                </div>

                                {/* Has Deadline */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Deadline Status
                                    </label>
                                    <Select
                                        value={draftFilters.hasDeadline === undefined ? '' : draftFilters.hasDeadline.toString()}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handleFilterChange({
                                                hasDeadline: value === '' ? undefined : value === 'true'
                                            });
                                        }}
                                        options={[
                                            { value: '', label: 'All Documents' },
                                            { value: 'true', label: 'With Deadline' },
                                            { value: 'false', label: 'No Deadline' },
                                        ]}
                                    />
                                </div>

                                {/* Date From */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Created From
                                    </label>
                                    <Input
                                        type="date"
                                        value={draftFilters.dateFrom || ''}
                                        onChange={(e) => handleFilterChange({ dateFrom: e.target.value || undefined })}
                                    />
                                </div>

                                {/* Date To */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Created To
                                    </label>
                                    <Input
                                        type="date"
                                        value={draftFilters.dateTo || ''}
                                        onChange={(e) => handleFilterChange({ dateTo: e.target.value || undefined })}
                                    />
                                </div>

                                {/* Is Template */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Document Type
                                    </label>
                                    <Select
                                        value={draftFilters.isTemplate === undefined ? '' : draftFilters.isTemplate.toString()}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handleFilterChange({
                                                isTemplate: value === '' ? undefined : value === 'true'
                                            });
                                        }}
                                        options={[
                                            { value: '', label: 'All Types' },
                                            { value: 'true', label: 'Templates Only' },
                                            { value: 'false', label: 'Regular Documents' },
                                        ]}
                                    />
                                </div>

                                {/* Assigned User */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Assigned To
                                    </label>
                                    <Select
                                        value={draftFilters.assignedUserId || ''}
                                        onChange={(e) => handleFilterChange({ assignedUserId: e.target.value || undefined })}
                                        options={[
                                            { value: '', label: 'All Assignees' },
                                            ...(usersData?.items || []).map(user => ({
                                                value: user.id,
                                                label: user.fullName || user.email
                                            }))
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Documents Table */}
            <Card className="overflow-hidden">
                {/* Results Summary */}
                <div className="px-6 py-4 bg-secondary-50 border-b border-secondary-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-secondary-600">
                            Showing {documents.length} of {documentsResponse?.total || 0} documents
                            {activeFiltersCount > 0 && (
                                <span className="ml-2 text-primary-600">
                                    ({activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied)
                                </span>
                            )}
                        </div>
                    </div>
                </div>

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
                                    Mode/Flow
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
                            {documents.map((document) => (
                                <tr
                                    key={document.id}
                                    className="hover:bg-secondary-50 cursor-pointer"
                                    onClick={() => navigate(`/admin/documents/${document.id}`)}
                                >
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
                                                    {document.isTemplate && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                            Template
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-secondary-500">
                                                    {document.createdBy && (
                                                        <>Created by {document.createdBy.fullName || document.createdBy.email}</>
                                                    )}
                                                    {document.batchId && (
                                                        <span className={cn("text-xs text-blue-600", document.createdBy && "ml-2")}>
                                                            Batch: {document.batchId.slice(0, 8)}...
                                                        </span>
                                                    )}
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
                                        {document.deadline && (
                                            <div className="text-xs text-secondary-500 mt-1 flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                Due: {formatDate(document.deadline)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {document.signingMode === 'SHARED' || document.signingMode === 'MULTI' ? (
                                                <Users className="h-4 w-4 text-secondary-400 mr-2" />
                                            ) : (
                                                <User className="h-4 w-4 text-secondary-400 mr-2" />
                                            )}
                                            <div>
                                                <div className="text-sm text-secondary-900">
                                                    {document.signingMode === 'MULTI' ? 'Multi' : document.signingMode}
                                                </div>
                                                <div className="text-xs text-secondary-500">
                                                    {document.signingFlow}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <div className="text-sm text-secondary-900">
                                                {document.completedSigners || 0}/{document.totalSigners || 0} Signed
                                            </div>
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${document.totalSigners ? ((document.completedSigners || 0) / document.totalSigners) * 100 : 0}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-secondary-500">
                                                Step {document.currentStep || 1}/{document.totalSteps || 1}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                        <div>{formatDate(document.createdAt)}</div>
                                        {document.assignedUser && (
                                            <div className="text-xs text-secondary-400 mt-1">
                                                Assigned to: {document.assignedUser.fullName || document.assignedUser.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end space-x-3 relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === document.id ? null : document.id);
                                                }}
                                                className="text-secondary-400 hover:text-secondary-600 p-1 rounded hover:bg-secondary-100"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            {openMenuId === document.id && (
                                                <div className="absolute right-0 top-8 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10">
                                                    {document.status === 'DRAFT' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Are you sure you want to send this document for signing?')) {
                                                                    sendDocumentMutation.mutate(document.id);
                                                                }
                                                                setOpenMenuId(null);
                                                            }}
                                                            disabled={sendDocumentMutation.isPending}
                                                            className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center disabled:opacity-50"
                                                        >
                                                            <Send className="h-4 w-4 mr-3" />
                                                            {sendDocumentMutation.isPending ? 'Sending...' : 'Send Document'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(document.originalFileUrl || '#', '_blank');
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                                                    >
                                                        <Download className="h-4 w-4 mr-3" />
                                                        Download Document
                                                    </button>
                                                    {document.status === 'COMPLETED' && document.signedFileUrl && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(document.signedFileUrl || '#', '_blank');
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center"
                                                        >
                                                            <Download className="h-4 w-4 mr-3" />
                                                            Download Signed
                                                        </button>
                                                    )}
                                                    {document.status === 'DRAFT' && (
                                                        <>
                                                            <div className="border-t border-secondary-200 my-1"></div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                                                                        deleteDocumentMutation.mutate(document.id);
                                                                    }
                                                                    setOpenMenuId(null);
                                                                }}
                                                                disabled={deleteDocumentMutation.isPending}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-3" />
                                                                {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete Document'}
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

                {/* No Results */}
                {documents.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-secondary-400" />
                        <h3 className="mt-2 text-sm font-medium text-secondary-900">No documents found</h3>
                        <p className="mt-1 text-sm text-secondary-500">
                            {activeFiltersCount > 0
                                ? "Try adjusting your filters or search terms."
                                : "Create your first document to get started."
                            }
                        </p>
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="mt-4"
                            >
                                Clear all filters
                            </Button>
                        )}
                    </div>
                )}

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
            </Card>
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