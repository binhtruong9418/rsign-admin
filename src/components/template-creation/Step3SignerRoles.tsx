import { useState } from 'react';
import { ArrowLeft, ArrowRight, Users, Plus, X, GripVertical, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { TemplateData, TemplateSignerPlaceholder, TemplateSigningStep } from '@/types/template';

interface Step3SignerRolesProps {
    templateData: TemplateData;
    updateTemplateData: (updates: Partial<TemplateData>) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const signerColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
];

export function Step3SignerRoles({ templateData, updateTemplateData, onNext, onPrevious }: Step3SignerRolesProps) {

    const handleNext = () => {
        onNext();
    };

    const canProceed = templateData.signers.length > 0 &&
        templateData.signers.every(s => s.role && s.role.trim());

    if (templateData.signingMode === 'INDIVIDUAL') {
        return (
            <IndividualSigner
                templateData={templateData}
                updateTemplateData={updateTemplateData}
                onNext={handleNext}
                onPrevious={onPrevious}
                canProceed={canProceed}
            />
        );
    }

    if (templateData.signingFlow === 'PARALLEL') {
        return (
            <ParallelSigners
                templateData={templateData}
                updateTemplateData={updateTemplateData}
                onNext={handleNext}
                onPrevious={onPrevious}
                canProceed={canProceed}
            />
        );
    }

    return (
        <SequentialSigners
            templateData={templateData}
            updateTemplateData={updateTemplateData}
            onNext={handleNext}
            onPrevious={onPrevious}
            canProceed={canProceed}
        />
    );
}

// INDIVIDUAL Mode Component
function IndividualSigner({
    templateData,
    updateTemplateData,
    onNext,
    onPrevious,
    canProceed,
}: {
    templateData: TemplateData;
    updateTemplateData: (updates: Partial<TemplateData>) => void;
    onNext: () => void;
    onPrevious: () => void;
    canProceed: boolean;
}) {
    const signer = templateData.signers[0] || { role: '', description: '', order: 1, color: signerColors[0] };

    const handleUpdateSigner = (updates: Partial<TemplateSignerPlaceholder>) => {
        updateTemplateData({
            signers: [{ ...signer, ...updates }]
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Define Signer Role</h2>
                <p className="text-secondary-600">
                    Define the role for the signer. When using this template, you'll assign actual users to this role.
                </p>
            </div>

            <Card className="p-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Role Name * <span className="text-secondary-500">(e.g., "Employee", "Contractor")</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Employee"
                            value={signer.role}
                            onChange={(e) => handleUpdateSigner({ role: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Description (Optional)
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., The person receiving the employment offer"
                            value={signer.description}
                            onChange={(e) => handleUpdateSigner({ description: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded" style={{ backgroundColor: signer.color }} />
                        <span className="text-sm text-secondary-600">Signature color for this role</span>
                    </div>
                </div>
            </Card>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    className="inline-flex items-center"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="inline-flex items-center"
                >
                    Next: Place Signature Zones
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// PARALLEL Mode Component
function ParallelSigners({
    templateData,
    updateTemplateData,
    onNext,
    onPrevious,
    canProceed,
}: {
    templateData: TemplateData;
    updateTemplateData: (updates: Partial<TemplateData>) => void;
    onNext: () => void;
    onPrevious: () => void;
    canProceed: boolean;
}) {
    const [signers, setSigners] = useState<TemplateSignerPlaceholder[]>(
        templateData.signers.length > 0
            ? templateData.signers
            : [{ role: '', description: '', order: 1, color: signerColors[0] }]
    );

    const addSigner = () => {
        const newSigner: TemplateSignerPlaceholder = {
            role: '',
            description: '',
            order: signers.length + 1,
            color: signerColors[signers.length % signerColors.length],
        };
        const updatedSigners = [...signers, newSigner];
        setSigners(updatedSigners);
        updateTemplateData({ signers: updatedSigners });
    };

    const removeSigner = (index: number) => {
        const updatedSigners = signers.filter((_, i) => i !== index)
            .map((s, i) => ({ ...s, order: i + 1, color: signerColors[i % signerColors.length] }));
        setSigners(updatedSigners);
        updateTemplateData({ signers: updatedSigners });
    };

    const updateSigner = (index: number, updates: Partial<TemplateSignerPlaceholder>) => {
        const updatedSigners = signers.map((s, i) => i === index ? { ...s, ...updates } : s);
        setSigners(updatedSigners);
        updateTemplateData({ signers: updatedSigners });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Define Signer Roles (Parallel)</h2>
                <p className="text-secondary-600">
                    All signers will receive the document at the same time and can sign in any order.
                </p>
            </div>

            <div className="space-y-4">
                {signers.map((signer, index) => (
                    <Card key={index} className="p-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 pt-2">
                                <div className="w-8 h-8 rounded flex items-center justify-center text-white font-medium"
                                    style={{ backgroundColor: signer.color }}>
                                    {index + 1}
                                </div>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Role Name * <span className="text-secondary-500 text-xs">(e.g., "Manager", "HR")</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g., Department Manager"
                                        value={signer.role}
                                        onChange={(e) => updateSigner(index, { role: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Description (Optional)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g., The person approving this request"
                                        value={signer.description}
                                        onChange={(e) => updateSigner(index, { description: e.target.value })}
                                    />
                                </div>
                            </div>
                            {signers.length > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSigner(index)}
                                    className="mt-1"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Button
                variant="outline"
                onClick={addSigner}
                className="w-full inline-flex items-center justify-center"
                disabled={signers.length >= 8}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Signer Role {signers.length >= 8 && '(Maximum 8)'}
            </Button>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    className="inline-flex items-center"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="inline-flex items-center"
                >
                    Next: Place Signature Zones
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// SEQUENTIAL Mode Component
function SequentialSigners({
    templateData,
    updateTemplateData,
    onNext,
    onPrevious,
    canProceed,
}: {
    templateData: TemplateData;
    updateTemplateData: (updates: Partial<TemplateData>) => void;
    onNext: () => void;
    onPrevious: () => void;
    canProceed: boolean;
}) {
    const [steps, setSteps] = useState<TemplateSigningStep[]>(
        templateData.signingSteps.length > 0
            ? templateData.signingSteps
            : [{ stepNumber: 1, signers: [{ role: '', description: '', order: 1, color: signerColors[0] }] }]
    );

    const addStep = () => {
        const newStep: TemplateSigningStep = {
            stepNumber: steps.length + 1,
            signers: [{ role: '', description: '', order: 1, color: signerColors[0] }],
        };
        const updatedSteps = [...steps, newStep];
        setSteps(updatedSteps);
        updateSignersFromSteps(updatedSteps);
    };

    const removeStep = (stepIndex: number) => {
        const updatedSteps = steps.filter((_, i) => i !== stepIndex)
            .map((step, i) => ({ ...step, stepNumber: i + 1 }));
        setSteps(updatedSteps);
        updateSignersFromSteps(updatedSteps);
    };

    const addSignerToStep = (stepIndex: number) => {
        const updatedSteps = steps.map((step, i) => {
            if (i === stepIndex) {
                const newSigner: TemplateSignerPlaceholder = {
                    role: '',
                    description: '',
                    order: step.signers.length + 1,
                    color: signerColors[step.signers.length % signerColors.length],
                };
                return { ...step, signers: [...step.signers, newSigner] };
            }
            return step;
        });
        setSteps(updatedSteps);
        updateSignersFromSteps(updatedSteps);
    };

    const removeSignerFromStep = (stepIndex: number, signerIndex: number) => {
        const updatedSteps = steps.map((step, i) => {
            if (i === stepIndex) {
                return {
                    ...step,
                    signers: step.signers.filter((_, si) => si !== signerIndex)
                        .map((s, si) => ({ ...s, order: si + 1 }))
                };
            }
            return step;
        });
        setSteps(updatedSteps);
        updateSignersFromSteps(updatedSteps);
    };

    const updateStepSigner = (stepIndex: number, signerIndex: number, updates: Partial<TemplateSignerPlaceholder>) => {
        const updatedSteps = steps.map((step, i) => {
            if (i === stepIndex) {
                return {
                    ...step,
                    signers: step.signers.map((s: TemplateSignerPlaceholder, si: number) => si === signerIndex ? { ...s, ...updates } : s)
                };
            }
            return step;
        });
        setSteps(updatedSteps);
        updateSignersFromSteps(updatedSteps);
    };

    const updateSignersFromSteps = (updatedSteps: TemplateSigningStep[]) => {
        const allSigners = updatedSteps.flatMap(step => step.signers);
        updateTemplateData({
            signers: allSigners,
            signingSteps: updatedSteps,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Define Signing Steps (Sequential)</h2>
                <p className="text-secondary-600">
                    Define roles for each signing step. Each step must be completed before the next one begins.
                </p>
            </div>

            <div className="space-y-6">
                {steps.map((step, stepIndex) => (
                    <Card key={stepIndex} className="p-4">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-secondary-400" />
                                <h3 className="font-medium text-secondary-900">Step {step.stepNumber}</h3>
                            </div>
                            {steps.length > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeStep(stepIndex)}
                                    className="ml-auto"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {step.signers.map((signer, signerIndex) => (
                                <div key={signerIndex} className="flex items-start gap-3 p-3 bg-secondary-50 rounded">
                                    <div className="flex-shrink-0 pt-1">
                                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-medium"
                                            style={{ backgroundColor: signer.color }}>
                                            {signerIndex + 1}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            type="text"
                                            placeholder="Role name (e.g., Manager)"
                                            value={signer.role}
                                            onChange={(e) => updateStepSigner(stepIndex, signerIndex, { role: e.target.value })}
                                        />
                                        <Input
                                            type="text"
                                            placeholder="Description (optional)"
                                            value={signer.description}
                                            onChange={(e) => updateStepSigner(stepIndex, signerIndex, { description: e.target.value })}
                                        />
                                    </div>
                                    {step.signers.length > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeSignerFromStep(stepIndex, signerIndex)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSignerToStep(stepIndex)}
                            className="mt-3 w-full"
                            disabled={step.signers.length >= 8}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Signer to This Step
                        </Button>
                    </Card>
                ))}
            </div>

            <Button
                variant="outline"
                onClick={addStep}
                className="w-full inline-flex items-center justify-center"
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Signing Step
            </Button>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    className="inline-flex items-center"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="inline-flex items-center"
                >
                    Next: Place Signature Zones
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
