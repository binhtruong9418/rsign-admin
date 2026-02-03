import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Upload, FileText, X, Eye, Clock, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { showToast } from '@/lib/toast';
import { templatesAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { TemplateData, SigningFlow } from '@/types/template';

interface Step2UploadProps {
    templateData: TemplateData;
    updateTemplateData: (updates: Partial<TemplateData>) => void;
    onNext: () => void;
    onPrevious: () => void;
    isEditMode?: boolean;
}

export function Step2Upload({ templateData, updateTemplateData, onNext, onPrevious, isEditMode = false }: Step2UploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') {
            showToast.error('Please select a PDF file');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            showToast.error('File size must be less than 50MB');
            return;
        }

        // Clear previous validation error when new file is selected
        setValidationError(null);

        updateTemplateData({
            file,
            fileUrl: URL.createObjectURL(file),
        });

        showToast.success('Document selected successfully');
    }, [updateTemplateData]);

    const handleNext = useCallback(async () => {
        if (!templateData.file || !templateData.name.trim()) {
            showToast.error('Please select a file and enter a template name');
            return;
        }

        // Skip upload if in edit mode and file hasn't changed (placeholder file with size = 0)
        if (isEditMode && templateData.file.size === 0) {
            // File hasn't been changed, fileUrl is already set, just proceed
            onNext();
            return;
        }

        setIsUploading(true);
        setValidationError(null);

        try {
            // Step 1: Get presigned URL
            const uploadResponse = await templatesAPI.getUploadUrl({
                fileName: templateData.file.name,
            });

            // Step 2: Upload file to presigned URL
            await showToast.promise(
                templatesAPI.uploadFileToPresignedUrl(
                    uploadResponse.presignedUrl,
                    templateData.file
                ),
                {
                    loading: 'Uploading document...',
                    success: 'Document uploaded successfully!',
                    error: (err) => err?.error || 'Failed to upload document'
                }
            );

            // Step 3: Validate PDF file
            const validation = await showToast.promise(
                templatesAPI.validateFile(uploadResponse.fileUrl),
                {
                    loading: 'Validating PDF...',
                    success: 'PDF validation complete',
                    error: 'Failed to validate PDF'
                }
            );

            // Check validation result
            if (!validation.isValid) {
                const errorMessage = validation.detectedSource
                    ? `${validation.message}\n\nDetected source: ${validation.detectedSource}`
                    : validation.message;

                setValidationError(errorMessage);
                showToast.error('PDF validation failed');
                return;
            }

            // Update with validated fileUrl
            updateTemplateData({
                fileUrl: uploadResponse.fileUrl
            });

            // Proceed to next step
            onNext();
        } catch (error: any) {
            console.error('Upload/validation error:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'An error occurred';
            setValidationError(errorMsg);
        } finally {
            setIsUploading(false);
        }
    }, [templateData.file, templateData.name, updateTemplateData, onNext, isEditMode]);

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

    const canProceed = templateData.file && templateData.name.trim();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Upload Template Document</h2>
                <p className="text-secondary-600">Upload your PDF and provide template details.</p>
            </div>

            {/* Template Name */}
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Template Name *
                </label>
                <Input
                    type="text"
                    placeholder="e.g., Employment Contract Template"
                    value={templateData.name}
                    onChange={(e) => updateTemplateData({ name: e.target.value })}
                />
            </div>

            {/* Template Description */}
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Description (Optional)
                </label>
                <Textarea
                    placeholder="Describe this template and when to use it..."
                    value={templateData.description}
                    onChange={(e) => updateTemplateData({ description: e.target.value })}
                    rows={3}
                />
            </div>

            {/* Signing Flow Selection - Only for SHARED mode */}
            {templateData.signingMode === 'SHARED' && (
                <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-3">
                        Signing Flow *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => updateTemplateData({ signingFlow: 'PARALLEL' })}
                            className={cn(
                                'p-4 border-2 rounded-lg text-left transition-all hover:shadow-sm',
                                templateData.signingFlow === 'PARALLEL'
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-secondary-200 hover:border-primary-300'
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Zap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-secondary-900 mb-1">
                                        Parallel Signing
                                    </h4>
                                    <p className="text-sm text-secondary-600">
                                        All signers can sign at the same time in any order
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateTemplateData({ signingFlow: 'SEQUENTIAL' })}
                            className={cn(
                                'p-4 border-2 rounded-lg text-left transition-all hover:shadow-sm',
                                templateData.signingFlow === 'SEQUENTIAL'
                                    ? 'border-primary-600 bg-primary-50'
                                    : 'border-secondary-200 hover:border-primary-300'
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-secondary-900 mb-1">
                                        Sequential Signing
                                    </h4>
                                    <p className="text-sm text-secondary-600">
                                        Signers must sign in a specific order (approval workflow)
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Upload Document *
                </label>

                {!templateData.file ? (
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
                                    <p className="font-medium text-secondary-900">{templateData.file.name}</p>
                                    <p className="text-sm text-secondary-500">
                                        {templateData.file.size > 0
                                            ? `${(templateData.file.size / 1024 / 1024).toFixed(2)} MB`
                                            : 'Existing file'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {templateData.fileUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(templateData.fileUrl, '_blank')}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Preview
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        updateTemplateData({ file: null, fileUrl: '' });
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                            handleFileSelect(files[0]);
                        }
                    }}
                />
            </div>

            {/* Validation Error Display */}
            {validationError && (
                <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-red-900 mb-1">
                                Invalid PDF File
                            </h4>
                            <p className="text-sm text-red-700 whitespace-pre-line">
                                {validationError}
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                Please upload a native PDF document instead of a scanned or converted image.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Navigation */}
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
                    onClick={handleNext}
                    disabled={!canProceed || isUploading}
                    className="inline-flex items-center"
                >
                    Next: Define Signer Roles
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
