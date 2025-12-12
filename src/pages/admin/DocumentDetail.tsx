import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    FileText,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Send,
    Download
} from 'lucide-react';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { documentsAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function DocumentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: document, isLoading, error } = useQuery({
        queryKey: ['document', id],
        queryFn: () => documentsAPI.getDocument(id!),
        enabled: !!id,
    });

    const handleSendDocument = async () => {
        if (!document?.id) return;
        try {
            await documentsAPI.sendDocument(document.id);
            // Refresh document data
            window.location.reload();
        } catch (error) {
            console.error('Failed to send document:', error);
        }
    };

    if (isLoading) {
        return <DocumentDetailSkeleton />;
    }

    if (error || !document) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load document. Please try again.
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate('/admin/documents')}
                    className="mt-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Documents
                </Button>
            </div>
        );
    }

    const statusColor = getStatusColor(document.status);
    const statusLabel = getStatusLabel(document.status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/documents')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900">{document.title}</h1>
                        <p className="text-sm text-secondary-600">
                            Created {formatDate(document.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {document.status === 'DRAFT' && (
                        <Button onClick={handleSendDocument}>
                            <Send className="h-4 w-4 mr-2" />
                            Send for Signing
                        </Button>
                    )}
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>
            </div>

            {/* Document Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="card p-6">
                    <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${statusColor}`}></div>
                        <div>
                            <p className="text-sm font-medium text-secondary-600">Status</p>
                            <p className="text-lg font-semibold text-secondary-900">{statusLabel}</p>
                        </div>
                    </div>
                </div>

                {/* Signing Mode Card */}
                <div className="card p-6">
                    <div className="flex items-center">
                        {document.signingMode === 'SHARED' ? (
                            <Users className="h-5 w-5 text-primary-600 mr-3" />
                        ) : (
                            <Clock className="h-5 w-5 text-primary-600 mr-3" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-secondary-600">Signing Mode</p>
                            <p className="text-lg font-semibold text-secondary-900">
                                {document.signingMode === 'SHARED' ? 'Parallel' : 'Sequential'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="card p-6">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-secondary-600">Progress</p>
                            <p className="text-lg font-semibold text-secondary-900">
                                {/* This would come from document signers when available */}
                                0 of 0 Signed
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Preview */}
                <div className="card">
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Document Preview
                        </h3>
                    </div>
                    <div className="p-6">
                        {document.originalFileUrl ? (
                            <div className="aspect-[3/4] bg-secondary-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                                    <p className="text-sm text-secondary-600">Document Preview</p>
                                    <p className="text-xs text-secondary-500 mt-1">{document.title}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[3/4] bg-secondary-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <XCircle className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                                    <p className="text-sm text-secondary-600">No document available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Document Details */}
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-secondary-200">
                            <h3 className="text-lg font-semibold text-secondary-900">Document Information</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-secondary-600">Document Name</label>
                                <p className="mt-1 text-sm text-secondary-900">{document.title}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-secondary-600">Template Name</label>
                                <p className="mt-1 text-sm text-secondary-900">
                                    {document.templateName || 'No template name'}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-secondary-600">Created At</label>
                                <p className="mt-1 text-sm text-secondary-900">{formatDate(document.createdAt)}</p>
                            </div>

                            {document.updatedAt && (
                                <div>
                                    <label className="text-sm font-medium text-secondary-600">Last Updated</label>
                                    <p className="mt-1 text-sm text-secondary-900">{formatDate(document.updatedAt)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signing Information */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-secondary-200">
                            <h3 className="text-lg font-semibold text-secondary-900">Signing Details</h3>
                        </div>
                        <div className="p-6">
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                                <p className="text-sm text-secondary-600">Signer information not available</p>
                                <p className="text-xs text-secondary-500 mt-1">
                                    Signer details will be shown once document is sent for signing
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DocumentDetailSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="h-10 bg-secondary-200 rounded w-20"></div>
                    <div>
                        <div className="h-8 bg-secondary-200 rounded w-64"></div>
                        <div className="h-4 bg-secondary-200 rounded w-48 mt-2"></div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="h-10 bg-secondary-200 rounded w-32"></div>
                    <div className="h-10 bg-secondary-200 rounded w-24"></div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card p-6">
                        <div className="flex items-center">
                            <div className="w-5 h-5 bg-secondary-200 rounded-full mr-3"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-secondary-200 rounded w-16 mb-2"></div>
                                <div className="h-6 bg-secondary-200 rounded w-24"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <div className="h-6 bg-secondary-200 rounded w-40"></div>
                    </div>
                    <div className="p-6">
                        <div className="aspect-[3/4] bg-secondary-200 rounded-lg"></div>
                    </div>
                </div>
                <div className="space-y-6">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="card">
                            <div className="px-6 py-4 border-b border-secondary-200">
                                <div className="h-6 bg-secondary-200 rounded w-40"></div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, j) => (
                                        <div key={j}>
                                            <div className="h-4 bg-secondary-200 rounded w-24 mb-2"></div>
                                            <div className="h-4 bg-secondary-200 rounded w-full"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}