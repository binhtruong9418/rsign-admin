import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Upload, Users, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DocumentData, type SigningStep, type Signer, type SignatureZone } from '@/types/document-creation';
import { Step1TypeSelection } from '@/components/document-creation/Step1TypeSelection';
import { Step2Upload } from '@/components/document-creation/Step2Upload';
import { Step3Recipients } from '@/components/document-creation/Step3Recipients';
import { Step4Zones } from '@/components/document-creation/Step4Zones';
import { Step5Review } from '@/components/document-creation/Step5Review';
import { documentsAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';

const steps = [
    { id: 1, name: 'Type', icon: FileText, description: 'Document type' },
    { id: 2, name: 'Upload', icon: Upload, description: 'Document details' },
    { id: 3, name: 'Recipients', icon: Users, description: 'Select recipients' },
    { id: 4, name: 'Zones', icon: FileText, description: 'Signature zones' },
    { id: 5, name: 'Review', icon: Check, description: 'Review and update' },
];

export default function DocumentEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoadingDocument, setIsLoadingDocument] = useState(true);
    const [documentData, setDocumentData] = useState<DocumentData>({
        // Step 1
        type: null,

        // Step 2
        title: '',
        file: null,
        fileUrl: undefined,
        deadline: undefined,
        signingFlow: 'PARALLEL',

        // Step 3
        recipients: [],
        selectedGroup: undefined,
        signers: [],
        signingSteps: [] as SigningStep[],

        // Step 4
        signatureZones: [],

        // Step 5
        notifications: {
            onComplete: true,
            reminder: true,
            dailyReport: false,
        }
    });

    // Fetch document details
    const { data: documentDetail, isLoading, error } = useQuery({
        queryKey: ['admin-document-detail', id],
        queryFn: () => documentsAPI.getDocument(id!),
        enabled: !!id,
    });

    // Load document data into form
    useEffect(() => {
        if (documentDetail && isLoadingDocument) {
            const { document, signers: apiSigners, zones: apiZones, steps: apiSteps } = documentDetail;

            // Check if document is DRAFT
            if (document.status !== 'DRAFT') {
                showToast.error('Only documents in DRAFT status can be edited');
                navigate(`/admin/documents/${id}`);
                return;
            }

            // Map API signers to form signers
            const formSigners: Signer[] = (apiSigners || []).map((signer: any, index: number) => ({
                id: `signer-${signer.user.id}`,
                userId: signer.user.id,
                name: signer.user.fullName,
                email: signer.user.email,
                color: getSignerColor(index),
                step: signer.stepOrder || undefined,
            }));

            // Map API zones to form zones
            const formZones: SignatureZone[] = (apiZones || []).map((zone: any, index: number) => {
                // Find signer for this zone
                const signer = apiSigners?.find((s: any) => {
                    return s.signatureZone?.id === zone.id;
                });

                return {
                    id: `zone-${index}`,
                    signerId: signer ? `signer-${signer.user.id}` : '',
                    page: zone.page,
                    x: zone.position.x,
                    y: zone.position.y,
                    width: zone.position.width,
                    height: zone.position.height,
                    label: zone.label,
                };
            });

            // Map signing steps
            let formSteps: SigningStep[] = [];
            if (document.flow === 'SEQUENTIAL' && apiSteps && apiSteps.length > 0) {
                formSteps = apiSteps.map((step: any) => ({
                    stepOrder: step.stepOrder,
                    signerIds: step.signers.map((s: any) => `signer-${s.user.id}`),
                }));
            }

            setDocumentData({
                // Step 1
                type: document.mode,

                // Step 2
                title: document.title,
                file: null,
                fileUrl: documentDetail.files.original,
                deadline: document.deadline || undefined,
                signingFlow: document.flow,

                // Step 3
                recipients: [], // INDIVIDUAL mode not supported in edit for now
                selectedGroup: undefined,
                signers: formSigners,
                signingSteps: formSteps,

                // Step 4
                signatureZones: formZones,

                // Step 5
                notifications: {
                    onComplete: true,
                    reminder: true,
                    dailyReport: false,
                }
            });

            setIsLoadingDocument(false);
        }
    }, [documentDetail, isLoadingDocument, id, navigate]);

    const goToNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const updateDocumentData = (updates: Partial<DocumentData>) => {
        setDocumentData(prev => {
            // Special handling: If switching to SEQUENTIAL and no steps exist, create initial step
            if (updates.signingFlow === 'SEQUENTIAL' && prev.signingSteps.length === 0) {
                return {
                    ...prev,
                    ...updates,
                    signingSteps: [{
                        stepOrder: 1,
                        signerIds: []
                    }]
                };
            }

            // Special handling: If switching from SEQUENTIAL to PARALLEL, clear steps
            if (updates.signingFlow === 'PARALLEL' && prev.signingFlow === 'SEQUENTIAL') {
                return {
                    ...prev,
                    ...updates,
                    signingSteps: []
                };
            }

            return { ...prev, ...updates };
        });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1TypeSelection
                        selectedType={documentData.type}
                        onSelect={(type) => updateDocumentData({ type })}
                        onNext={goToNext}
                    />
                );
            case 2:
                return (
                    <Step2Upload
                        documentData={documentData}
                        updateDocumentData={updateDocumentData}
                        onNext={goToNext}
                        onPrevious={goToPrevious}
                    />
                );
            case 3:
                return (
                    <Step3Recipients
                        documentData={documentData}
                        updateDocumentData={updateDocumentData}
                        onNext={goToNext}
                        onPrevious={goToPrevious}
                    />
                );
            case 4:
                return (
                    <Step4Zones
                        documentData={documentData}
                        updateDocumentData={updateDocumentData}
                        onNext={goToNext}
                        onPrevious={goToPrevious}
                    />
                );
            case 5:
                return (
                    <Step5Review
                        documentData={documentData}
                        updateDocumentData={updateDocumentData}
                        onPrevious={goToPrevious}
                        isEditMode={true}
                        documentId={id}
                    />
                );
            default:
                return null;
        }
    };

    // Dynamic step name for step 3
    const getStepName = (step: typeof steps[0]) => {
        if (step.id === 3) {
            return documentData.type === 'INDIVIDUAL' ? 'Recipients' : 'Signers';
        }
        return step.name;
    };

    if (isLoading || isLoadingDocument) {
        return (
            <div className="min-h-screen bg-secondary-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <div className="text-secondary-600">Loading document...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !documentDetail) {
        return (
            <div className="min-h-screen bg-secondary-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <div className="text-red-500 text-sm mb-4">
                            Failed to load document. Please try again.
                        </div>
                        <button
                            onClick={() => navigate('/admin/documents')}
                            className="text-primary-600 hover:text-primary-700"
                        >
                            <ArrowLeft className="h-4 w-4 inline mr-2" />
                            Back to Documents
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/admin/documents/${id}`)}
                        className="flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Document Detail
                    </button>
                    <h1 className="text-3xl font-bold text-secondary-900">Edit Document</h1>
                    <p className="text-secondary-600 mt-1">Update document details, recipients, and signature zones.</p>
                </div>

                {/* Progress Steps */}
                <div className="card p-6 mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;
                            const StepIcon = step.icon;

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex items-center flex-1">
                                        <div className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                                            isCompleted
                                                ? 'bg-primary-600 text-white'
                                                : isActive
                                                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                                                    : 'bg-secondary-200 text-secondary-600'
                                        )}>
                                            {isCompleted ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <StepIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="ml-3 hidden sm:block">
                                            <p className={cn(
                                                'text-sm font-medium',
                                                isActive ? 'text-primary-600' : 'text-secondary-600'
                                            )}>
                                                {getStepName(step)}
                                            </p>
                                            <p className="text-xs text-secondary-500">{step.description}</p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <ChevronRight className="w-5 h-5 text-secondary-400 mx-2" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="card p-8">
                    {renderStepContent()}
                </div>

                {/* Debug Info (remove in production) */}
                {import.meta.env.DEV && (
                    <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
                        <details>
                            <summary className="cursor-pointer font-medium mb-2">Debug Info (Dev Only)</summary>
                            <pre className="overflow-auto max-h-96">
                                {JSON.stringify({
                                    documentId: id,
                                    currentStep,
                                    type: documentData.type,
                                    title: documentData.title,
                                    hasFile: !!documentData.file,
                                    fileUrl: documentData.fileUrl,
                                    signingFlow: documentData.signingFlow,
                                    signersCount: documentData.signers.length,
                                    signingSteps: documentData.signingSteps,
                                    zonesCount: documentData.signatureZones.length,
                                    zones: documentData.signatureZones.map(z => ({
                                        signerId: z.signerId,
                                        page: z.page,
                                        label: z.label
                                    }))
                                }, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to generate signer colors
function getSignerColor(index: number): string {
    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316', // orange
    ];
    return colors[index % colors.length];
}
