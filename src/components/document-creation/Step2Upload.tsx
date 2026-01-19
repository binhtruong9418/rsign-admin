import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Upload, FileText, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { documentsAPI } from '@/lib/api';
import type { DocumentData } from '@/types/document-creation';

interface Step2UploadProps {
    documentData: DocumentData;
    updateDocumentData: (updates: Partial<DocumentData>) => void;
    onNext: () => void;
    onPrevious: () => void;
}

export function Step2Upload({ documentData, updateDocumentData, onNext, onPrevious }: Step2UploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error('Please select a PDF file');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            toast.error('File size must be less than 50MB');
            return;
        }

        updateDocumentData({
            file,
            fileUrl: URL.createObjectURL(file),
        });

        toast.success('Document selected successfully');
    }, [updateDocumentData]);

    const handleNext = useCallback(async () => {
        if (!documentData.file || !documentData.title.trim()) {
            toast.error('Please select a file and enter a title');
            return;
        }

        setIsUploading(true);

        const uploadPromise = (async () => {
            const uploadResponse = await documentsAPI.uploadDocument({
                fileName: documentData.file!.name,
                purpose: 'DOCUMENT'
            });

            await documentsAPI.uploadFileToPresignedUrl(
                uploadResponse.presignedUrl,
                documentData.file!
            );

            updateDocumentData({
                fileUrl: uploadResponse.fileUrl
            });

            return uploadResponse;
        })();

        toast.promise(
            uploadPromise,
            {
                loading: 'Uploading document...',
                success: 'Document uploaded successfully!',
                error: (err) => err?.error || 'Failed to upload document'
            }
        );

        try {
            await uploadPromise;
            onNext();
        } catch (error: any) {
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    }, [documentData.file, documentData.title, updateDocumentData, onNext]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const canProceed = documentData.file && documentData.title.trim();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Upload Document</h2>
                <p className="text-secondary-600">Upload your PDF document and provide details.</p>
            </div>

            {/* Document Title */}
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Document Title *
                </label>
                <Input
                    type="text"
                    placeholder="e.g., Employment Contract 2024"
                    value={documentData.title}
                    onChange={(e) => updateDocumentData({ title: e.target.value })}
                />
            </div>

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Upload Document *
                </label>

                {!documentData.file ? (
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-primary-300 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
                        <p className="text-lg font-medium text-secondary-900 mb-2">
                            Drag & Drop PDF here
                        </p>
                        <p className="text-secondary-600 mb-4">or</p>
                        <Button variant="outline">Browse Files</Button>
                        <div className="mt-4 text-sm text-secondary-500">
                            <p>Supported: PDF only</p>
                            <p>Max size: 50MB</p>
                        </div>
                    </div>
                ) : (
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FileText className="h-8 w-8 text-primary-600 mr-3" />
                                <div>
                                    <p className="font-medium text-secondary-900">{documentData.file.name}</p>
                                    <p className="text-sm text-secondary-500">
                                        {(documentData.file.size / (1024 * 1024)).toFixed(1)} MB
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {documentData.fileUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(documentData.fileUrl, '_blank')}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Preview
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateDocumentData({ file: null, fileUrl: undefined })}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                />
            </div>

            {/* SHARED Mode Options */}
            {documentData.type === 'SHARED' && (
                <>
                    {/* Signing Flow */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Signing Order
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="signingFlow"
                                    value="PARALLEL"
                                    checked={documentData.signingFlow === 'PARALLEL'}
                                    onChange={(e) => updateDocumentData({ signingFlow: e.target.value as 'PARALLEL' })}
                                    className="mr-3"
                                />
                                <div>
                                    <span className="font-medium">Parallel</span>
                                    <p className="text-sm text-secondary-500">All signers can sign at the same time</p>
                                </div>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="signingFlow"
                                    value="SEQUENTIAL"
                                    checked={documentData.signingFlow === 'SEQUENTIAL'}
                                    onChange={(e) => updateDocumentData({ signingFlow: e.target.value as 'SEQUENTIAL' })}
                                    className="mr-3"
                                />
                                <div>
                                    <span className="font-medium">Sequential</span>
                                    <p className="text-sm text-secondary-500">Signers must sign in specific order</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Deadline (Optional)
                        </label>
                        <Input
                            type="date"
                            value={documentData.deadline || ''}
                            onChange={(e) => updateDocumentData({ deadline: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </>
            )}

            {/* INDIVIDUAL Mode Deadline */}
            {documentData.type === 'INDIVIDUAL' && (
                <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Deadline (Optional)
                    </label>
                    <Input
                        type="date"
                        value={documentData.deadline || ''}
                        onChange={(e) => updateDocumentData({ deadline: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!canProceed || isUploading}
                >
                    {isUploading
                        ? 'Uploading...'
                        : `Next: ${documentData.type === 'INDIVIDUAL' ? 'Recipients' : 'Signers'}`
                    }
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
