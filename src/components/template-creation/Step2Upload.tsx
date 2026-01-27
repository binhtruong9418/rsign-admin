import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Upload, FileText, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { showToast } from '@/lib/toast';
import { templatesAPI } from '@/lib/api';
import type { TemplateData } from '@/types/template';

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

    const handleFileSelect = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') {
            showToast.error('Please select a PDF file');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            showToast.error('File size must be less than 50MB');
            return;
        }

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

        const uploadPromise = (async () => {
            const uploadResponse = await templatesAPI.getUploadUrl({
                fileName: templateData.file!.name,
            });

            await templatesAPI.uploadFileToPresignedUrl(
                uploadResponse.presignedUrl,
                templateData.file!
            );

            updateTemplateData({
                fileUrl: uploadResponse.fileUrl
            });

            return uploadResponse;
        })();

        showToast.promise(
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
