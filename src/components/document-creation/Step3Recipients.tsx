import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Users, UserPlus, Search, Check, X, Plus, GripVertical, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usersAPI, signerGroupsAPI } from '@/lib/api';
import type { DocumentData, User, Signer, SigningStep } from '@/types/document-creation';
import { cn } from '@/lib/utils';

interface Step3RecipientsProps {
    documentData: DocumentData;
    updateDocumentData: (updates: Partial<DocumentData>) => void;
    onNext: () => void;
    onPrevious: () => void;
}

const signerColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6B7280', // Gray
];



export function Step3Recipients({ documentData, updateDocumentData, onNext, onPrevious }: Step3RecipientsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>(documentData.recipients);
    const [selectionMode, setSelectionMode] = useState<'GROUP' | 'INDIVIDUAL'>('GROUP');

    // Fetch users from API
    const { data: usersResponse, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['users', { limit: 100 }],
        queryFn: () => usersAPI.getUsers({ limit: 100 }),
    });

    // Fetch signer groups from API
    const { data: groupsResponse, isLoading: groupsLoading, error: groupsError } = useQuery({
        queryKey: ['signer-groups', { limit: 100 }],
        queryFn: () => signerGroupsAPI.getSignerGroups({ limit: 100 }),
    });

    const users = usersResponse?.items || [];
    const groups = groupsResponse?.items || [];
    const isLoading = usersLoading || groupsLoading;
    const hasError = usersError || groupsError;

    const filteredUsers = users.filter(user =>
        (user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    

    const handleNext = () => {
        if (documentData.type === 'INDIVIDUAL') {
            updateDocumentData({ recipients: selectedUsers });
        } else {
            // For SHARED mode, update signers and steps
            updateDocumentData({
                signers: documentData.signers,
                signingSteps: documentData.signingSteps,
            });
        }
        onNext();
    };

    const canProceed = documentData.type === 'INDIVIDUAL'
        ? selectedUsers.length > 0
        : documentData.signers.length > 0 && documentData.signers.every(s => s.name && s.email);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading users and groups...</span>
            </div>
        );
    }

    // Show error state
    if (hasError) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-600 mb-2">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-gray-900 font-medium">Failed to load data</p>
                    <p className="text-gray-600 text-sm">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    if (documentData.type === 'INDIVIDUAL') {
        return (
            <IndividualRecipients
                selectionMode={selectionMode}
                setSelectionMode={setSelectionMode}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredUsers={filteredUsers}
                users={users}
                groups={groups}
                documentData={documentData}
                updateDocumentData={updateDocumentData}
                onNext={handleNext}
                onPrevious={onPrevious}
                canProceed={canProceed}
            />
        );
    }

    if (documentData.signingFlow === 'PARALLEL') {
        return (
            <ParallelSigners
                users={users}
                documentData={documentData}
                updateDocumentData={updateDocumentData}
                onNext={handleNext}
                onPrevious={onPrevious}
                canProceed={canProceed}
            />
        );
    }

    return (
        <SequentialSigners
            users={users}
            documentData={documentData}
            updateDocumentData={updateDocumentData}
            onNext={handleNext}
            onPrevious={onPrevious}
            canProceed={canProceed}
        />
    );
}

