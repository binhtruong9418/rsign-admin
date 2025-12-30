import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    FileText,
    Users,
    Send,
} from 'lucide-react';
import { templatesAPI, usersAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import type { User } from '@/types';

interface SignerAssignment {
    stepOrder: number;
    userId: string;
    zoneIndex: number;
    zoneName: string;
}

export default function TemplateUse() {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [signerAssignments, setSignerAssignments] = useState<
        SignerAssignment[]
    >([]);
    const [submitting, setSubmitting] = useState(false);

    // Fetch template details
    const { data: template, isLoading: templateLoading } = useQuery({
        queryKey: ['template', templateId],
        queryFn: () => templatesAPI.getTemplate(templateId!),
        enabled: !!templateId,
    });

    // Fetch users for assignment
    const { data: usersData } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersAPI.getUsers({ page: 0, limit: 1000 }),
    });

    const users = usersData?.items || [];

    // Initialize signer assignments based on template structure
    useEffect(() => {
        if (!template || signerAssignments.length > 0) return;

        const assignments: SignerAssignment[] = [];

        template.signingSteps?.forEach((step) => {
            // For each step, create assignments for each signature zone
            const stepZones = template.signatureZones?.filter(
                (zone) => zone.assignedTo?.id // Zones that were assigned in template
            ) || [];

            for (let i = 0; i < (step.totalSigners || 0); i++) {
                const zone = stepZones[i];
                assignments.push({
                    stepOrder: step.stepOrder,
                    userId: '',
                    zoneIndex: i,
                    zoneName: zone?.label || `Signature ${i + 1}`,
                });
            }
        });

        setSignerAssignments(assignments);
    }, [template, signerAssignments.length]);

    // Group assignments by step
    const assignmentsByStep = useMemo(() => {
        const grouped = new Map<number, SignerAssignment[]>();
        signerAssignments.forEach((assignment) => {
            const existing = grouped.get(assignment.stepOrder) || [];
            existing.push(assignment);
            grouped.set(assignment.stepOrder, existing);
        });
        return grouped;
    }, [signerAssignments]);

    const handleAssignmentChange = (
        stepOrder: number,
        zoneIndex: number,
        userId: string
    ) => {
        setSignerAssignments((prev) =>
            prev.map((assignment) =>
                assignment.stepOrder === stepOrder &&
                assignment.zoneIndex === zoneIndex
                    ? { ...assignment, userId }
                    : assignment
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Please enter a document title');
            return;
        }

        // Validate all signers are assigned
        const unassigned = signerAssignments.filter((a) => !a.userId);
        if (unassigned.length > 0) {
            toast.error('Please assign all signers');
            return;
        }

        setSubmitting(true);

        try {
            // Build signing steps from assignments
            const signingSteps = Array.from(assignmentsByStep.entries()).map(
                ([stepOrder, assignments]) => ({
                    stepOrder,
                    signers: assignments.map((a) => ({
                        userId: a.userId,
                        zoneIndex: a.zoneIndex,
                    })),
                })
            );

            const result = await templatesAPI.createFromTemplate(templateId!, {
                title: title.trim(),
                deadline: deadline || undefined,
                signingSteps,
            });

            toast.success('Document created successfully from template!');
            navigate(`/admin/documents/${result.document.id}`);
        } catch (error: any) {
            toast.error(error.error || 'Failed to create document from template');
        } finally {
            setSubmitting(false);
        }
    };

    if (templateLoading) {
        return <TemplateUseSkeleton />;
    }

    if (!template) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Template not found. Please try again.
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate('/admin/templates')}
                    className="mt-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Templates
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/admin/templates')}
                    className="flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Templates
                </button>
                <h1 className="text-2xl font-bold text-secondary-900">
                    Create Document from Template
                </h1>
                <p className="text-secondary-600 mt-1">
                    Using template:{' '}
                    <strong>{template.templateName || template.title}</strong>
                </p>
            </div>

            {/* Template Info */}
            <div className="card p-6 bg-primary-50 border-primary-200">
                <h3 className="font-medium text-secondary-900 mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Template Structure
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-secondary-600">Signing Mode</span>
                        <p className="font-medium text-secondary-900">
                            {template.signingMode}
                        </p>
                    </div>
                    <div>
                        <span className="text-secondary-600">Signing Flow</span>
                        <p className="font-medium text-secondary-900">
                            {template.signingFlow}
                        </p>
                    </div>
                    <div>
                        <span className="text-secondary-600">Steps</span>
                        <p className="font-medium text-secondary-900">
                            {template.totalSteps}
                        </p>
                    </div>
                    <div>
                        <span className="text-secondary-600">Signature Zones</span>
                        <p className="font-medium text-secondary-900">
                            {template.signatureZones?.length || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Document Details */}
                <div className="card p-6">
                    <h3 className="font-medium text-secondary-900 mb-4">
                        Document Details
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
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
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Deadline (Optional)
                            </label>
                            <Input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Signer Assignments */}
                <div className="card p-6">
                    <h3 className="font-medium text-secondary-900 mb-4 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Assign Signers
                    </h3>

                    <div className="space-y-6">
                        {template.signingSteps?.map((step) => {
                            const stepAssignments =
                                assignmentsByStep.get(step.stepOrder) || [];

                            return (
                                <div
                                    key={step.id}
                                    className="border border-secondary-200 rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-secondary-900">
                                            Step {step.stepOrder}
                                        </h4>
                                        <Badge variant="secondary">
                                            {step.totalSigners} signer
                                            {step.totalSigners !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {stepAssignments.map((assignment) => (
                                            <div
                                                key={`${assignment.stepOrder}-${assignment.zoneIndex}`}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="flex-1">
                                                    <label className="block text-xs text-secondary-600 mb-1">
                                                        {assignment.zoneName}
                                                    </label>
                                                    <Select
                                                        value={assignment.userId}
                                                        onChange={(e) =>
                                                            handleAssignmentChange(
                                                                assignment.stepOrder,
                                                                assignment.zoneIndex,
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                        placeholder="Select User"
                                                        options={users.map((user: User) => ({
                                                            value: user.id,
                                                            label: `${user.fullName} (${user.email})`,
                                                        }))}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/admin/templates')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        <Send className="h-4 w-4 mr-2" />
                        {submitting ? 'Creating...' : 'Create Document'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function TemplateUseSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
            <div>
                <div className="h-4 bg-secondary-200 rounded w-32 mb-4"></div>
                <div className="h-8 bg-secondary-200 rounded w-96 mb-2"></div>
                <div className="h-4 bg-secondary-200 rounded w-64"></div>
            </div>

            <div className="card p-6">
                <div className="h-6 bg-secondary-200 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}>
                            <div className="h-3 bg-secondary-200 rounded w-20 mb-2"></div>
                            <div className="h-4 bg-secondary-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card p-6">
                <div className="h-6 bg-secondary-200 rounded w-48 mb-4"></div>
                <div className="space-y-4">
                    <div>
                        <div className="h-4 bg-secondary-200 rounded w-32 mb-2"></div>
                        <div className="h-10 bg-secondary-200 rounded"></div>
                    </div>
                    <div>
                        <div className="h-4 bg-secondary-200 rounded w-24 mb-2"></div>
                        <div className="h-10 bg-secondary-200 rounded"></div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="h-10 bg-secondary-200 rounded w-24"></div>
                <div className="h-10 bg-secondary-200 rounded w-32"></div>
            </div>
        </div>
    );
}
