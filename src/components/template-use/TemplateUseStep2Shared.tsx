import { useState } from 'react';
import { ArrowLeft, ArrowRight, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { User as UserType } from '@/types';

interface RoleAssignment {
    role: string;
    roleDescription?: string;
    color: string;
    zoneCount: number;
}

interface TemplateUseStep2SharedProps {
    template: any;
    users: UserType[];
    roleAssignments: Record<string, string>;
    onRoleAssignmentChange: (role: string, userId: string) => void;
    onNext: () => void;
    onPrevious: () => void;
}

export function TemplateUseStep2Shared({
    template,
    users,
    roleAssignments,
    onRoleAssignmentChange,
    onNext,
    onPrevious
}: TemplateUseStep2SharedProps) {
    // Extract roles from template
    const roles: RoleAssignment[] = template.signers?.map((signer: any, index: number) => ({
        role: signer.role,
        roleDescription: signer.description,
        color: signer.color,
        zoneCount: template.signatureZones?.filter((z: any) =>
            z.assignedRole === signer.role
        ).length || 0
    })) || [];

    const assignedCount = Object.keys(roleAssignments).length;
    const totalRoles = roles.length;
    const canProceed = assignedCount === totalRoles;

    const userOptions = users.map(user => ({
        value: user.id,
        label: `${user.fullName || user.email} (${user.email})`
    }));

    // Check if user is already assigned to another role
    const isUserAssigned = (userId: string, currentRole: string) => {
        return Object.entries(roleAssignments).some(
            ([role, assignedUserId]) => role !== currentRole && assignedUserId === userId
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                    Assign Signers to Roles
                </h2>
                <p className="text-secondary-600">
                    Map each template role to an actual user who will sign
                </p>
            </div>

            {/* Progress */}
            <Card className="p-4 bg-secondary-50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-secondary-700">
                            Assignment Progress
                        </p>
                        <p className="text-2xl font-bold text-secondary-900 mt-1">
                            {assignedCount} / {totalRoles}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-secondary-600">
                            {totalRoles - assignedCount} roles remaining
                        </p>
                        {canProceed && (
                            <Badge variant="success" className="mt-1">
                                All roles assigned
                            </Badge>
                        )}
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-3 h-2 bg-secondary-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-600 transition-all duration-300"
                        style={{ width: `${(assignedCount / totalRoles) * 100}%` }}
                    />
                </div>
            </Card>

            {/* Role Assignments */}
            <div className="space-y-4">
                {roles.map((roleInfo, index) => {
                    const assignedUserId = roleAssignments[roleInfo.role];
                    const assignedUser = users.find(u => u.id === assignedUserId);

                    return (
                        <Card key={roleInfo.role} className="p-4">
                            <div className="flex items-start gap-4">
                                {/* Role Color Indicator */}
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: roleInfo.color + '20' }}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: roleInfo.color }}
                                    />
                                </div>

                                {/* Role Info & Assignment */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-secondary-900">
                                                {roleInfo.role}
                                            </h3>
                                            {roleInfo.roleDescription && (
                                                <p className="text-sm text-secondary-600 mt-1">
                                                    {roleInfo.roleDescription}
                                                </p>
                                            )}
                                            <p className="text-xs text-secondary-500 mt-1">
                                                {roleInfo.zoneCount} signature {roleInfo.zoneCount === 1 ? 'zone' : 'zones'}
                                            </p>
                                        </div>
                                        {assignedUser && (
                                            <Badge variant="success">
                                                Assigned
                                            </Badge>
                                        )}
                                    </div>

                                    {/* User Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                                            Assign User *
                                        </label>
                                        <Select
                                            value={assignedUserId || ''}
                                            onChange={(e) => onRoleAssignmentChange(roleInfo.role, e.target.value)}
                                            options={[
                                                { value: '', label: 'Select a user...' },
                                                ...userOptions.map(opt => ({
                                                    ...opt,
                                                    label: opt.label + (
                                                        isUserAssigned(opt.value, roleInfo.role)
                                                            ? ' (Already assigned)'
                                                            : ''
                                                    )
                                                }))
                                            ]}
                                        />
                                        {assignedUser && (
                                            <div className="mt-2 p-2 bg-primary-50 rounded border border-primary-200">
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 text-primary-600 mr-2" />
                                                    <div>
                                                        <p className="text-sm font-medium text-primary-900">
                                                            {assignedUser.fullName || assignedUser.email}
                                                        </p>
                                                        <p className="text-xs text-primary-700">
                                                            {assignedUser.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Signing Flow Info */}
            {template.signingFlow === 'SEQUENTIAL' && template.signingSteps && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-900">
                                Sequential Signing Order
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Signers will sign in the following order:
                            </p>
                            <ol className="mt-2 space-y-1">
                                {template.signingSteps.map((step: any, index: number) => (
                                    <li key={index} className="text-sm text-blue-800">
                                        <strong>Step {step.stepNumber}:</strong>{' '}
                                        {step.signers.map((s: any) => s.role).join(', ')}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </Card>
            )}

            {/* Warning if not all assigned */}
            {!canProceed && assignedCount > 0 && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-900">
                                Incomplete Assignments
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                                Please assign users to all {totalRoles} roles before proceeding
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={onNext} disabled={!canProceed}>
                    Next: Review & Submit
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