// INDIVIDUAL Mode Component
function IndividualRecipients({
    selectionMode,
    setSelectionMode,
    selectedUsers,
    setSelectedUsers,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    groups,
    documentData,
    updateDocumentData,
    onNext,
    onPrevious,
    canProceed
}: any) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Select Recipients</h2>
                <p className="text-secondary-600">Who should receive this document?</p>
            </div>

            {/* Selection Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                    variant={selectionMode === 'GROUP' ? 'primary' : 'outline'}
                    onClick={() => setSelectionMode('GROUP')}
                    className="h-auto p-4 flex flex-col items-center"
                >
                    <Users className="h-8 w-8 mb-2" />
                    <span>Signer Group</span>
                </Button>
                <Button
                    variant={selectionMode === 'INDIVIDUAL' ? 'primary' : 'outline'}
                    onClick={() => setSelectionMode('INDIVIDUAL')}
                    className="h-auto p-4 flex flex-col items-center"
                >
                    <UserPlus className="h-8 w-8 mb-2" />
                    <span>Individual Users</span>
                </Button>
            </div>

            {selectionMode === 'GROUP' ? (
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-secondary-700">
                        Select Group
                    </label>
                    <Select
                        value={documentData.selectedGroup?.id || ''}
                        onChange={(e) => {
                            const groupId = e.target.value;
                            const group = groups.find((g: any) => g.id === groupId);
                            if (group) {
                                updateDocumentData({ selectedGroup: group });
                                setSelectedUsers(group.members || []);
                            }
                        }}
                        placeholder="Choose a group"
                        options={groups.map((group: any) => ({
                            value: group.id,
                            label: `${group.name} (${group.memberCount || group.members?.length || 0} members)`
                        }))}
                    />

                    {documentData.selectedGroup && (
                        <Card className="p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">Selected Group: {documentData.selectedGroup.name}</h3>
                                    <Badge>{documentData.selectedGroup.memberCount} members</Badge>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Preview:</p>
                                    {documentData.selectedGroup.members.slice(0, 3).map((member: any) => (
                                        <div key={member.id} className="flex items-center text-sm">
                                            <Check className="h-4 w-4 text-green-600 mr-2" />
                                            {member.fullName} ({member.email})
                                        </div>
                                    ))}
                                    {documentData.selectedGroup.memberCount > 3 && (
                                        <p className="text-sm text-secondary-500">
                                            ... and {documentData.selectedGroup.memberCount - 3} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search by name or email"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Available Users */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Available Users
                        </label>
                        <Card className="p-4 max-h-60 overflow-y-auto">
                            <div className="space-y-2">
                                {filteredUsers.map((user: User) => (
                                    <label key={user.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.some((u: any) => u.id === user.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers([...selectedUsers, user]);
                                                } else {
                                                    setSelectedUsers(selectedUsers.filter((u: any) => u.id !== user.id));
                                                }
                                            }}
                                            className="mr-3"
                                        />
                                        <div>
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-sm text-secondary-500 ml-2">({user.email})</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                Selected: {selectedUsers.length} users
                            </label>
                            <Card className="p-4">
                                <div className="space-y-2">
                                    {selectedUsers.map((user: User) => (
                                        <div key={user.id} className="flex items-center justify-between">
                                            <span className="text-sm">• {user.name} ({user.email})</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedUsers(selectedUsers.filter((u: any) => u.id !== user.id))}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={onNext} disabled={!canProceed}>
                    Next: Signature Zones
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// PARALLEL Mode Component
function ParallelSigners({ users, documentData, updateDocumentData, onNext, onPrevious, canProceed }: any) {
    // Get list of already selected emails to exclude from options
    const selectedEmails = documentData.signers.map((s: Signer) => s.email).filter(Boolean);

    const addSigner = () => {
        const newSigner: Signer = {
            id: `signer-${Date.now()}`,
            userId: '',
            name: '',
            email: '',
            color: signerColors[documentData.signers.length % signerColors.length]
        };
        updateDocumentData({ signers: [...documentData.signers, newSigner] });
    };

    const updateSigner = (index: number, updates: Partial<Signer>) => {
        const updated = documentData.signers.map((signer: Signer, i: number) =>
            i === index ? { ...signer, ...updates } : signer
        );
        updateDocumentData({ signers: updated });
    };

    const removeSigner = (index: number) => {
        updateDocumentData({ signers: documentData.signers.filter((_: any, i: number) => i !== index) });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Add Signers (Parallel)</h2>
                <p className="text-secondary-600">All signers can sign at the same time in any order.</p>
            </div>

            <div className="space-y-4">
                {documentData.signers.map((signer: Signer, index: number) => {
                    // Exclude other selected emails but allow current signer's email
                    const excludeEmails = selectedEmails.filter((email: string) => email !== signer.email);

                    return (
                        <Card key={signer.id} className="p-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-4 h-4 rounded flex-shrink-0"
                                    style={{ backgroundColor: signer.color }}
                                />

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Signer {index + 1}
                                    </label>
                                    <UserSearchSelect
                                        users={users}
                                        value={signer.email}
                                        excludeEmails={excludeEmails}
                                        onChange={(user) => {
                                            if (user) {
                                                updateSigner(index, {
                                                    userId: user.id,
                                                    name: user.fullName,
                                                    email: user.email
                                                });
                                            }
                                        }}
                                        placeholder="Search user..."
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSigner(index)}
                                    disabled={documentData.signers.length === 1}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    );
                })}

                <Button
                    variant="outline"
                    onClick={addSigner}
                    className="w-full"
                    disabled={documentData.signers.length >= 8}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Signer
                </Button>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={onNext} disabled={!canProceed}>
                    Next: Signature Zones
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// SEQUENTIAL Mode Component - Enhanced with step management
function SequentialSigners({ users, documentData, updateDocumentData, onNext, onPrevious, canProceed }: any) {
    // Get list of already selected emails to exclude from options
    const selectedEmails = documentData.signers.map((s: Signer) => s.email).filter(Boolean);

    const addStep = () => {
        const newStep: SigningStep = {
            stepOrder: documentData.signingSteps.length + 1,
            signerIds: []
        };
        updateDocumentData({ signingSteps: [...documentData.signingSteps, newStep] });
    };

    const removeStep = (stepIndex: number) => {
        const newSteps = documentData.signingSteps.filter((_: any, i: number) => i !== stepIndex);
        // Reorder steps
        const reorderedSteps = newSteps.map((step: SigningStep, i: number) => ({
            ...step,
            stepOrder: i + 1
        }));

        // Remove signers that were in the deleted step
        const removedSignerIds = documentData.signingSteps[stepIndex].signerIds;
        const remainingSigners = documentData.signers.filter((s: Signer) => !removedSignerIds.includes(s.id));

        updateDocumentData({
            signingSteps: reorderedSteps,
            signers: remainingSigners
        });
    };

    const addSignerToStep = (stepIndex: number) => {
        const newSigner: Signer = {
            id: `signer-${Date.now()}`,
            userId: '',
            name: '',
            email: '',
            color: signerColors[documentData.signers.length % signerColors.length],
            step: documentData.signingSteps[stepIndex].stepOrder
        };

        const updatedSteps = [...documentData.signingSteps];
        updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            signerIds: [...updatedSteps[stepIndex].signerIds, newSigner.id]
        };

        updateDocumentData({
            signers: [...documentData.signers, newSigner],
            signingSteps: updatedSteps
        });
    };

    const removeSignerFromStep = (stepIndex: number, signerId: string) => {
        const updatedSteps = [...documentData.signingSteps];
        updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            signerIds: updatedSteps[stepIndex].signerIds.filter((id: string) => id !== signerId)
        };

        updateDocumentData({
            signers: documentData.signers.filter((s: Signer) => s.id !== signerId),
            signingSteps: updatedSteps
        });
    };

    const updateSignerInStep = (signerId: string, updates: Partial<Signer>) => {
        const updatedSigners = documentData.signers.map((signer: Signer) =>
            signer.id === signerId ? { ...signer, ...updates } : signer
        );
        updateDocumentData({ signers: updatedSigners });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Add Signers (Sequential Order)</h2>
                <p className="text-secondary-600">Define the signing order. Each step can have multiple signers.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                        Each step will receive notification only after the previous step is completed.
                        Multiple signers in the same step can sign in parallel.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {documentData.signingSteps.map((step: SigningStep, stepIndex: number) => (
                    <Card key={step.stepOrder} className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <GripVertical className="h-5 w-5 text-secondary-400 mr-2" />
                                    <h3 className="font-medium text-secondary-900">Step {step.stepOrder}</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeStep(stepIndex)}
                                    disabled={documentData.signingSteps.length === 1}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Signers in this step */}
                            <div className="space-y-2 ml-7">
                                {step.signerIds.map((signerId: string) => {
                                    const signer = documentData.signers.find((s: Signer) => s.id === signerId);
                                    if (!signer) return null;

                                    // Exclude other selected emails but allow current signer's email
                                    const excludeEmails = selectedEmails.filter((email: string) => email !== signer.email);

                                    return (
                                        <div key={signerId} className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded flex-shrink-0"
                                                style={{ backgroundColor: signer.color }}
                                            />
                                            <div className="flex-1">
                                                <UserSearchSelect
                                                    users={users}
                                                    value={signer.email}
                                                    excludeEmails={excludeEmails}
                                                    onChange={(user) => {
                                                        if (user) {
                                                            updateSignerInStep(signerId, {
                                                                userId: user.id,
                                                                name: user.fullName,
                                                                email: user.email
                                                            });
                                                        }
                                                    }}
                                                    placeholder="Search user..."
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeSignerFromStep(stepIndex, signerId)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addSignerToStep(stepIndex)}
                                    className="w-full"
                                >
                                    <Plus className="mr-2 h-3 w-3" />
                                    Add Signer to Step {step.stepOrder}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                <Button
                    variant="outline"
                    onClick={addStep}
                    className="w-full"
                    disabled={documentData.signingSteps.length >= 10}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Next Step
                </Button>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onPrevious}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={onNext} disabled={!canProceed}>
                    Next: Signature Zones
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// User Search Select Component
interface UserSearchSelectProps {
    users: any[];
    value: string; // email of selected user
    onChange: (user: { id: string; fullName: string; email: string } | null) => void;
    placeholder?: string;
    excludeEmails?: string[]; // emails to exclude from options
}

function UserSearchSelect({ users, value, onChange, placeholder = "Search user...", excludeEmails = [] }: UserSearchSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Find selected user
    const selectedUser = users.find(u => u.email === value);

    // Filter users based on search query and exclude list
    const filteredUsers = users.filter(user => {
        if (excludeEmails.includes(user.email)) return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (user.fullName?.toLowerCase().includes(query) ?? false) ||
            user.email.toLowerCase().includes(query)
        );
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (user: any) => {
        onChange({
            id: user.id,
            fullName: user.fullName || user.email,
            email: user.email
        });
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = () => {
        onChange(null);
        setSearchQuery('');
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none" />
                <input
                    type="text"
                    className={cn(
                        "w-full pl-10 pr-8 py-2 border border-secondary-300 rounded-lg text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                        "placeholder:text-secondary-400"
                    )}
                    placeholder={selectedUser ? `${selectedUser.fullName || selectedUser.email}` : placeholder}
                    value={isOpen ? searchQuery : (selectedUser ? `${selectedUser.fullName} (${selectedUser.email})` : '')}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        if (selectedUser) {
                            setSearchQuery('');
                        }
                    }}
                />
                {selectedUser && !isOpen && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-secondary-500 text-center">
                            {searchQuery ? 'No users found' : 'No users available'}
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelect(user)}
                                className={cn(
                                    "w-full px-4 py-2 text-left hover:bg-secondary-50 flex items-center justify-between",
                                    user.email === value && "bg-primary-50"
                                )}
                            >
                                <div>
                                    <div className="text-sm font-medium text-secondary-900">
                                        {user.fullName || user.email}
                                    </div>
                                    <div className="text-xs text-secondary-500">{user.email}</div>
                                </div>
                                {user.email === value && (
                                    <Check className="h-4 w-4 text-primary-600" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
