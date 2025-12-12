import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    FileText,
    Users,
    Upload,
    Check,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
    { id: 1, name: 'Type', icon: FileText, description: 'Choose document type' },
    { id: 2, name: 'Upload', icon: Upload, description: 'Upload document' },
    { id: 3, name: 'Recipients', icon: Users, description: 'Select recipients' },
    { id: 4, name: 'Zones', icon: FileText, description: 'Place signature zones' },
    { id: 5, name: 'Review', icon: Check, description: 'Review and send' },
];

export default function DocumentCreate() {
    const [currentStep, setCurrentStep] = useState(1);
    const [documentType, setDocumentType] = useState<'INDIVIDUAL' | 'SHARED' | null>(null);
    const navigate = useNavigate();

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

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <TypeSelectionStep
                        selectedType={documentType}
                        onSelect={setDocumentType}
                        onNext={goToNext}
                    />
                );
            case 2:
                return <UploadStep onNext={goToNext} onPrevious={goToPrevious} />;
            case 3:
                return <RecipientsStep onNext={goToNext} onPrevious={goToPrevious} />;
            case 4:
                return <ZonesStep onNext={goToNext} onPrevious={goToPrevious} />;
            case 5:
                return <ReviewStep onPrevious={goToPrevious} />;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/admin/documents')}
                    className="flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Documents
                </button>
                <h1 className="text-2xl font-bold text-secondary-900">Create New Document</h1>
                <p className="text-secondary-600">Follow the steps below to create and send your document for signature.</p>
            </div>

            {/* Progress Steps */}
            <div className="card p-6 mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex items-center">
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                                        isCompleted
                                            ? 'bg-primary-600 text-white'
                                            : isActive
                                                ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                                                : 'bg-secondary-200 text-secondary-600'
                                    )}>
                                        {isCompleted ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <StepIcon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="ml-3 hidden sm:block">
                                        <p className={cn(
                                            'text-sm font-medium',
                                            isActive ? 'text-primary-600' : 'text-secondary-600'
                                        )}>
                                            {step.name}
                                        </p>
                                        <p className="text-xs text-secondary-500">{step.description}</p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <ChevronRight className="w-5 h-5 text-secondary-400 mx-4" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="card p-6">
                {renderStepContent()}
            </div>
        </div>
    );
}

// Step 1: Type Selection
function TypeSelectionStep({
    selectedType,
    onSelect,
    onNext
}: {
    selectedType: 'INDIVIDUAL' | 'SHARED' | null;
    onSelect: (type: 'INDIVIDUAL' | 'SHARED') => void;
    onNext: () => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Choose Document Type</h2>
                <p className="text-secondary-600">What type of document do you want to create?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => onSelect('INDIVIDUAL')}
                    className={cn(
                        'p-6 border-2 rounded-lg text-left transition-all hover:shadow-md cursor-pointer',
                        selectedType === 'INDIVIDUAL'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-secondary-200 hover:border-primary-300'
                    )}
                >
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Individual Documents</h3>
                    <p className="text-secondary-600 mb-4">Each recipient gets their own copy of the document</p>
                    <div className="text-sm text-secondary-500">
                        <p className="font-medium mb-1">Best for:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Bulk contracts</li>
                            <li>Employment documents</li>
                            <li>NDAs (100+ recipients)</li>
                        </ul>
                    </div>
                </button>

                <button
                    onClick={() => onSelect('SHARED')}
                    className={cn(
                        'p-6 border-2 rounded-lg text-left transition-all hover:shadow-md cursor-pointer',
                        selectedType === 'SHARED'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-secondary-200 hover:border-primary-300'
                    )}
                >
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Shared Document</h3>
                    <p className="text-secondary-600 mb-4">All recipients sign the same document</p>
                    <div className="text-sm text-secondary-500">
                        <p className="font-medium mb-1">Best for:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Multi-party agreements</li>
                            <li>Approvals & contracts</li>
                            <li>Partnership deals</li>
                        </ul>
                    </div>
                </button>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!selectedType}
                    className={cn(
                        'btn-primary inline-flex items-center',
                        !selectedType && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    Next: Upload Document
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// Placeholder steps
function UploadStep({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-secondary-900">Upload Document</h2>
            <div className="border-2 border-dashed border-secondary-300 rounded-lg p-12 text-center">
                <Upload className="mx-auto h-12 w-12 text-secondary-400" />
                <p className="mt-2 text-sm text-secondary-600">Upload functionality coming soon...</p>
            </div>
            <div className="flex justify-between">
                <button onClick={onPrevious} className="btn-secondary">Previous</button>
                <button onClick={onNext} className="btn-primary">Next</button>
            </div>
        </div>
    );
}

function RecipientsStep({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-secondary-900">Select Recipients</h2>
            <p className="text-secondary-600">Recipients selection coming soon...</p>
            <div className="flex justify-between">
                <button onClick={onPrevious} className="btn-secondary">Previous</button>
                <button onClick={onNext} className="btn-primary">Next</button>
            </div>
        </div>
    );
}

function ZonesStep({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-secondary-900">Place Signature Zones</h2>
            <p className="text-secondary-600">Signature zone placement coming soon...</p>
            <div className="flex justify-between">
                <button onClick={onPrevious} className="btn-secondary">Previous</button>
                <button onClick={onNext} className="btn-primary">Next</button>
            </div>
        </div>
    );
}

function ReviewStep({ onPrevious }: { onPrevious: () => void }) {
    const navigate = useNavigate();

    const handleSend = () => {
        // TODO: Implement document sending
        navigate('/admin/documents');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-secondary-900">Review & Send</h2>
            <p className="text-secondary-600">Review functionality coming soon...</p>
            <div className="flex justify-between">
                <button onClick={onPrevious} className="btn-secondary">Previous</button>
                <button onClick={handleSend} className="btn-primary">Send Document</button>
            </div>
        </div>
    );
}