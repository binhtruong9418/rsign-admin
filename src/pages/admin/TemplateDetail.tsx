import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    FileText,
    Users,
    MapPin,
    Edit,
    Trash2,
    Copy,
    PlayCircle,
    Calendar,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/lib/toast';
import { templatesAPI } from '@/lib/api';
import { useState } from 'react';

export default function TemplateDetail() {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { data: template, isLoading, error } = useQuery({
        queryKey: ['template', templateId],
        queryFn: () => templatesAPI.getTemplate(templateId!),
        enabled: !!templateId,
    });

    const deleteMutation = useMutation({
        mutationFn: () => templatesAPI.deleteTemplate(templateId!),
        onSuccess: () => {
            showToast.success('Template deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            navigate('/admin/templates');
        },
        onError: (error: any) => {
            showToast.error(error?.error || 'Failed to delete template');
        },
    });

    const duplicateMutation = useMutation({
        mutationFn: () => {
            if (!template) throw new Error('Template not loaded');
            const tmpl = template.template;
            return templatesAPI.duplicateTemplate(templateId!, `${tmpl.name || tmpl.templateName} (Copy)`);
        },
        onSuccess: (response) => {
            showToast.success('Template duplicated successfully');
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            navigate(`/admin/templates/${response.template.id}`);
        },
        onError: (error: any) => {
            showToast.error(error?.error || 'Failed to duplicate template');
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    const handleDuplicate = () => {
        duplicateMutation.mutate();
    };

    const handleEdit = () => {
        navigate(`/admin/templates/${templateId}/edit`);
    };

    const handleUse = () => {
        navigate(`/admin/templates/${templateId}/use`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
                    <p className="text-secondary-600">Loading template...</p>
                </div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Failed to load template</p>
                    <Button onClick={() => navigate('/admin/templates')}>Back to Templates</Button>
                </div>
            </div>
        );
    }

    const tmpl = template.template;
    const zonesCount = tmpl.signatureZones?.length || 0;
    const zonesPerSigner = tmpl.signers?.reduce((acc: Record<string, number>, signer: any, index: number) => {
        const signerId = `signer-${index}`;
        const count = tmpl.signatureZones?.filter((zone: any) => zone.signerId === signerId).length || 0;
        acc[signer.role] = count;
        return acc;
    }, {} as Record<string, number>) || {};

    return (
        <div className="min-h-screen bg-secondary-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/templates')}
                        className="flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Templates
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-secondary-900">{tmpl.name || tmpl.templateName}</h1>
                            {tmpl.description && (
                                <p className="text-secondary-600 mt-2">{tmpl.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-4">
                                <Badge variant="default">
                                    {tmpl.signingMode === 'INDIVIDUAL' ? 'Individual' : 'Shared'}
                                </Badge>
                                {tmpl.signingMode === 'SHARED' && (
                                    <Badge variant="secondary">
                                        {tmpl.signingFlow === 'PARALLEL' ? 'Parallel Signing' : 'Sequential Signing'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleUse} className="inline-flex items-center">
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Use Template
                            </Button>
                            <Button variant="outline" onClick={handleEdit} className="inline-flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="outline" onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                            </Button>
                            <Button variant="outline" onClick={() => setShowDeleteModal(true)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* PDF Preview */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-secondary-900 mb-4">Document Preview</h3>
                            {tmpl.fileUrl ? (
                                <div className="border border-secondary-200 rounded-lg overflow-hidden">
                                    <iframe
                                        src={tmpl.fileUrl}
                                        className="w-full h-[600px]"
                                        title="Template Preview"
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-secondary-200 rounded-lg">
                                    <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                                    <p className="text-secondary-600">No preview available</p>
                                </div>
                            )}
                        </Card>

                        {/* Signature Zones */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="h-5 w-5 text-secondary-600" />
                                <h3 className="font-semibold text-secondary-900">Signature Zones</h3>
                            </div>
                            {zonesCount > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-secondary-600">{zonesCount} signature zone(s) defined</p>
                                    <div className="space-y-1">
                                        {Object.entries(zonesPerSigner).map(([role, count]) => (
                                            <div key={role} className="text-sm text-secondary-600 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary-600" />
                                                {role as string}: {count as number} zone(s)
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-secondary-600">No signature zones defined</p>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Template Info */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-secondary-900 mb-4">Template Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-secondary-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>Created: {new Date(tmpl.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-secondary-600">
                                    <Clock className="h-4 w-4" />
                                    <span>Updated: {new Date(tmpl.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Signer Roles */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="h-5 w-5 text-secondary-600" />
                                <h3 className="font-semibold text-secondary-900">Signer Roles</h3>
                            </div>

                            {tmpl.signingMode === 'INDIVIDUAL' ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded">
                                        <div className="w-8 h-8 rounded" style={{ backgroundColor: tmpl.signers?.[0]?.color || '#3B82F6' }} />
                                        <div>
                                            <p className="font-medium text-secondary-900">{tmpl.signers?.[0]?.role || 'Signer'}</p>
                                            {tmpl.signers?.[0]?.description && (
                                                <p className="text-sm text-secondary-600">{tmpl.signers[0].description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : tmpl.signingFlow === 'PARALLEL' ? (
                                <div className="space-y-2">
                                    {tmpl.signers?.map((signer: any, index: number) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-secondary-50 rounded">
                                            <div className="w-8 h-8 rounded flex items-center justify-center text-white font-medium"
                                                style={{ backgroundColor: signer.color }}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-secondary-900">{signer.role}</p>
                                                {signer.description && (
                                                    <p className="text-sm text-secondary-600">{signer.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tmpl.signingSteps?.map((step: any, stepIndex: number) => (
                                        <div key={stepIndex} className="border border-secondary-200 rounded-lg p-3">
                                            <div className="font-medium text-secondary-700 mb-2">Step {step.stepNumber}</div>
                                            <div className="space-y-2">
                                                {step.signers?.map((signer: any, signerIndex: number) => (
                                                    <div key={signerIndex} className="flex items-center gap-3 p-2 bg-secondary-50 rounded">
                                                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-medium"
                                                            style={{ backgroundColor: signer.color }}>
                                                            {signerIndex + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-secondary-900">{signer.role}</p>
                                                            {signer.description && (
                                                                <p className="text-xs text-secondary-600">{signer.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Template"
            >
                <div className="space-y-4">
                    <p className="text-secondary-600">
                        Are you sure you want to delete this template? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
