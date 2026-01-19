import { FileText, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { SigningMode } from '@/types/template';

interface Step1TypeSelectionProps {
    selectedType: SigningMode | null;
    onSelect: (type: SigningMode) => void;
    onNext: () => void;
}

export function Step1TypeSelection({ selectedType, onSelect, onNext }: Step1TypeSelectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Choose Template Type</h2>
                <p className="text-secondary-600">What type of template do you want to create?</p>
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
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Individual Template</h3>
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
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">Shared Template</h3>
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
                <Button
                    onClick={onNext}
                    disabled={!selectedType}
                    className="inline-flex items-center"
                >
                    Next: Upload Document
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
