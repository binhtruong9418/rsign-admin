import { useState } from 'react';
import { ArrowLeft, Send, FileText, Users, Calendar, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { User, SignerGroup } from '@/types';

interface TemplateUseStep3ReviewProps {
    template: any;
    title: string;
    deadline: string;
    selectedUserIds: string[];
    selectedGroupId?: string;
    roleAssignments: Record<string, string>;
    users: User[];
    groups: SignerGroup[];
    onPrevious: () => void;
    onSubmit: (sendImmediately: boolean) => Promise<void>;
}

export function TemplateUseStep3Review({
    template,
    title,
    deadline,
    selectedUserIds,
    selectedGroupId,
    roleAssignments,
    users,
    groups,
    onPrevious,
    onSubmit
}: TemplateUseStep3ReviewProps) {
    const [submitting, setSubmitting] = useState(false);
    const [sendImmediately, setSendImmediately] = useState(true);

    const isIndividualMode = template.signingMode === 'INDIVIDUAL';
    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    // Calculate recipients for INDIVIDUAL mode
    const recipientCount = isIndividualMode
        ? (selectedGroupId ? (selectedGroup?.memberCount || 0) : selectedUserIds.length)
        : 1;

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
    const assignedUsers = Object.values(roleAssignments)
        .map(userId => users.find(u => u.id === userId))
        .filter(Boolean) as User[];

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onSubmit(sendImmediately);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                    Review & Submit
                </h2>
                <p className="text-secondary-600">
                    Review all details before creating {isIndividualMode ? 'documents' : 'document'}
                </p>
            </div>

            {/* Summary Card */}
            <Card className="p-6 bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-primary-900">
                            {recipientCount} {recipientCount === 1 ? 'Document' : 'Documents'}
                        </h3>
                        <p className="text-primary-700 mt-1">
                            {isIndividualMode
                                ? 'Each recipient will receive their own copy'
                                : 'All signers will sign the same document'
                            }
                        </p>
                    </div>
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary-600" />
                    </div>
                </div>
            </Card>

            {/* Document Details */}
            <Card className="p-6">
                <h3 className="font-semibold text-secondary-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary-600" />
                    Document Details
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-secondary-600">Template:</span>
                        <span className="font-medium text-secondary-900">{template.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary-600">Title:</span>
                        <span className="font-medium text-secondary-900">
                            {title || template.name}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary-600">Signing Mode:</span>
                        <Badge variant="secondary">{template.signingMode}</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary-600">Signing Flow:</span>
                        <Badge variant="secondary">{template.signingFlow}</Badge>
                    </div>
                    {deadline && (
                        <div className="flex justify-between">
                            <span className="text-secondary-600 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Deadline:
                            </span>
                            <span className="font-medium text-secondary-900">
                                {new Date(deadline).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Recipients/Signers */}
            <Card className="p-6">
                <h3 className="font-semibold text-secondary-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary-600" />
                    {isIndividualMode ? 'Recipients' : 'Signers'}
                </h3>

                {isIndividualMode ? (
                    <div className="space-y-3">
                        {selectedGroupId ? (
                            <div className="p-4 bg-secondary-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-secondary-900">
                                            {selectedGroup?.name}
                                        </p>
                                        <p className="text-sm text-secondary-600 mt-1">
                                            Signer Group
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {selectedGroup?.memberCount} members
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedUsers.map(user => (
                                    <div key={user.id} className="flex items-center p-3 bg-secondary-50 rounded-lg">
                                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-sm font-medium text-primary-700">
                                                {(user.fullName || user.email).charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-secondary-900">
                                                {user.fullName || user.email}
                                            </p>
                                            <p className="text-sm text-secondary-600">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {template.signers?.map((signer: any, index: number) => {
                            const userId = roleAssignments[signer.role];
                            const user = users.find(u => u.id === userId);

                            return (
                                <div key={signer.role} className="flex items-center p-3 bg-secondary-50 rounded-lg">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                                        style={{ backgroundColor: signer.color }}
                                    >
                                        <span className="text-sm font-medium text-white">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-secondary-900">
                                            {signer.role}
                                        </p>
                                        {user && (
                                            <p className="text-sm text-secondary-600">
                                                {user.fullName || user.email} ({user.email})
                                            </p>
                                        )}
                                    </div>
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Send Options */}
            <Card className="p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">
                    Sending Options
                </h3>
                <div className="space-y-3">
                    <label className="flex items-start cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sendImmediately}
                            onChange={(e) => setSendImmediately(e.target.checked)}
                            className="mt-1 mr-3"
                        />
                        <div>
                            <p className="font-medium text-secondary-900">
                                Send immediately
                            </p>
                            <p className="text-sm text-secondary-600 mt-1">
                                {sendImmediately
                                    ? 'Documents will be sent to recipients right away'
                                    : 'Documents will be saved as draft'
                                }
                            </p>
                        </div>
                    </label>
                </div>
            </Card>

            {/* Warning */}
            <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-yellow-900">
                            Ready to create {recipientCount} {recipientCount === 1 ? 'document' : 'documents'}?
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                            {sendImmediately
                                ? 'Email notifications will be sent to all recipients immediately.'
                                : 'Documents will be created in draft status. You can send them later.'
                            }
                        </p>
                    </div>
                </div>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious} disabled={submitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Create {recipientCount} {recipientCount === 1 ? 'Document' : 'Documents'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
