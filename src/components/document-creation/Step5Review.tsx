import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Send, FileText, Users, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PDFErrorBoundary } from '@/components/ui/PDFErrorBoundary';
import { toast } from 'react-hot-toast';
import { documentsAPI } from '@/lib/api';
import { PDF_OPTIONS } from '@/lib/pdf-worker';
import type { DocumentData } from '@/types/document-creation';
import { buildCreateDocumentRequest } from '@/types/document-creation';
import { cn } from '@/lib/utils';

interface Step5ReviewProps {
    documentData: DocumentData;
    updateDocumentData: (updates: Partial<DocumentData>) => void;
    onPrevious: () => void;
}

export function Step5Review({ documentData, updateDocumentData, onPrevious }: Step5ReviewProps) {
    const [isSending, setIsSending] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [batchId, setBatchId] = useState<string>('');
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [scale, setScale] = useState(1.0);
    const navigate = useNavigate();

    const recipientCount = documentData.type === 'INDIVIDUAL'
        ? (documentData.selectedGroup?.memberCount || documentData.recipients.length)
        : documentData.signers.length;

    const handleSend = async () => {
        setIsSending(true);

        const createPromise = (async () => {
            // Build request with sendImmediately: true for send action
            const request = buildCreateDocumentRequest(documentData, true);
            console.log('Creating and sending document with request:', request);

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
                loading: 'Creating and sending documents...',
                success: `Document${documentData.type === 'INDIVIDUAL' ? 's' : ''} created and sent successfully!`,
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
        setIsSending(true);

        const createPromise = (async () => {
            // Build request with sendImmediately: false for draft action
            const request = buildCreateDocumentRequest(documentData, false);
            console.log('Saving document as draft with request:', request);

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
                loading: 'Saving draft...',
                success: `Draft saved successfully!`,
                error: (err) => err?.error || err?.message || 'Failed to save draft'
            }
        );

        try {
            await createPromise;
            setIsComplete(true);
        } catch (error: any) {
            console.error('Failed to save draft:', error);
        } finally {
            setIsSending(false);
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
                    👥 {documentData.type === 'INDIVIDUAL' ? 'Recipients' : 'Signers & Workflow'}
                </h3>

                {documentData.type === 'INDIVIDUAL' ? (
                    <div className="space-y-4">
                        {documentData.selectedGroup ? (
                            <div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <div className="font-semibold text-blue-900">{documentData.selectedGroup.name}</div>
                                            <div className="text-xs text-blue-600">{documentData.selectedGroup.memberCount} members will receive individual documents</div>
                                        </div>
                                    </div>
                                    <Badge variant="primary">{documentData.selectedGroup.memberCount} recipients</Badge>
                                </div>
                                
                                <div className="space-y-2 pl-4 border-l-2 border-secondary-200">
                                    <div className="text-sm font-medium text-secondary-700 mb-2">Group Members:</div>
                                    {documentData.selectedGroup.members.map((member, index) => (
                                        <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-secondary-50 rounded">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-secondary-900">{member.name}</div>
                                                <div className="text-xs text-secondary-500">{member.email}</div>
                                            </div>
                                            <Check className="h-4 w-4 text-green-600" />
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-3 p-3 bg-secondary-50 rounded-lg text-sm text-secondary-600">
                                    <strong>Note:</strong> Each member will receive their own copy of the document with {documentData.signatureZones.length} signature zone{documentData.signatureZones.length > 1 ? 's' : ''}.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-secondary-700 mb-2">Individual Recipients ({documentData.recipients.length}):</div>
                                {documentData.recipients.map((recipient, index) => (
                                    <div key={recipient.id} className="flex items-center gap-3 p-2 hover:bg-secondary-50 rounded">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-secondary-900">{recipient.name}</div>
                                            <div className="text-xs text-secondary-500">{recipient.email}</div>
                                        </div>
                                        <Check className="h-4 w-4 text-green-600" />
                                    </div>
                                ))}
                                
                                <div className="mt-3 p-3 bg-secondary-50 rounded-lg text-sm text-secondary-600">
                                    <strong>Note:</strong> Each recipient will receive their own copy with {documentData.signatureZones.length} signature zone{documentData.signatureZones.length > 1 ? 's' : ''}.
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Signing Flow Info */}
                        <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                            <FileText className="h-5 w-5 text-secondary-600" />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-secondary-900">
                                    {documentData.signingFlow === 'PARALLEL' ? 'Parallel Signing' : 'Sequential Signing'}
                                </div>
                                <div className="text-xs text-secondary-600">
                                    {documentData.signingFlow === 'PARALLEL' 
                                        ? 'All signers can sign simultaneously' 
                                        : 'Signers must sign in order, step by step'
                                    }
                                </div>
                            </div>
                            <Badge>{documentData.signers.length} signer{documentData.signers.length > 1 ? 's' : ''}</Badge>
                        </div>

                        {documentData.signingFlow === 'SEQUENTIAL' ? (
                            // Sequential mode - detailed step breakdown
                            <div className="space-y-3">
                                <div className="text-sm font-medium text-secondary-700">Signing Steps:</div>
                                {documentData.signingSteps.map(step => (
                                    <div key={step.stepOrder} className="border border-secondary-200 rounded-lg overflow-hidden">
                                        <div className="bg-secondary-100 px-4 py-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
                                                    {step.stepOrder}
                                                </div>
                                                <span className="font-semibold text-secondary-900">Step {step.stepOrder}</span>
                                            </div>
                                            <Badge variant="secondary">{step.signerIds.length} signer{step.signerIds.length > 1 ? 's' : ''}</Badge>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {step.signerIds.map(signerId => {
                                                const signer = documentData.signers.find(s => s.id === signerId);
                                                if (!signer) return null;

                                                const signerZones = documentData.signatureZones.filter(z => z.signerId === signerId);
                                                const zonesCount = signerZones.length;

                                                return (
                                                    <div key={signerId} className="flex items-center gap-3 p-2 bg-white border border-secondary-100 rounded hover:bg-secondary-50">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                            style={{ backgroundColor: signer.color }}
                                                        >
                                                            {signer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-secondary-900">{signer.name}</div>
                                                            <div className="text-xs text-secondary-500">{signer.email}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-medium text-secondary-700">{zonesCount} zone{zonesCount > 1 ? 's' : ''}</div>
                                                            <div className="text-xs text-secondary-500">
                                                                {signerZones.map(z => `P${z.page}`).join(', ')}
                                                            </div>
                                                        </div>
                                                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Parallel mode - all signers list
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-secondary-700 mb-2">All Signers (can sign simultaneously):</div>
                                {documentData.signers.map((signer, index) => {
                                    const signerZones = documentData.signatureZones.filter(z => z.signerId === signer.id);
                                    const zonesCount = signerZones.length;

                                    return (
                                        <div key={signer.id} className="flex items-center gap-3 p-3 bg-white border border-secondary-200 rounded hover:bg-secondary-50">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary-200 text-secondary-700 text-xs font-semibold">
                                                {index + 1}
                                            </div>
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: signer.color }}
                                            >
                                                {signer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-secondary-900">{signer.name}</div>
                                                <div className="text-xs text-secondary-500">{signer.email}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-medium text-secondary-700">{zonesCount} zone{zonesCount > 1 ? 's' : ''}</div>
                                                <div className="text-xs text-secondary-500">
                                                    {signerZones.map(z => `P${z.page}`).join(', ')}
                                                </div>
                                            </div>
                                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Document Preview with Signature Zones */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-secondary-900">
                        📄 Document Preview with Signature Zones
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPdfPreview(!showPdfPreview)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPdfPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                </div>

                {showPdfPreview ? (
                    <PDFErrorBoundary>
                        <div className="space-y-4">
                            {/* PDF Controls */}
                            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
                                        disabled={previewPage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium px-3">
                                        Page {previewPage} of {numPages || '-'}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPreviewPage(Math.min(numPages || 1, previewPage + 1))}
                                        disabled={previewPage >= (numPages || 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                        disabled={scale <= 0.5}
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium w-16 text-center">
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setScale(Math.min(1.5, scale + 0.1))}
                                        disabled={scale >= 1.5}
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* PDF Viewer with Zones */}
                            <div className="relative bg-secondary-100 rounded-lg overflow-auto" style={{ maxHeight: '600px' }}>
                                <div className="flex justify-center p-4">
                                    <div className="relative inline-block">
                                        <Document
                                            file={documentData.fileUrl}
                                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                            options={PDF_OPTIONS}
                                            loading={
                                                <div className="flex items-center justify-center h-96">
                                                    <div className="text-center">
                                                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
                                                        <p className="text-secondary-600 font-medium">Loading preview...</p>
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <Page
                                                pageNumber={previewPage}
                                                scale={scale}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        </Document>

                                        {/* Signature Zones Overlay */}
                                        {documentData.signatureZones
                                            .filter(zone => zone.page === previewPage)
                                            .map(zone => {
                                                const signer = documentData.type === 'INDIVIDUAL'
                                                    ? { name: 'Recipient', color: '#3B82F6' }
                                                    : documentData.signers.find(s => s.id === zone.signerId);

                                                if (!signer) return null;

                                                // Note: These are approximate positions for preview
                                                // Actual rendering will use canvas dimensions
                                                return (
                                                    <div
                                                        key={zone.id}
                                                        className="absolute border-2 border-dashed pointer-events-none"
                                                        style={{
                                                            borderColor: signer.color,
                                                            backgroundColor: `${signer.color}20`,
                                                            left: `${zone.x * scale}%`,
                                                            top: `${zone.y * scale}%`,
                                                            width: `${zone.width * scale}%`,
                                                            height: `${zone.height * scale}%`,
                                                        }}
                                                    >
                                                        <div
                                                            className="text-xs px-2 py-1 text-white font-medium truncate"
                                                            style={{ backgroundColor: signer.color }}
                                                        >
                                                            {signer.name}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>

                            {/* Zones Legend for current page */}
                            {documentData.signatureZones.filter(z => z.page === previewPage).length > 0 && (
                                <div className="p-3 bg-secondary-50 rounded-lg">
                                    <div className="text-xs font-medium text-secondary-700 mb-2">
                                        Zones on this page ({documentData.signatureZones.filter(z => z.page === previewPage).length}):
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {documentData.signatureZones
                                            .filter(z => z.page === previewPage)
                                            .map(zone => {
                                                const signer = documentData.type === 'INDIVIDUAL'
                                                    ? { name: 'Recipient', color: '#3B82F6' }
                                                    : documentData.signers.find(s => s.id === zone.signerId);
                                                if (!signer) return null;
                                                return (
                                                    <div key={zone.id} className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-secondary-200">
                                                        <div className="w-3 h-3 rounded" style={{ backgroundColor: signer.color }} />
                                                        <span className="text-xs text-secondary-700">{signer.name}</span>
                                                        <span className="text-xs text-secondary-500">• {zone.label || 'Signature'}</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </PDFErrorBoundary>
                ) : (
                    <div className="text-center py-8 text-secondary-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-secondary-300" />
                        <p className="text-sm">Click "Show Preview" to view document with signature zones</p>
                        <p className="text-xs mt-1">{documentData.signatureZones.length} signature zone{documentData.signatureZones.length > 1 ? 's' : ''} placed across {numPages || '?'} page{(numPages || 0) > 1 ? 's' : ''}</p>
                    </div>
                )}
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
