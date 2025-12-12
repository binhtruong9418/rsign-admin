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
    Download,
    Calendar,
    User,
    AlertCircle,
    CheckCheck,
    Timer,
    ExternalLink,
    Hash,
    MapPin
} from 'lucide-react';
import { formatDate, getStatusLabel, cn } from '@/lib/utils';
import { documentsAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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

    const statusLabel = getStatusLabel(document.status);

    // Calculate progress from signing steps
    const totalSigners = document.signingSteps?.reduce((sum, step) => sum + (step.signers?.length || 0), 0) || 0;
    const completedSigners = document.signingSteps?.reduce((sum, step) =>
        sum + (step.signers?.filter(signer => signer.status === 'SIGNED').length || 0), 0) || 0;
    const progressPercentage = totalSigners > 0 ? Math.round((completedSigners / totalSigners) * 100) : 0;

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
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-secondary-900">{document.title}</h1>
                            <Badge
                                variant={document.status === 'COMPLETED' ? 'success' :
                                    document.status === 'IN_PROGRESS' ? 'warning' :
                                        document.status === 'CANCELLED' ? 'danger' : 'default'}
                            >
                                {statusLabel}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-secondary-600 mt-1">
                            <span>Created {formatDate(document.createdAt)}</span>
                            {document.createdBy && (
                                <span>by {document.createdBy.fullName}</span>
                            )}
                            {document.deadline && (
                                <span className="flex items-center">
                                    <Timer className="h-4 w-4 mr-1" />
                                    Due {formatDate(document.deadline)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {document.status === 'DRAFT' && (
                        <Button onClick={handleSendDocument}>
                            <Send className="h-4 w-4 mr-2" />
                            Send for Signing
                        </Button>
                    )}
                    {document.originalFileUrl && (
                        <Button variant="outline" onClick={() => window.open(document.originalFileUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Original
                        </Button>
                    )}
                    {document.signedFileUrl && (
                        <Button variant="outline" onClick={() => window.open(document.signedFileUrl!, '_blank')}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Signed
                        </Button>
                    )}
                </div>
            </div>

            {/* Document Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Signing Progress */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                            <CheckCheck className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-secondary-600">Progress</span>
                        </div>
                        <span className="text-xs text-secondary-500">{progressPercentage}%</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-secondary-900">
                            {completedSigners} of {totalSigners} Signed
                        </p>
                        <div className="w-full bg-secondary-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Signing Mode & Flow */}
                <div className="card p-6">
                    <div className="flex items-center mb-3">
                        {document.signingMode === 'SHARED' ? (
                            <Users className="h-5 w-5 text-primary-600 mr-2" />
                        ) : (
                            <User className="h-5 w-5 text-primary-600 mr-2" />
                        )}
                        <span className="text-sm font-medium text-secondary-600">Signing</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary-900">{document.signingMode}</p>
                    <p className="text-sm text-secondary-600 mt-1">
                        {document.signingFlow} Flow
                    </p>
                </div>

                {/* Current Step */}
                <div className="card p-6">
                    <div className="flex items-center mb-3">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-secondary-600">Current Step</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary-900">
                        {document.currentStep} of {document.totalSteps}
                    </p>
                    {document.signingFlow === 'SEQUENTIAL' && (
                        <p className="text-xs text-secondary-500 mt-1">Sequential signing</p>
                    )}
                </div>

                {/* Document Info */}
                <div className="card p-6">
                    <div className="flex items-center mb-3">
                        <Hash className="h-5 w-5 text-secondary-600 mr-2" />
                        <span className="text-sm font-medium text-secondary-600">Document ID</span>
                    </div>
                    <p className="text-sm font-mono text-secondary-900 break-all">
                        {document.id.split('-')[0]}...
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                        {document.isTemplate ? `Template: ${document.templateName}` : 'Regular Document'}
                    </p>
                </div>
            </div>

            {/* Signing Workflow */}
            {document.signingSteps && document.signingSteps.length > 0 && (
                <div className="card">
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Signing Workflow
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-6">
                            {document.signingSteps.map((step, index) => (
                                <div key={step.id} className="relative">
                                    {/* Step connector line */}
                                    {index < document.signingSteps!.length - 1 && (
                                        <div className="absolute left-4 top-8 w-px h-16 bg-secondary-200"></div>
                                    )}

                                    <div className="flex items-start space-x-4">
                                        {/* Step indicator */}
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10",
                                            step.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                step.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-secondary-100 text-secondary-600'
                                        )}>
                                            {step.status === 'COMPLETED' ? (
                                                <CheckCheck className="h-4 w-4" />
                                            ) : (
                                                step.stepOrder
                                            )}
                                        </div>

                                        {/* Step content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-medium text-secondary-900">
                                                    Step {step.stepOrder}
                                                    {document.currentStep === step.stepOrder && (
                                                        <Badge variant="info" className="ml-2">Current</Badge>
                                                    )}
                                                </h4>
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={
                                                        step.status === 'COMPLETED' ? 'success' :
                                                            step.status === 'IN_PROGRESS' ? 'warning' : 'default'
                                                    }>
                                                        {step.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Signers in this step */}
                                            <div className="space-y-2">
                                                {step.signers?.map((signer) => (
                                                    <div key={signer.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                                                <span className="text-xs font-medium text-white">
                                                                    {signer.user.fullName?.charAt(0) || signer.user.email.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-secondary-900">
                                                                    {signer.user.fullName}
                                                                </p>
                                                                <p className="text-xs text-secondary-600">
                                                                    {signer.user.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            {signer.signedAt && (
                                                                <span className="text-xs text-secondary-500">
                                                                    Signed {formatDate(signer.signedAt, 'relative')}
                                                                </span>
                                                            )}
                                                            <Badge
                                                                variant={
                                                                    signer.status === 'SIGNED' ? 'success' :
                                                                        signer.status === 'PENDING' ? 'warning' :
                                                                            signer.status === 'DECLINED' ? 'danger' : 'default'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {signer.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )) || (
                                                        <p className="text-sm text-secondary-500">No signers assigned</p>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Document Content & Signature Zones */}
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
                            <div className="aspect-[3/4] bg-secondary-100 rounded-lg flex items-center justify-center relative">
                                <div className="text-center">
                                    <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                                    <p className="text-sm text-secondary-600">Document Preview</p>
                                    <p className="text-xs text-secondary-500 mt-1">{document.title}</p>

                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(document.originalFileUrl, '_blank')}
                                    className="absolute top-3 right-3"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
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

                {/* Signature Zones */}
                <div className="card">
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                            <MapPin className="h-5 w-5 mr-2" />
                            Signature Zones ({document.signatureZones?.length || 0})
                        </h3>
                    </div>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        {document.signatureZones && document.signatureZones.length > 0 ? (
                            <div className="space-y-3">
                                {document.signatureZones.map((zone, index) => (
                                    <div key={zone.id} className="border border-secondary-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-secondary-900">
                                                    Zone #{index + 1}
                                                </span>
                                                {zone.label && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {zone.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-secondary-500">
                                                Page {zone.pageNumber}
                                            </span>
                                        </div>

                                        <div className="text-xs text-secondary-600 mb-3">
                                            Position: ({Math.round(zone.x)}, {Math.round(zone.y)})
                                            Size: {Math.round(zone.width)}×{Math.round(zone.height)}
                                        </div>

                                        {zone.assignedTo ? (
                                            <div className="flex items-center justify-between p-2 bg-secondary-50 rounded">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium text-white">
                                                            {zone.assignedTo.user.fullName?.charAt(0) || zone.assignedTo.user.email.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-secondary-900">
                                                            {zone.assignedTo.user.fullName}
                                                        </p>
                                                        <p className="text-xs text-secondary-500">
                                                            {zone.assignedTo.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={
                                                        zone.assignedTo.status === 'SIGNED' ? 'success' :
                                                            zone.assignedTo.status === 'PENDING' ? 'warning' : 'default'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {zone.assignedTo.status}
                                                </Badge>
                                            </div>
                                        ) : (
                                            <div className="text-center py-2">
                                                <AlertCircle className="h-4 w-4 text-secondary-400 mx-auto mb-1" />
                                                <p className="text-xs text-secondary-500">Unassigned</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MapPin className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                                <p className="text-sm text-secondary-600">No signature zones defined</p>
                                <p className="text-xs text-secondary-500 mt-1">
                                    Signature zones will appear here once the document is configured
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Document Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    {/* Document Files */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-secondary-200">
                            <h3 className="text-lg font-semibold text-secondary-900">Document Files</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium text-secondary-900">Original Document</p>
                                        <p className="text-xs text-secondary-600">Source file for signing</p>
                                    </div>
                                </div>
                                {document.originalFileUrl ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(document.originalFileUrl, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                ) : (
                                    <Badge variant="secondary">Not Available</Badge>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <CheckCheck className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium text-secondary-900">Signed Document</p>
                                        <p className="text-xs text-secondary-600">Document with all signatures</p>
                                    </div>
                                </div>
                                {document.signedFileUrl ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(document.signedFileUrl!, '_blank')}
                                    >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                    </Button>
                                ) : (
                                    <Badge variant="secondary">
                                        {document.status === 'COMPLETED' ? 'Processing' : 'Pending'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-6">
                    {/* Assignment & Batch Info */}
                    {(document.assignedUser || document.batchId) && (
                        <div className="card">
                            <div className="px-6 py-4 border-b border-secondary-200">
                                <h3 className="text-lg font-semibold text-secondary-900">Assignment Details</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {document.assignedUser && (
                                    <div>
                                        <label className="text-sm font-medium text-secondary-600">Assigned To</label>
                                        <div className="mt-2 flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                                            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">
                                                    {document.assignedUser.fullName?.charAt(0) || document.assignedUser.email.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-secondary-900">
                                                    {document.assignedUser.fullName || document.assignedUser.email}
                                                </p>
                                                <p className="text-xs text-secondary-600">
                                                    {document.assignedUser.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {document.batchId && (
                                    <div>
                                        <label className="text-sm font-medium text-secondary-600">Batch ID</label>
                                        <p className="mt-1 text-sm font-mono text-secondary-900 p-2 bg-secondary-50 rounded border">
                                            {document.batchId}
                                        </p>
                                        <p className="text-xs text-secondary-500 mt-1">
                                            This document is part of a batch for individual distribution
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Template & Timeline */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-secondary-200">
                            <h3 className="text-lg font-semibold text-secondary-900">Timeline & Template</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {document.isTemplate && (
                                <div>
                                    <label className="text-sm font-medium text-secondary-600">Template</label>
                                    <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900">
                                            {document.templateName || 'Unnamed Template'}
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            This document is a reusable template
                                        </p>
                                    </div>
                                </div>
                            )}

                            {document.deadline && (
                                <div>
                                    <label className="text-sm font-medium text-secondary-600">Deadline</label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm text-secondary-900">
                                            {formatDate(document.deadline)}
                                        </span>
                                        {new Date(document.deadline) < new Date() && (
                                            <Badge variant="danger">Overdue</Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {document.completedAt && (
                                <div>
                                    <label className="text-sm font-medium text-secondary-600">Completed</label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-secondary-900">
                                            {formatDate(document.completedAt)}
                                        </span>
                                    </div>
                                </div>
                            )}
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