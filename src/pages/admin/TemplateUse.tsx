import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    FileText,
    Users,
    Send,
    Loader2,
} from 'lucide-react';
import { templatesAPI, usersAPI, signerGroupsAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { showToast } from '@/lib/toast';
import type { User } from '@/types';

interface SignerAssignment {
    roleIndex: number;
    roleName: string;
    userId: string;
}

export default function TemplateUse() {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [signerAssignments, setSignerAssignments] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');

    // Fetch template details
    const { data: template, isLoading: templateLoading } = useQuery({
        queryKey: ['template', templateId],
        queryFn: () => templatesAPI.getTemplate(templateId!),
        enabled: !!templateId,
    });

    // Fetch users for assignment
    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersAPI.getUsers({ limit: 1000 }),
    });

    // Fetch signer groups
    const { data: groupsData } = useQuery({
        queryKey: ['signer-groups'],
        queryFn: () => signerGroupsAPI.getSignerGroups({ limit: 1000 }),
    });

    const users = usersData?.items || [];
    const groups = groupsData?.items || [];

    const handleAssignmentChange = (roleIndex: number, userId: string) => {
        setSignerAssignments(prev => ({
            ...prev,
            [roleIndex]: userId
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            showToast.error('Please enter a document title');
            return;
        }

        if (!template) {
            showToast.error('Template not loaded');
            return;
        }

        // Validate all signers are assigned
        const requiredAssignments = template.signers?.length || 0;
        const completedAssignments = Object.keys(signerAssignments).length;

        if (completedAssignments < requiredAssignments) {
            showToast.error('Please assign all signer roles');
            return;
        }

        setSubmitting(true);

        try {
            // Build request based on template structure
            const request: any = {
                title: title.trim(),
                deadline: deadline || undefined,
            };

            if (template.signingMode === 'INDIVIDUAL') {
                // For INDIVIDUAL mode, pass recipientIds
                const recipientIds = Object.values(signerAssignments);
                request.recipientIds = recipientIds;
            } else {
                // For SHARED mode, pass signers with role mapping
                request.signers = template.signers?.map((signer, index) => ({
                    userId: signerAssignments[index],
                }));
            }

            const createPromise = templatesAPI.createDocumentFromTemplate(templateId!, request);

            showToast.promise(
                createPromise,
                {
                    loading: 'Creating document from template...',
                    success: 'Document created successfully!',
                    error: (err) => err?.error || 'Failed to create document'
                }
            );

            const result = await createPromise;
            navigate(`/admin/documents/${result.id}`);
        } catch (error: any) {
            console.error('Failed to create document:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (templateLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent mb-4"></div>
                    <p className="text-secondary-600">Loading template...</p>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Template not found</p>
                    <Button onClick={() => navigate('/admin/templates')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Templates
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/admin/templates/${templateId}`)}
                        className="flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Template
                    </button>
                    <h1 className="text-3xl font-bold text-secondary-900">
                        Create Document from Template
                    </h1>
                    <p className="text-secondary-600 mt-2">
                        Using template: <strong>{template.name}</strong>
                    </p>
                </div>

                {/* Template Info */}
                <Card className="p-6 mb-6 bg-primary-50 border-primary-200">
                    <h3 className="font-semibold text-secondary-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Template Structure
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-secondary-600 block mb-1">Signing Mode</span>
                            <Badge variant="default">
                                {template.signingMode === 'INDIVIDUAL' ? 'Individual' : 'Shared'}
                            </Badge>
                        </div>
                        {template.signingMode === 'SHARED' && (
                            <div>
                                <span className="text-secondary-600 block mb-1">Signing Flow</span>
                                <Badge variant="secondary">
                                    {template.signingFlow === 'PARALLEL' ? 'Parallel' : 'Sequential'}
                                </Badge>
                            </div>
                        )}
                        <div>
                            <span className="text-secondary-600 block mb-1">Signer Roles</span>
                            <p className="font-medium text-secondary-900">
                                {template.signers?.length || 0}
                            </p>
                        </div>
                        <div>
                            <span className="text-secondary-600 block mb-1">Signature Zones</span>
                            <p className="font-medium text-secondary-900">
                                {template.signatureZones?.length || 0}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Document Details */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-secondary-900 mb-4">
                            Document Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Document Title *
                                </label>
                                <Input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Employment Contract - John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Deadline (Optional)
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Signer Assignments */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-secondary-900 mb-4 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Assign {template.signingMode === 'INDIVIDUAL' ? 'Recipients' : 'Signers'}
                        </h3>

                        {template.signingMode === 'INDIVIDUAL' ? (
                            <div className="space-y-4">
                                <p className="text-sm text-secondary-600">
                                    Select users who will receive individual copies of this document.
                                </p>
                                {template.signers?.map((signer, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                                            {signer.role} {signer.description && `(${signer.description})`}
                                        </label>
                                        <Select
                                            value={signerAssignments[index] || ''}
                                            onChange={(e) => handleAssignmentChange(index, e.target.value)}
                                            required
                                            placeholder="Select users"
                                            options={users.map((user: User) => ({
                                                value: user.id,
                                                label: `${user.fullName} (${user.email})`,
                                            }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : template.signingFlow === 'PARALLEL' ? (
                            <div className="space-y-4">
                                <p className="text-sm text-secondary-600">
                                    All signers will receive the document at the same time.
                                </p>
                                {template.signers?.map((signer, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded flex items-center justify-center text-white font-medium flex-shrink-0 mt-7"
                                            style={{ backgroundColor: signer.color }}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                {signer.role} {signer.description && `(${signer.description})`}
                                            </label>
                                            <Select
                                                value={signerAssignments[index] || ''}
                                                onChange={(e) => handleAssignmentChange(index, e.target.value)}
                                                required
                                                placeholder="Select user"
                                                options={users.map((user: User) => ({
                                                    value: user.id,
                                                    label: `${user.fullName} (${user.email})`,
                                                }))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <p className="text-sm text-secondary-600">
                                    Signers must sign in sequential order. Each step must be completed before the next begins.
                                </p>
                                {template.signingSteps?.map((step, stepIndex) => (
                                    <Card key={stepIndex} className="p-4 border border-secondary-200">
                                        <div className="font-medium text-secondary-900 mb-3">
                                            Step {step.stepNumber}
                                        </div>
                                        <div className="space-y-3">
                                            {step.signers.map((signer, signerIndex) => {
                                                const globalIndex = template.signers?.findIndex(s => s.role === signer.role) || 0;
                                                return (
                                                    <div key={signerIndex} className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mt-7"
                                                            style={{ backgroundColor: signer.color }}>
                                                            {signerIndex + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                                {signer.role} {signer.description && `(${signer.description})`}
                                                            </label>
                                                            <Select
                                                                value={signerAssignments[globalIndex] || ''}
                                                                onChange={(e) => handleAssignmentChange(globalIndex, e.target.value)}
                                                                required
                                                                placeholder="Select user"
                                                                options={users.map((user: User) => ({
                                                                    value: user.id,
                                                                    label: `${user.fullName} (${user.email})`,
                                                                }))}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(`/admin/templates/${templateId}`)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating Document...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Create Document
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
