// Import the document zones component and adapt it for templates
import { Step4Zones as DocumentStep4Zones } from '@/components/document-creation/Step4Zones';
import type { TemplateData, TemplateSignerPlaceholder } from '@/types/template';
import type { DocumentData, Signer } from '@/types/document-creation';

interface Step4ZonesContentProps {
    templateData: TemplateData;
    updateTemplateData: (updates: Partial<TemplateData>) => void;
    onNext: () => void;
    onPrevious: () => void;
}

export function Step4ZonesContent({ templateData, updateTemplateData, onNext, onPrevious }: Step4ZonesContentProps) {
    // Convert TemplateData to DocumentData format for the zones component
    const documentDataAdapter: DocumentData = {
        type: templateData.signingMode === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'SHARED',
        title: templateData.name,
        file: templateData.file,
        fileUrl: templateData.fileUrl,
        deadline: '',
        recipients: [],
        signingFlow: templateData.signingFlow,
        notifications: { onComplete: false, reminder: false, dailyReport: false },
        signers: templateData.signers.map((signer: TemplateSignerPlaceholder, index: number): Signer => ({
            id: `signer-${index}`,
            userId: '',
            name: signer.role, // Use role name as the signer name for display
            email: signer.description || '', // Use description in email field for display
            color: signer.color,
        })),
        signingSteps: templateData.signingSteps.map((step, idx) => ({
            stepNumber: idx + 1,
            stepOrder: step.stepNumber,
            signerIds: [],
            signers: step.signers.map((signer: TemplateSignerPlaceholder, index: number): Signer => ({
                id: `step-${step.stepNumber}-signer-${index}`,
                userId: '',
                name: signer.role,
                email: signer.description || '',
                color: signer.color,
            })),
        })),
        signatureZones: templateData.signatureZones,
        pageDimensions: templateData.pageDimensions,
    };

    const handleUpdateDocumentData = (updates: Partial<DocumentData>) => {
        // Convert updates back to template format
        const templateUpdates: Partial<TemplateData> = {};

        if (updates.signatureZones !== undefined) {
            templateUpdates.signatureZones = updates.signatureZones;
        }

        if (updates.pageDimensions !== undefined) {
            templateUpdates.pageDimensions = updates.pageDimensions;
        }

        updateTemplateData(templateUpdates);
    };

    return (
        <DocumentStep4Zones
            documentData={documentDataAdapter}
            updateDocumentData={handleUpdateDocumentData}
            onNext={onNext}
            onPrevious={onPrevious}
        />
    );
}
