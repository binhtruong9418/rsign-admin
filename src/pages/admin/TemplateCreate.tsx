import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    Step1TypeSelection,
    Step2Upload,
    Step3SignerRoles,
    Step4Zones,
    Step5Review
} from '@/components/template-creation';
import { templatesAPI } from '@/lib/api';
import type { TemplateData } from '@/types/template';

const initialTemplateData: TemplateData = {
    name: '',
    description: '',
    signingMode: null,
    signingFlow: 'PARALLEL',
    file: null,
    fileUrl: '',
    signers: [],
    signingSteps: [],
    signatureZones: [],
    pageDimensions: new Map(),
};

export default function TemplateCreate() {
    const navigate = useNavigate();
    const { templateId } = useParams<{ templateId: string }>();
    const isEditMode = !!templateId;
    const [currentStep, setCurrentStep] = useState(1);
    const [templateData, setTemplateData] = useState<TemplateData>(initialTemplateData);

    // Load template data for edit mode
    const { data: existingTemplate, isLoading } = useQuery({
        queryKey: ['template', templateId],
        queryFn: () => templatesAPI.getTemplate(templateId!),
        enabled: isEditMode,
    });

    // Populate form when editing
    useEffect(() => {
        if (isEditMode && existingTemplate) {
            const tmpl = existingTemplate.template;
            setTemplateData({
                name: tmpl.name || tmpl.templateName || '',
                description: tmpl.description || '',
                signingMode: tmpl.signingMode,
                signingFlow: tmpl.signingFlow,
                file: null, // File will be loaded from URL
                fileUrl: tmpl.fileUrl,
                signers: tmpl.signers || [],
                signingSteps: tmpl.signingSteps || [],
                signatureZones: tmpl.signatureZones || [],
                pageDimensions: new Map(),
            });
        }
    }, [isEditMode, existingTemplate]);

    const updateTemplateData = (updates: Partial<TemplateData>) => {
        setTemplateData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const steps = [
        { number: 1, label: 'Type' },
        { number: 2, label: 'Upload' },
        { number: 3, label: 'Signers' },
        { number: 4, label: 'Zones' },
        { number: 5, label: 'Review' },
    ];

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1TypeSelection
                        selectedType={templateData.signingMode}
                        onSelect={(type) => {
                            updateTemplateData({
                                signingMode: type,
                                signingFlow: type === 'INDIVIDUAL' ? 'PARALLEL' : templateData.signingFlow,
                                signers: type === 'INDIVIDUAL' ? [{ role: '', description: '', order: 1, color: '#3B82F6' }] : [],
                            });
                        }}
                        onNext={nextStep}
                    />
                );
            case 2:
                return (
                    <Step2Upload
                        templateData={templateData}
                        updateTemplateData={updateTemplateData}
                        onNext={nextStep}
                        onPrevious={prevStep}
                    />
                );
            case 3:
                return (
                    <Step3SignerRoles
                        templateData={templateData}
                        updateTemplateData={updateTemplateData}
                        onNext={nextStep}
                        onPrevious={prevStep}
                    />
                );
            case 4:
                return (
                    <Step4Zones
                        templateData={templateData}
                        updateTemplateData={updateTemplateData}
                        onNext={nextStep}
                        onPrevious={prevStep}
                    />
                );
            case 5:
                return (
                    <Step5Review
                        templateData={templateData}
                        onPrevious={prevStep}
                        isEditMode={isEditMode}
                        templateId={templateId}
                    />
                );
            default:
                return null;
        }
    };

    if (isEditMode && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
                    <p className="text-secondary-600">Loading template...</p>
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
                        onClick={() => navigate(isEditMode ? `/admin/templates/${templateId}` : '/admin/templates')}
                        className="flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {isEditMode ? 'Back to Template' : 'Back to Templates'}
                    </button>
                    <h1 className="text-3xl font-bold text-secondary-900">
                        {isEditMode ? 'Edit Template' : 'Create New Template'}
                    </h1>
                    <p className="text-secondary-600 mt-1">
                        {isEditMode
                            ? 'Update your template with new settings or zones.'
                            : 'Create a reusable document template with predefined signature zones and signing workflow.'}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="card p-6 mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${currentStep >= step.number
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-secondary-200 text-secondary-600'
                                            }`}
                                    >
                                        {step.number}
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-secondary-700">
                                        {step.label}
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`h-1 flex-1 mx-2 -mt-8 transition-colors ${currentStep > step.number
                                                ? 'bg-primary-600'
                                                : 'bg-secondary-200'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="card p-8">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
}
