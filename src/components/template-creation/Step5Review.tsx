import { useState } from 'react';
import { ArrowLeft, Check, FileText, Users, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PDFViewerComplete, type Zone } from '@/components/pdf';
import { showToast } from '@/lib/toast';
import { templatesAPI } from '@/lib/api';
import { buildCreateTemplateRequest, buildUpdateTemplateRequest } from '@/types/template';
import type { TemplateData } from '@/types/template';
import { useNavigate } from 'react-router-dom';

interface Step5ReviewProps {
    templateData: TemplateData;
    onPrevious: () => void;
    isEditMode?: boolean;
    templateId?: string;
}

export function Step5Review({ templateData, onPrevious, isEditMode = false, templateId }: Step5ReviewProps) {
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    const handleCreate = async () => {
        try {
            setIsCreating(true);

            if (isEditMode && templateId) {
                // Update existing template
                const request = buildUpdateTemplateRequest(templateData);

                const updatePromise = templatesAPI.updateTemplate(templateId, request);

                showToast.promise(
                    updatePromise,
                    {
                        loading: 'Updating template...',
                        success: 'Template updated successfully!',
                        error: (err) => err?.error || 'Failed to update template'
                    }
                );

                await updatePromise;
                navigate(`/admin/templates/${templateId}`);
            } else {
                // Create new template
                const request = buildCreateTemplateRequest(templateData);

                const createPromise = templatesAPI.createTemplate(request);

                showToast.promise(
                    createPromise,
                    {
                        loading: 'Creating template...',
                        success: 'Template created successfully!',
                        error: (err) => err?.error || 'Failed to create template'
                    }
                );

                const response = await createPromise;
                navigate('/admin/templates');
            }
        } catch (error: any) {
            console.error('Failed to save template:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const zonesCount = templateData.signatureZones.length;
    const zonesPerSigner = templateData.signers.reduce((acc, signer, index) => {
        const signerId = `signer-${index}`;
        const count = templateData.signatureZones.filter(zone => zone.signerId === signerId).length;
        acc[signer.role] = count;
        return acc;
    }, {} as Record<string, number>);

    // Transform zones to Zone format
    const transformedZones: Zone[] = templateData.signatureZones.map((zone, index) => {
        const signerIndex = parseInt(zone.signerId?.replace('signer-', '') || '0');
        const signer = templateData.signers[signerIndex];

        return {
            id: zone.id || `zone-${index}`,
            page: zone.page,
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
            label: zone.label || signer?.role || 'Signature',
            color: signer?.color || '#3B82F6',
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Review Template</h2>
                <p className="text-secondary-600">Review all details before creating the template.</p>
            </div>

            {/* Template Info */}
            <Card className="p-6">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900 mb-1">{templateData.name}</h3>
                        {templateData.description && (
                            <p className="text-sm text-secondary-600 mb-2">{templateData.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="default">
                                {templateData.signingMode === 'INDIVIDUAL' ? 'Individual' : 'Shared'}
                            </Badge>
                            {templateData.signingMode === 'SHARED' && (
                                <Badge variant="secondary">
                                    {templateData.signingFlow === 'PARALLEL' ? 'Parallel Signing' : 'Sequential Signing'}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* PDF Preview with Zones */}
            {templateData.fileUrl && (
                <Card className="p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Document Preview</h3>
                    <PDFViewerComplete
                        fileUrl={templateData.fileUrl}
                        zones={transformedZones}
                        showZonesDefault={true}
                        maxHeight="700px"
                    />
                </Card>
            )}

            {/* Signer Roles */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-secondary-600" />
                    <h3 className="font-semibold text-secondary-900">Signer Roles</h3>
                </div>

                {templateData.signingMode === 'INDIVIDUAL' ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded">
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: templateData.signers[0]?.color || '#3B82F6' }} />
                            <div>
                                <p className="font-medium text-secondary-900">{templateData.signers[0]?.role || 'Signer'}</p>
                                {templateData.signers[0]?.description && (
                                    <p className="text-sm text-secondary-600">{templateData.signers[0].description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : templateData.signingFlow === 'PARALLEL' ? (
                    <div className="space-y-2">
                        {templateData.signers.map((signer, index) => (
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
                        {templateData.signingSteps.map((step, stepIndex) => (
                            <div key={stepIndex} className="border border-secondary-200 rounded-lg p-3">
                                <div className="font-medium text-secondary-700 mb-2">Step {step.stepNumber}</div>
                                <div className="space-y-2">
                                    {step.signers.map((signer, signerIndex) => (
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

            {/* Signature Zones */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-secondary-600" />
                    <h3 className="font-semibold text-secondary-900">Signature Zones</h3>
                </div>

                {zonesCount > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>{zonesCount} signature zone(s) defined</span>
                        </div>
                        <div className="pl-6 space-y-1">
                            {Object.entries(zonesPerSigner).map(([role, count]) => (
                                <div key={role} className="text-sm text-secondary-600">
                                    • {role}: {count} zone(s)
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span>No signature zones defined. Recipients won't have predefined signing areas.</span>
                    </div>
                )}
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={isCreating}
                    className="inline-flex items-center"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <Button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="inline-flex items-center"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditMode ? 'Updating Template...' : 'Creating Template...'}
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            {isEditMode ? 'Update Template' : 'Create Template'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
