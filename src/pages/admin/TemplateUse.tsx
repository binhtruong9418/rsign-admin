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
                if (restoredSteps.length > 0 && (!restoredSteps[0]?.signers || restoredSteps[0]?.signers.length === 0)) {
                    // Preserve original step data including zoneIndices
                    restoredSteps = restoredSteps.map((step: any) => ({
                        ...step,
                        signers: restoredSigners
                    }));
                } else if (restoredSteps.length === 0) {
                    // No steps exist at all, create default
                    restoredSteps = [{
                        stepOrder: 1,
                        signers: restoredSigners,
                        zoneIndices: restoredZones.map((_: any, idx: number) => idx) // All zones
                    }];
                }
            }

            const enhanced = {
                ...originalTmpl,
                signers: restoredSigners,
                signingSteps: restoredSteps,
                signatureZones: restoredZones
            };

            console.log('=== Enhanced Template Created ===');
            console.log('Signers:', restoredSigners);
            console.log('Zones with signerId:', restoredZones);
            console.log('================================');

            setEnhancedTemplate(enhanced);
        }
    }, [template]); // Only depend on template, not enhancedTemplate to avoid infinite loop

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

        console.log('=== DEBUG: Submit Start ===');
        console.log('displayTemplate:', displayTemplate);
        console.log('displayTemplate.signers:', displayTemplate.signers);
        console.log('data.roleAssignments:', data.roleAssignments);

        try {
            const isIndividualMode = displayTemplate.signingMode === 'INDIVIDUAL';

            // Validation for SHARED mode
            if (!isIndividualMode) {
                // Check if all roles have been assigned
                const requiredRoles = displayTemplate.signers?.map((s: any) => s.role) || [];
                console.log('Required roles:', requiredRoles);

                if (requiredRoles.length === 0) {
                    showToast.error('Template signers not loaded properly. Please refresh the page.');
                    return;
                }

                const missingRoles = requiredRoles.filter((role: string) => !data.roleAssignments[role]);

                if (missingRoles.length > 0) {
                    showToast.error(`Please assign users to all roles. Missing: ${missingRoles.join(', ')}`);
                    return;
                }
            }

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
                    console.log('Processing step:', step);

                    // Group zones by role, then map each role to its user with all zones
                    const roleToZones = new Map<string, number[]>();

                    // Access zoneIndices from the step
                    const indices = step.zoneIndices || [];
                    console.log('Zone indices for step:', indices);

                    // First pass: group zone indices by role
                    indices.forEach((zoneIdx: number) => {
                        const zone = displayTemplate.signatureZones[zoneIdx];
                        console.log(`Zone ${zoneIdx}:`, zone);

                        if (!zone) return;

                        // Identify the role for this zone by matching with signers array
                        let roleName: string | undefined;

                        // Method 1: Use signerId to map to signer.role (most reliable for enhanced template)
                        if (zone.signerId) {
                            const sIdx = parseInt(zone.signerId.replace('signer-', ''));
                            console.log(`Zone has signerId: ${zone.signerId}, parsed index: ${sIdx}`);
                            if (!isNaN(sIdx) && displayTemplate.signers?.[sIdx]) {
                                roleName = displayTemplate.signers[sIdx].role;
                                console.log(`Mapped to role via signerId: ${roleName}`);
                            }
                        }

                        // Method 2: Fallback - try to match zone.label with signer.role
                        if (!roleName && zone.label && displayTemplate.signers) {
                            const matchedSigner = displayTemplate.signers.find((s: any) => s.role === zone.label);
                            if (matchedSigner) {
                                roleName = matchedSigner.role;
                                console.log(`Mapped to role via label match: ${roleName}`);
                            }
                        }

                        // Method 3: Last resort - use zone.label directly
                        if (!roleName && zone.label) {
                            roleName = zone.label;
                            console.log(`Using zone label directly as role: ${roleName}`);
                        }

                        console.log(`Final roleName for zone ${zoneIdx}: ${roleName}`);

                        if (roleName) {
                            if (!roleToZones.has(roleName)) {
                                roleToZones.set(roleName, []);
                            }
                            roleToZones.get(roleName)!.push(zoneIdx);
                        }
                    });

                    console.log('roleToZones map:', Array.from(roleToZones.entries()));

                    // Second pass: create one entry per role/user with all their zones
                    const stepAssignments: { userId: string; zoneIndex: number }[] = [];

                    roleToZones.forEach((zoneIndices, roleName) => {
                        const userId = data.roleAssignments[roleName];
                        console.log(`Role "${roleName}" -> userId: ${userId}, zones: ${zoneIndices}`);

                        if (userId) {
                            // Add one assignment per zone for this user
                            zoneIndices.forEach(zoneIdx => {
                                stepAssignments.push({
                                    userId: userId,
                                    zoneIndex: zoneIdx
                                });
                            });
                        } else {
                            console.warn(`No userId found for role: ${roleName}`);
                        }
                    });

                    console.log('stepAssignments:', stepAssignments);

                    return {
                        stepOrder: step.stepOrder || step.stepNumber,
                        signers: stepAssignments
                    };
                });
            }

            // Debug logging
            console.log('=== DEBUG: Create Document Request ===');
            console.log('Template:', displayTemplate);
            console.log('Role Assignments:', data.roleAssignments);
            console.log('Request:', JSON.stringify(request, null, 2));
            console.log('====================================');

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
                        template={displayTemplate}
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
                        template={displayTemplate}
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
                        template={displayTemplate}
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
