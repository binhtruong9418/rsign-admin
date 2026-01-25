import { ArrowRight, FileText, Calendar, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PDFViewerComplete, type Zone } from '@/components/pdf';
import { useState } from 'react';

interface TemplateUseStep1Props {
    template: any;
    title: string;
    deadline: string;
    onTitleChange: (title: string) => void;
    onDeadlineChange: (deadline: string) => void;
    onNext: () => void;
}

export function TemplateUseStep1({
    template,
    title,
    deadline,
    onTitleChange,
    onDeadlineChange,
    onNext
}: TemplateUseStep1Props) {
    const [showPreview, setShowPreview] = useState(false);

    // Transform template zones to Zone format
    const zones: Zone[] = template.signatureZones?.map((zone: any) => ({
        id: zone.id,
        page: zone.pageNumber,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
        label: zone.label,
        color: zone.assignedRole ?
            template.signers?.find((s: any) => s.role === zone.assignedRole)?.color :
            '#2563eb',
        assignedUser: zone.assignedRole ? {
            fullName: zone.assignedRole,
            email: ''
        } : undefined
    })) || [];

    const handleNext = () => {
        onNext();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                    Template Overview
                </h2>
                <p className="text-secondary-600">
                    Review template details and configure your document
                </p>
            </div>

            {/* Template Info Card */}
            <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-secondary-900">
                                {template.name}
                            </h3>
                            {template.description && (
                                <p className="text-sm text-secondary-600 mt-1">
                                    {template.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant={showPreview ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Preview
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Preview
                            </>
                        )}
                    </Button>
                </div>

                {/* Template Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-secondary-200">
                    <div>
                        <p className="text-xs text-secondary-500 mb-1">Signing Mode</p>
                        <Badge variant="secondary">
                            {template.signingMode}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-xs text-secondary-500 mb-1">Signing Flow</p>
                        <Badge variant="secondary">
                            {template.signingFlow}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-xs text-secondary-500 mb-1">Total Steps</p>
                        <p className="font-medium text-secondary-900">
                            {template.totalSteps || 1}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-secondary-500 mb-1">Signature Zones</p>
                        <p className="font-medium text-secondary-900">
                            {template.signatureZones?.length || 0}
                        </p>
                    </div>
                </div>
            </Card>

            {/* PDF Preview */}
            {showPreview && template.fileUrl && (
                <Card className="p-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-secondary-900">
                            Document Preview
                        </h3>
                        <p className="text-sm text-secondary-600 mt-1">
                            Preview the template PDF and signature zones
                        </p>
                    </div>
                    <PDFViewerComplete
                        fileUrl={template.fileUrl}
                        zones={zones}
                        showZonesDefault={true}
                        maxHeight="500px"
                    />
                </Card>
            )}

            {/* Document Configuration */}
            <Card className="p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">
                    Document Configuration
                </h3>

                <div className="space-y-4">
                    {/* Document Title */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Document Title
                            <span className="text-secondary-500 font-normal ml-2">
                                (Optional - defaults to template name)
                            </span>
                        </label>
                        <Input
                            type="text"
                            placeholder={template.name}
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                        />
                        <p className="text-xs text-secondary-500 mt-1">
                            Leave empty to use template name: "{template.name}"
                        </p>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            Deadline
                            <span className="text-secondary-500 font-normal ml-2">
                                (Optional)
                            </span>
                        </label>
                        <Input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => onDeadlineChange(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        {deadline && (
                            <p className="text-xs text-secondary-500 mt-1">
                                Document will expire on {new Date(deadline).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
                <Button onClick={handleNext}>
                    Next: {template.signingMode === 'INDIVIDUAL' ? 'Select Recipients' : 'Assign Signers'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
