import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { templatesAPI, usersAPI, signerGroupsAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { showToast } from '@/lib/toast';
import {
    TemplateUseStep1,
    TemplateUseStep2Individual,
    TemplateUseStep2Shared,
    TemplateUseStep3Review
} from '@/components/template-use';

interface TemplateUseData {
    title: string;
    deadline: string;
    // INDIVIDUAL mode
    selectedUserIds: string[];
    selectedGroupId?: string;
    // SHARED mode
    roleAssignments: Record<string, string>;
}

export default function TemplateUse() {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<TemplateUseData>({
        title: '',
        deadline: '',
        selectedUserIds: [],
        selectedGroupId: undefined,
        roleAssignments: {}
    });

    const [enhancedTemplate, setEnhancedTemplate] = useState<any>(null);

    // Fetch template details
    const { data: templateResponse, isLoading: templateLoading } = useQuery({
        queryKey: ['template', templateId],
        queryFn: () => templatesAPI.getTemplate(templateId!),
        enabled: !!templateId,
    });

    // Recover signers/steps logic when template loads
    const template = templateResponse?.template;

    // Effect to enhance template data
    useEffect(() => {
        if (template && !enhancedTemplate) {
            // Clone template to avoid mutating cache directly if needed, or just extend it
            const originalTmpl = template;

            // 1. Recover Signers & Zones
            let restoredSigners: any[] = originalTmpl.signers || [];
            // Map raw zones to ensure they have signerId properties if missing
            let restoredZones = (originalTmpl.signatureZones || []).map((z: any, idx: number) => ({
                ...z,
                id: z.id || `zone-${idx}`,
                label: z.label,
                // signerId might be missing from API
            }));

            // Logic to verify/reconstruct signers from zones if missing
            if (originalTmpl.signingMode === 'SHARED') {
                if (restoredSigners.length === 0) {
                    const labelMap = new Map<string, number>();
                    let signerCount = 0;

                    restoredZones.forEach((z: any) => {
                        if (z.label && !labelMap.has(z.label)) {
                            labelMap.set(z.label, signerCount++);
                        }
                    });

                    if (signerCount > 0) {
                        restoredSigners = Array.from(labelMap.entries()).map(([label, index]) => ({
                            role: label,
                            description: '',
                            order: index + 1,
                            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
                        }));

                        // Map zones to these new signers
                        restoredZones = restoredZones.map((z: any) => {
                            if (z.label && labelMap.has(z.label)) {
                                return { ...z, signerId: `signer-${labelMap.get(z.label)}` };
                            }
                            return { ...z, signerId: 'signer-0' }; // fallback
                        });
                    } else {
                        restoredSigners = [{ role: 'Signer 1', description: '', order: 1, color: '#3B82F6' }];
                        restoredZones = restoredZones.map((z: any) => ({ ...z, signerId: 'signer-0' }));
                    }
                } else {
                    // Even if signers exist, ensure zones mapped
                    restoredZones = restoredZones.map((z: any) => {
                        const signerIndex = restoredSigners.findIndex((s: any) => s.role === z.label);
                        if (signerIndex >= 0) {
                            return { ...z, signerId: `signer-${signerIndex}` };
                        }
                        return z;
                    });
                }
            } else {
                // INDIVIDUAL
                if (restoredSigners.length === 0) {
                    restoredSigners = [{ role: 'Signer', description: '', order: 1, color: '#3B82F6' }];
                }
                restoredZones = restoredZones.map((z: any) => ({ ...z, signerId: 'signer-0' }));
            }

            // 2. Recover Signing Steps
            let restoredSteps = originalTmpl.signingSteps || [];
            if (originalTmpl.signingFlow === 'SEQUENTIAL' && restoredSteps.length > 0) {
                const firstStep = restoredSteps[0] as any;
                // If steps have zoneIndices but missing detail signers array
                if (firstStep.zoneIndices && (!firstStep.signers || firstStep.signers.length === 0)) {
                    restoredSteps = restoredSteps.map((step: any) => {
                        const stepSigners: any[] = [];
                        const indices = step.zoneIndices || [];

                        const usedSignerIndexes = new Set<number>();
                        indices.forEach((zoneIdx: number) => {
                            // Find which signer owns this zone
                            const zone = restoredZones[zoneIdx]; // Assuming index matches
                            if (zone && zone.signerId) {
                                const sIdx = parseInt(zone.signerId.replace('signer-', ''));
                                if (!isNaN(sIdx)) usedSignerIndexes.add(sIdx);
                            }
                        });

                        usedSignerIndexes.forEach(idx => {
                            if (restoredSigners[idx]) {
                                stepSigners.push({
                                    ...restoredSigners[idx],
                                    // We might need to know which zones they sign in this step?
                                    // For display mostly.
                                });
                            }
                        });

                        return {
                            ...step,
                            signers: stepSigners
                        };
                    });
                }
            } else if (originalTmpl.signingFlow === 'PARALLEL' || originalTmpl.signingMode === 'INDIVIDUAL') {
                // Parallel/Individual usually has 1 step with all signers
                if (!restoredSteps[0]?.signers || restoredSteps[0]?.signers.length === 0) {
                    restoredSteps = [{ stepOrder: 1, signers: restoredSigners }];
                }
            }

            setEnhancedTemplate({
                ...originalTmpl,
                signers: restoredSigners,
                signingSteps: restoredSteps,
                signatureZones: restoredZones
            });
        }
    }, [template, enhancedTemplate]); // Depend on template and enhancedTemplate

    // Fetch users for assignment
    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersAPI.getUsers({ limit: 1000 }),
    });

    // Fetch signer groups
    const { data: groupsData } = useQuery({
        queryKey: ['signer-groups'],
        queryFn: () => signerGroupsAPI.getSignerGroups({ limit: 1000 }),
    });

    const users = usersData?.items || [];
    const groups = groupsData?.items || [];

    // Use enhancedTemplate instead of raw template for rendering
    const displayTemplate = enhancedTemplate || template;

    const updateData = (updates: Partial<TemplateUseData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (sendImmediately: boolean) => {
        if (!displayTemplate) {
            showToast.error('Template not loaded');
            return;
        }

        try {
            const isIndividualMode = displayTemplate.signingMode === 'INDIVIDUAL';

            // Build request based on mode
            const request: any = {
                templateId: templateId!,
                title: data.title || displayTemplate.name || displayTemplate.templateName,
                deadline: data.deadline || undefined,
                sendImmediately
            };

            if (isIndividualMode) {
                // INDIVIDUAL mode - Simple API
                request.recipients = {};

                if (data.selectedGroupId) {
                    request.recipients.signerGroupId = data.selectedGroupId;
                } else {
                    request.recipients.userIds = data.selectedUserIds;
                }
            } else {
                // SHARED mode - Detailed API
                // Map assigned users to specific zone indices based on steps
                request.signingSteps = (displayTemplate.signingSteps || []).map((step: any) => {
                    // Collect all individual assignments for this step
                    const stepAssignments: { userId: string; zoneIndex: number }[] = [];

                    // Access zoneIndices from the step (preserved from original or reconstructed)
                    // If enhancedTemplate replaced steps but kept original properties using ...step
                    const indices = step.zoneIndices || [];

                    indices.forEach((zoneIdx: number) => {
                        const zone = displayTemplate.signatureZones[zoneIdx];
                        if (!zone) return;

                        // Identify the role for this zone determine who signs it
                        // 1. Try label (primary source of truth for Role)
                        let roleName = zone.label;

                        // 2. Try identifying via signerId mapping in enhanced template
                        if (!roleName && zone.signerId) {
                            const sIdx = parseInt(zone.signerId.replace('signer-', ''));
                            roleName = displayTemplate.signers?.[sIdx]?.role;
                        }

                        // 3. Last resort fallback
                        if (!roleName && displayTemplate.signers?.length > 0) {
                            roleName = displayTemplate.signers[0].role;
                        }

                        // Get the assigned UserID for this Role
                        if (roleName && data.roleAssignments[roleName]) {
                            stepAssignments.push({
                                userId: data.roleAssignments[roleName],
                                zoneIndex: zoneIdx
                            });
                        }
                    });

                    return {
                        stepOrder: step.stepOrder || step.stepNumber,
                        signers: stepAssignments
                    };
                });
            }

            const createPromise = templatesAPI.createDocumentFromTemplate(request);

            showToast.promise(
                createPromise,
                {
                    loading: `Creating ${isIndividualMode ? 'documents' : 'document'}...`,
                    success: `${isIndividualMode ? 'Documents' : 'Document'} created successfully!`,
                    error: (err) => err?.error || 'Failed to create document'
                }
            );

            const result = await createPromise;

            // Navigate based on response structure
            if (result.batchId) {
                // INDIVIDUAL mode → Navigate to batch list
                navigate('/admin/document-batches');
            } else if (result.document?.id) {
                // SHARED mode → Navigate to document detail
                navigate(`/admin/documents/${result.document.id}`);
            } else {
                // Fallback
                navigate('/admin/documents');
            }
        } catch (error: any) {
            console.error('Failed to create document:', error);
            // Toast already shown by promise
        }
    };

    if (templateLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-secondary-600">Loading template...</p>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Template not found</p>
                <Button
                    variant="outline"
                    onClick={() => navigate('/admin/templates')}
                    className="mt-4"
                >
                    Back to Templates
                </Button>
            </div>
        );
    }

    const isIndividualMode = template.signingMode === 'INDIVIDUAL';
    const totalSteps = 3;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/templates')}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Templates
                </Button>

                <h1 className="text-2xl font-bold text-secondary-900">
                    Use Template: {template.name}
                </h1>
                <p className="text-secondary-600 mt-1">
                    Create {isIndividualMode ? 'documents' : 'a document'} from this template
                </p>
            </div>

            {/* Progress Indicator */}
            <Card className="p-6 mb-6">
                <div className="flex items-center justify-between">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center flex-1">
                            <div className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step < currentStep
                                        ? 'bg-green-100 text-green-700'
                                        : step === currentStep
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-secondary-200 text-secondary-500'
                                        }`}
                                >
                                    {step < currentStep ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        step
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p
                                        className={`text-sm font-medium ${step <= currentStep
                                            ? 'text-secondary-900'
                                            : 'text-secondary-500'
                                            }`}
                                    >
                                        {step === 1 && 'Overview'}
                                        {step === 2 && (isIndividualMode ? 'Recipients' : 'Signers')}
                                        {step === 3 && 'Review'}
                                    </p>
                                </div>
                            </div>
                            {step < totalSteps && (
                                <div
                                    className={`flex-1 h-1 mx-4 rounded ${step < currentStep
                                        ? 'bg-green-500'
                                        : 'bg-secondary-200'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Step Content */}
            <Card className="p-6">
                {currentStep === 1 && (
                    <TemplateUseStep1
                        template={template}
                        title={data.title}
                        deadline={data.deadline}
                        onTitleChange={(title) => updateData({ title })}
                        onDeadlineChange={(deadline) => updateData({ deadline })}
                        onNext={() => setCurrentStep(2)}
                    />
                )}

                {currentStep === 2 && isIndividualMode && (
                    <TemplateUseStep2Individual
                        users={users}
                        groups={groups}
                        selectedUserIds={data.selectedUserIds}
                        selectedGroupId={data.selectedGroupId}
                        onUserSelectionChange={(userIds) => updateData({ selectedUserIds: userIds })}
                        onGroupSelectionChange={(groupId) => updateData({ selectedGroupId: groupId })}
                        onNext={() => setCurrentStep(3)}
                        onPrevious={() => setCurrentStep(1)}
                    />
                )}

                {currentStep === 2 && !isIndividualMode && (
                    <TemplateUseStep2Shared
                        template={template}
                        users={users}
                        roleAssignments={data.roleAssignments}
                        onRoleAssignmentChange={(role, userId) => {
                            updateData({
                                roleAssignments: {
                                    ...data.roleAssignments,
                                    [role]: userId
                                }
                            });
                        }}
                        onNext={() => setCurrentStep(3)}
                        onPrevious={() => setCurrentStep(1)}
                    />
                )}

                {currentStep === 3 && (
                    <TemplateUseStep3Review
                        template={template}
                        title={data.title}
                        deadline={data.deadline}
                        selectedUserIds={data.selectedUserIds}
                        selectedGroupId={data.selectedGroupId}
                        roleAssignments={data.roleAssignments}
                        users={users}
                        groups={groups}
                        onPrevious={() => setCurrentStep(2)}
                        onSubmit={handleSubmit}
                    />
                )}
            </Card>
        </div>
    );
}
