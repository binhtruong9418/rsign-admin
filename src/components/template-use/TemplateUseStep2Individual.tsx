import { useState } from 'react';
import { ArrowLeft, ArrowRight, Users, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { User, SignerGroup } from '@/types';

interface TemplateUseStep2IndividualProps {
    users: User[];
    groups: SignerGroup[];
    selectedUserIds: string[];
    selectedGroupId?: string;
    onUserSelectionChange: (userIds: string[]) => void;
    onGroupSelectionChange: (groupId?: string) => void;
    onNext: () => void;
    onPrevious: () => void;
}

export function TemplateUseStep2Individual({
    users,
    groups,
    selectedUserIds,
    selectedGroupId,
    onUserSelectionChange,
    onGroupSelectionChange,
    onNext,
    onPrevious
}: TemplateUseStep2IndividualProps) {
    const [selectionMode, setSelectionMode] = useState<'USERS' | 'GROUP'>(
        selectedGroupId ? 'GROUP' : 'USERS'
    );
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUserToggle = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            onUserSelectionChange(selectedUserIds.filter(id => id !== userId));
        } else {
            onUserSelectionChange([...selectedUserIds, userId]);
        }
    };

    const handleGroupSelect = (groupId: string) => {
        if (selectedGroupId === groupId) {
            onGroupSelectionChange(undefined);
        } else {
            onGroupSelectionChange(groupId);
        }
    };

    const handleModeChange = (mode: 'USERS' | 'GROUP') => {
        setSelectionMode(mode);
        if (mode === 'USERS') {
            onGroupSelectionChange(undefined);
        } else {
            onUserSelectionChange([]);
        }
    };

    const canProceed = selectionMode === 'USERS'
        ? selectedUserIds.length > 0
        : !!selectedGroupId;

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const recipientCount = selectionMode === 'USERS'
        ? selectedUserIds.length
        : (selectedGroup?.memberCount || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">
                    Select Recipients
                </h2>
                <p className="text-secondary-600">
                    Each recipient will receive their own copy of the document
                </p>
            </div>

            {/* Selection Mode Toggle */}
            <Card className="p-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => handleModeChange('USERS')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${selectionMode === 'USERS'
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-secondary-200 hover:border-secondary-300'
                            }`}
                    >
                        <UserPlus className={`h-6 w-6 mx-auto mb-2 ${selectionMode === 'USERS' ? 'text-primary-600' : 'text-secondary-400'
                            }`} />
                        <p className={`font-medium ${selectionMode === 'USERS' ? 'text-primary-900' : 'text-secondary-700'
                            }`}>
                            Individual Users
                        </p>
                        <p className="text-sm text-secondary-500 mt-1">
                            Select specific users
                        </p>
                    </button>

                    <button
                        onClick={() => handleModeChange('GROUP')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${selectionMode === 'GROUP'
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-secondary-200 hover:border-secondary-300'
                            }`}
                    >
                        <Users className={`h-6 w-6 mx-auto mb-2 ${selectionMode === 'GROUP' ? 'text-primary-600' : 'text-secondary-400'
                            }`} />
                        <p className={`font-medium ${selectionMode === 'GROUP' ? 'text-primary-900' : 'text-secondary-700'
                            }`}>
                            Signer Group
                        </p>
                        <p className="text-sm text-secondary-500 mt-1">
                            Use predefined group
                        </p>
                    </button>
                </div>
            </Card>

            {/* Search */}
            <div>
                <Input
                    type="text"
                    placeholder={`Search ${selectionMode === 'USERS' ? 'users' : 'groups'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                />
            </div>

            {/* User Selection */}
            {selectionMode === 'USERS' && (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-secondary-900">
                            Available Users
                        </h3>
                        <Badge variant="secondary">
                            {selectedUserIds.length} selected
                        </Badge>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-secondary-500 py-8">
                                No users found
                            </p>
                        ) : (
                            filteredUsers.map(user => (
                                <label
                                    key={user.id}
                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedUserIds.includes(user.id)
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-secondary-200 hover:border-secondary-300'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => handleUserToggle(user.id)}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-secondary-900">
                                            {user.fullName || user.email}
                                        </p>
                                        <p className="text-sm text-secondary-500">
                                            {user.email}
                                        </p>
                                    </div>
                                    {selectedUserIds.includes(user.id) && (
                                        <Badge variant="default" className="ml-2">
                                            Selected
                                        </Badge>
                                    )}
                                </label>
                            ))
                        )}
                    </div>
                </Card>
            )}

            {/* Group Selection */}
            {selectionMode === 'GROUP' && (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-secondary-900">
                            Available Groups
                        </h3>
                        {selectedGroupId && (
                            <Badge variant="secondary">
                                {selectedGroup?.memberCount || 0} members
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredGroups.length === 0 ? (
                            <p className="text-center text-secondary-500 py-8">
                                No groups found
                            </p>
                        ) : (
                            filteredGroups.map(group => (
                                <label
                                    key={group.id}
                                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${selectedGroupId === group.id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-secondary-200 hover:border-secondary-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="signerGroup"
                                        checked={selectedGroupId === group.id}
                                        onChange={() => handleGroupSelect(group.id)}
                                        className="mr-3"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-secondary-900">
                                            {group.name}
                                        </p>
                                        {group.description && (
                                            <p className="text-sm text-secondary-500 mt-1">
                                                {group.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-secondary-500 mt-1">
                                            {group.memberCount} members
                                        </p>
                                    </div>
                                    {selectedGroupId === group.id && (
                                        <Badge variant="default" className="ml-2">
                                            Selected
                                        </Badge>
                                    )}
                                </label>
                            ))
                        )}
                    </div>
                </Card>
            )}

            {/* Summary */}
            {canProceed && (
                <Card className="p-4 bg-primary-50 border-primary-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-primary-900">
                                {recipientCount} {recipientCount === 1 ? 'document' : 'documents'} will be created
                            </p>
                            <p className="text-sm text-primary-700 mt-1">
                                Each recipient will receive their own copy
                            </p>
                        </div>
                        <Users className="h-8 w-8 text-primary-600" />
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
