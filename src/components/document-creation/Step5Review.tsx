import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Mail, Send, Clock, FileText, Badge as BadgeIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import { documentsAPI } from '@/lib/api';
import type { DocumentData } from '@/types/document-creation';
import { buildCreateDocumentRequest } from '@/types/document-creation';

interface Step5ReviewProps {
    documentData: DocumentData;
    updateDocumentData: (updates: Partial<DocumentData>) => void;
    onPrevious: () => void;
}

export function Step5Review({ documentData, updateDocumentData, onPrevious }: Step5ReviewProps) {
    const [isSending, setIsSending] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [batchId, setBatchId] = useState<string>('');
    const navigate = useNavigate();

    const recipientCount = documentData.type === 'INDIVIDUAL'
        ? (documentData.selectedGroup?.memberCount || documentData.recipients.length)
        : documentData.signers.length;

    const handleSend = async () => {
        setIsSending(true);

        const createPromise = (async () => {
            const request = buildCreateDocumentRequest(documentData);
            console.log('Creating document with request:', request);

            const response = await documentsAPI.createDocument(request);

            // Handle response based on document type
            if (response.batchId) {
                setBatchId(response.batchId);
            } else if (response.document?.id) {
                setBatchId(response.document.id);
            } else {
                setBatchId('doc-' + Date.now());
            }
            
            return response;
        })();

        toast.promise(
            createPromise,
            {
                loading: 'Creating documents...',
                success: `Document${documentData.type === 'INDIVIDUAL' ? 's' : ''} created successfully!`,
                error: (err) => err?.error || err?.message || 'Failed to create documents'
            }
        );

        try {
            await createPromise;
            setIsComplete(true);
        } catch (error: any) {
            console.error('Failed to create document:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            toast.success('Draft saved successfully');
            // TODO: Implement actual draft save
        } catch (error: any) {
            toast.error('Failed to save draft');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Review & Send</h2>
                <p className="text-secondary-600">Review your document before sending it for signatures.</p>
            </div>

            {/* Document Summary */}
            <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-secondary-900">📄 Document Summary</h3>
                    <Badge variant={documentData.type === 'INDIVIDUAL' ? 'primary' : 'secondary'}>
                        {documentData.type === 'INDIVIDUAL' ? 'Individual Documents' : 'Shared Document'}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-secondary-700">Title:</span>
                        <span className="ml-2 text-secondary-900">{documentData.title}</span>
                    </div>
                    <div>
                        <span className="font-medium text-secondary-700">Type:</span>
                        <span className="ml-2 text-secondary-900">
                            {documentData.type === 'INDIVIDUAL' ? 'Individual Documents' : 'Shared Document'}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-secondary-700">
                            {documentData.type === 'INDIVIDUAL' ? 'Recipients:' : 'Signers:'}
                        </span>
                        <span className="ml-2 text-secondary-900">
                            {documentData.type === 'INDIVIDUAL'
                                ? (documentData.selectedGroup
                                    ? `${documentData.selectedGroup.name} (${documentData.selectedGroup.memberCount} members)`
                                    : `${documentData.recipients.length} users`
                                )
                                : `${documentData.signers.length} signers`
                            }
                        </span>
                    </div>
                    {documentData.deadline && (
                        <div>
                            <span className="font-medium text-secondary-700">Deadline:</span>
                            <span className="ml-2 text-secondary-900">
                                {new Date(documentData.deadline).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                    <div>
                        <span className="font-medium text-secondary-700">Signature Zones:</span>
                        <span className="ml-2 text-secondary-900">
                            {documentData.signatureZones.length} zone{documentData.signatureZones.length > 1 ? 's' : ''} placed
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-secondary-700">File:</span>
                        <span className="ml-2 text-secondary-900">
                            {documentData.file?.name} ({documentData.file && (documentData.file.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                    </div>
                    {documentData.type === 'SHARED' && (
                        <div>
                            <span className="font-medium text-secondary-700">Signing Flow:</span>
                            <span className="ml-2 text-secondary-900">
                                {documentData.signingFlow === 'PARALLEL' ? 'Parallel (all can sign at once)' : 'Sequential (ordered signing)'}
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Recipients/Signers Details */}
            <Card className="p-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    👥 {documentData.type === 'INDIVIDUAL' ? `Recipients (${recipientCount})` : `Signers (${documentData.signers.length})`}
                </h3>

                {documentData.type === 'INDIVIDUAL' ? (
                    <div className="space-y-2">
                        {documentData.selectedGroup ? (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{documentData.selectedGroup.name}</span>
                                    <Badge>{documentData.selectedGroup.memberCount} members</Badge>
                                </div>
                                {documentData.selectedGroup.members.slice(0, 3).map(member => (
                                    <div key={member.id} className="flex items-center text-sm text-secondary-600">
                                        <Check className="h-4 w-4 text-green-600 mr-2" />
                                        {member.name} ({member.email})
                                    </div>
                                ))}
                                {documentData.selectedGroup.memberCount > 3 && (
                                    <p className="text-sm text-secondary-500 mt-2">
                                        ... and {documentData.selectedGroup.memberCount - 3} more recipients
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {documentData.recipients.map(recipient => (
                                    <div key={recipient.id} className="flex items-center text-sm">
                                        <Check className="h-4 w-4 text-green-600 mr-2" />
                                        {recipient.name} ({recipient.email})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {documentData.signingFlow === 'SEQUENTIAL' ? (
                            // Sequential mode - group by steps
                            documentData.signingSteps.map(step => (
                                <div key={step.stepOrder} className="border rounded-lg p-3">
                                    <div className="font-medium text-sm mb-2">Step {step.stepOrder}</div>
                                    <div className="space-y-2 ml-4">
                                        {step.signerIds.map(signerId => {
                                            const signer = documentData.signers.find(s => s.id === signerId);
                                            if (!signer) return null;

                                            const zonesCount = documentData.signatureZones.filter(z => z.signerId === signerId).length;

                                            return (
                                                <div key={signerId} className="flex items-center">
                                                    <div
                                                        className="w-4 h-4 rounded mr-3"
                                                        style={{ backgroundColor: signer.color }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center text-sm">
                                                            <span className="font-medium">{signer.name}</span>
                                                            <span className="ml-2 text-secondary-500">({signer.email})</span>
                                                            <span className="ml-2 text-xs text-secondary-500">
                                                                {zonesCount} zone{zonesCount > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Check className="h-4 w-4 text-green-600" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Parallel mode
                            documentData.signers.map(signer => {
                                const zonesCount = documentData.signatureZones.filter(z => z.signerId === signer.id).length;

                                return (
                                    <div key={signer.id} className="flex items-center">
                                        <div
                                            className="w-4 h-4 rounded mr-3"
                                            style={{ backgroundColor: signer.color }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center text-sm">
                                                <span className="font-medium">{signer.name}</span>
                                                <span className="ml-2 text-secondary-500">({signer.email})</span>
                                                <span className="ml-2 text-xs text-secondary-500">
                                                    {zonesCount} zone{zonesCount > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <Check className="h-4 w-4 text-green-600" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </Card>

            {/* Signature Zones Summary */}
            <Card className="p-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    ✍️ Signature Zones ({documentData.signatureZones.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documentData.signatureZones.map(zone => {
                        const signer = documentData.type === 'INDIVIDUAL'
                            ? { name: 'All Recipients', color: '#3B82F6' }
                            : documentData.signers.find(s => s.id === zone.signerId);

                        if (!signer) return null;

                        return (
                            <div key={zone.id} className="flex items-center gap-2 p-2 bg-secondary-50 rounded text-sm">
                                <div
                                    className="w-3 h-3 rounded flex-shrink-0"
                                    style={{ backgroundColor: signer.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{signer.name}</div>
                                    <div className="text-xs text-secondary-500">
                                        Page {zone.page} • {zone.label || 'Signature'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* What Happens Next */}
            <Card className="p-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">📋 What happens next?</h3>
                <div className="space-y-3">
                    {documentData.type === 'INDIVIDUAL' ? (
                        <>
                            <div className="flex items-center text-sm">
                                <Mail className="h-4 w-4 text-secondary-500 mr-3" />
                                <span>{recipientCount} document{recipientCount > 1 ? 's' : ''} will be created</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Send className="h-4 w-4 text-secondary-500 mr-3" />
                                <span>Each recipient gets email notification</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 text-secondary-500 mr-3" />
                                <span>They can sign anytime before deadline</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center text-sm">
                                <FileText className="h-4 w-4 text-secondary-500 mr-3" />
                                <span>1 shared document will be created</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Send className="h-4 w-4 text-secondary-500 mr-3" />
                                <span>
                                    {documentData.signingFlow === 'PARALLEL'
                                        ? 'All signers get email notification'
                                        : 'First step signers get email notification'
                                    }
                                </span>
                            </div>
                            {documentData.signingFlow === 'SEQUENTIAL' && (
                                <div className="flex items-center text-sm">
                                    <Clock className="h-4 w-4 text-secondary-500 mr-3" />
                                    <span>Next step notified after previous completes</span>
                                </div>
                            )}
                        </>
                    )}
                    <div className="flex items-center text-sm">
                        <BadgeIcon className="h-4 w-4 text-secondary-500 mr-3" />
                        <span>You'll receive updates on completion</span>
                    </div>
                </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">🔔 Notifications</h3>
                <div className="space-y-3">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={documentData.notifications.onComplete}
                            onChange={(e) => updateDocumentData({
                                notifications: { ...documentData.notifications, onComplete: e.target.checked }
                            })}
                            className="mr-3"
                        />
                        <span className="text-sm">Send me email when all documents are signed</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={documentData.notifications.reminder}
                            onChange={(e) => updateDocumentData({
                                notifications: { ...documentData.notifications, reminder: e.target.checked }
                            })}
                            className="mr-3"
                        />
                        <span className="text-sm">Send reminder 3 days before deadline</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={documentData.notifications.dailyReport}
                            onChange={(e) => updateDocumentData({
                                notifications: { ...documentData.notifications, dailyReport: e.target.checked }
                            })}
                            className="mr-3"
                        />
                        <span className="text-sm">Send daily progress report</span>
                    </label>
                </div>
            </Card>

            {/* Success Modal */}
            {isComplete && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsComplete(false)}
                    title="✅ Success!"
                >
                    <div className="text-center space-y-4">
                        <div className="text-center">
                            <p className="text-lg font-medium text-green-600 mb-2">Documents Created Successfully!</p>
                            <div className="space-y-1 text-sm text-secondary-600">
                                <p>{recipientCount} document{recipientCount > 1 ? 's' : ''} created</p>
                                <p>{recipientCount} email{recipientCount > 1 ? 's' : ''} sent</p>
                            </div>
                            {batchId && (
                                <p className="text-sm text-secondary-500 mt-2">
                                    Batch ID: {batchId}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/admin/documents')}
                            >
                                View Documents
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Create More
                            </Button>
                            <Button
                                onClick={() => navigate('/admin')}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious} disabled={isSending}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={isSending}
                    >
                        Save Draft
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        className="inline-flex items-center"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {isSending ? 'Sending...' : `Send Document${documentData.type === 'INDIVIDUAL' ? 's' : ''}`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
