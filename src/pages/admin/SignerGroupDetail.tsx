import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ArrowLeft, 
    Users, 
    Edit, 
    Trash2, 
    UserPlus,
    UserMinus,
    Save,
    X,
    Calendar,
    User,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { signerGroupsAPI, usersAPI } from '@/lib/api';
import { Button, Card, Input, Textarea } from '@/components/ui';
import { toast } from 'react-hot-toast';

export default function SignerGroupDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Fetch signer group details
    const { data: signerGroup, isLoading: loadingGroup } = useQuery({
        queryKey: ['signer-group', id],
        queryFn: () => signerGroupsAPI.getSignerGroup(id!),
        enabled: !!id,
    });

    // Fetch all users for adding members
    const { data: usersResponse } = useQuery({
        queryKey: ['users-all'],
        queryFn: () => usersAPI.getUsers({ limit: 1000 }),
    });

    // Initialize edit form when group data loads
    useState(() => {
        if (signerGroup) {
            setEditedName(signerGroup.name);
            setEditedDescription(signerGroup.description || '');
        }
    });

    // Update group mutation
    const updateGroupMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            signerGroupsAPI.updateSignerGroup(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signer-group', id] });
            queryClient.invalidateQueries({ queryKey: ['signerGroups'] });
            toast.success('Group updated successfully');
            setIsEditing(false);
        },
        onError: (error: any) => {
            toast.error(error.error || 'Failed to update group');
        },
    });

    // Add members mutation
    const addMembersMutation = useMutation({
        mutationFn: (userIds: string[]) =>
            signerGroupsAPI.addMembers(id!, userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signer-group', id] });
            queryClient.invalidateQueries({ queryKey: ['signerGroups'] });
            toast.success('Members added successfully');
            setShowAddMembers(false);
            setSelectedUserIds([]);
        },
        onError: (error: any) => {
            toast.error(error.error || 'Failed to add members');
        },
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) =>
            signerGroupsAPI.removeMember(id!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signer-group', id] });
            queryClient.invalidateQueries({ queryKey: ['signerGroups'] });
            toast.success('Member removed successfully');
        },
        onError: (error: any) => {
            toast.error(error.error || 'Failed to remove member');
        },
    });

    // Remove multiple members mutation
    const removeMembersMutation = useMutation({
        mutationFn: async (userIds: string[]) => {
            // Remove members sequentially
            for (const userId of userIds) {
                await signerGroupsAPI.removeMember(id!, userId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['signer-group', id] });
            queryClient.invalidateQueries({ queryKey: ['signerGroups'] });
            toast.success('Members removed successfully');
            setSelectedMemberIds([]);
        },
        onError: (error: any) => {
            toast.error(error.error || 'Failed to remove members');
        },
    });

    // Delete group mutation
    const deleteGroupMutation = useMutation({
        mutationFn: () => signerGroupsAPI.deactivateGroup(id!),
        onSuccess: () => {
            toast.success('Group deleted successfully');
            navigate('/admin/signer-groups');
        },
        onError: (error: any) => {
            toast.error(error.error || 'Failed to delete group');
        },
    });

    const handleSaveEdit = () => {
        if (!editedName.trim()) {
            toast.error('Group name is required');
            return;
        }
        updateGroupMutation.mutate({
            name: editedName,
            description: editedDescription,
        });
    };

    const handleAddMembers = () => {
        if (selectedUserIds.length === 0) {
            toast.error('Please select at least one user');
            return;
        }
        addMembersMutation.mutate(selectedUserIds);
    };

    const handleRemoveMember = (userId: string, userName: string) => {
        if (confirm(`Remove ${userName} from this group?`)) {
            removeMemberMutation.mutate(userId);
        }
    };

    const handleDeleteGroup = () => {
        if (confirm(`Delete group "${signerGroup?.name}"? This action cannot be undone.`)) {
            deleteGroupMutation.mutate();
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Filter out users who are already members
    const availableUsers = usersResponse?.items.filter(
        user => !signerGroup?.members?.some(member => member.id === user.id)
    ) || [];

    if (loadingGroup) {
        return <SignerGroupDetailSkeleton />;
    }

    if (!signerGroup) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load signer group. Please try again.
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate('/admin/signer-groups')}
                    className="mt-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Signer Groups
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/signer-groups')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <Input
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="text-2xl font-bold"
                                    placeholder="Group name"
                                />
                            ) : (
                                <h1 className="text-2xl font-bold text-secondary-900">
                                    {signerGroup.name}
                                </h1>
                            )}
                        </div>
                        {!isEditing && signerGroup.description && (
                            <p className="text-sm text-secondary-600 mt-1">
                                {signerGroup.description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedName(signerGroup.name);
                                    setEditedDescription(signerGroup.description || '');
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={updateGroupMutation.isPending}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {updateGroupMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDeleteGroup}
                                disabled={deleteGroupMutation.isPending}
                                className="text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Description */}
            {isEditing && (
                <Card className="p-6">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Description
                    </label>
                    <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Group description (optional)"
                        rows={3}
                    />
                </Card>
            )}

            {/* Group Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 text-primary-600 mr-2" />
                        <span className="text-sm font-medium text-secondary-600">
                            Total Members
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-secondary-900">
                        {signerGroup.members?.length || 0}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center mb-2">
                        <User className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-secondary-600">
                            Created By
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-secondary-900">
                        {signerGroup.createdBy?.fullName || 'Unknown'}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-secondary-600">
                            Created At
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-secondary-900">
                        {formatDate(signerGroup.createdAt)}
                    </p>
                </Card>
            </div>

            {/* Members Management */}
            <Card>
                <div className="p-6 border-b border-secondary-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-secondary-900">Members</h2>
                            <p className="text-sm text-secondary-600 mt-1">
                                Manage group members
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedMemberIds.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (confirm(`Remove ${selectedMemberIds.length} selected member${selectedMemberIds.length !== 1 ? 's' : ''}?`)) {
                                            removeMembersMutation.mutate(selectedMemberIds);
                                        }
                                    }}
                                    disabled={removeMembersMutation.isPending}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete {selectedMemberIds.length}
                                </Button>
                            )}
                            <Button
                                onClick={() => setShowAddMembers(!showAddMembers)}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Members
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Add Members Section */}
                {showAddMembers && (
                    <div className="p-6 bg-secondary-50 border-b border-secondary-200">
                        <h3 className="text-sm font-semibold text-secondary-900 mb-3">
                            Select users to add ({selectedUserIds.length} selected)
                        </h3>
                        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                            {availableUsers.length > 0 ? (
                                availableUsers.map((user) => (
                                    <label
                                        key={user.id}
                                        className="flex items-center p-3 bg-white rounded-lg border border-secondary-200 hover:bg-secondary-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="h-4 w-4 text-primary-600 rounded border-secondary-300 focus:ring-primary-500"
                                        />
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-secondary-900">
                                                {user.fullName || user.email}
                                            </p>
                                            <p className="text-xs text-secondary-600">{user.email}</p>
                                        </div>
                                    </label>
                                ))
                            ) : (
                                <p className="text-sm text-secondary-500 text-center py-4">
                                    No available users to add
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleAddMembers}
                                disabled={selectedUserIds.length === 0 || addMembersMutation.isPending}
                            >
                                {addMembersMutation.isPending ? 'Adding...' : `Add ${selectedUserIds.length} Member${selectedUserIds.length !== 1 ? 's' : ''}`}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddMembers(false);
                                    setSelectedUserIds([]);
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Members Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={signerGroup.members && signerGroup.members.length > 0 && selectedMemberIds.length === signerGroup.members.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMemberIds(signerGroup.members?.map((m: any) => m.id) || []);
                                            } else {
                                                setSelectedMemberIds([]);
                                            }
                                        }}
                                        className="h-4 w-4 text-primary-600 rounded border-secondary-300 focus:ring-primary-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {signerGroup.members && signerGroup.members.length > 0 ? (
                                signerGroup.members.map((member: any) => (
                                    <tr key={member.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedMemberIds.includes(member.id)}
                                                onChange={() => {
                                                    setSelectedMemberIds(prev =>
                                                        prev.includes(member.id)
                                                            ? prev.filter(id => id !== member.id)
                                                            : [...prev, member.id]
                                                    );
                                                }}
                                                className="h-4 w-4 text-primary-600 rounded border-secondary-300 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-white">
                                                        {member.fullName?.charAt(0) || member.email.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-secondary-900">
                                                        {member.fullName || 'No name'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-secondary-900">{member.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {member.role || 'USER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                member.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {member.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.fullName || member.email)}
                                                disabled={removeMemberMutation.isPending}
                                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                                            >
                                                <UserMinus className="h-4 w-4 mr-1" />
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Users className="mx-auto h-12 w-12 text-secondary-400" />
                                        <h3 className="mt-2 text-sm font-medium text-secondary-900">
                                            No members yet
                                        </h3>
                                        <p className="mt-1 text-sm text-secondary-500">
                                            Get started by adding members to this group
                                        </p>
                                        <div className="mt-6">
                                            <Button onClick={() => setShowAddMembers(true)}>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Add Members
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function SignerGroupDetailSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="h-10 w-24 bg-secondary-200 rounded"></div>
                    <div>
                        <div className="h-8 w-64 bg-secondary-200 rounded mb-2"></div>
                        <div className="h-4 w-48 bg-secondary-200 rounded"></div>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <div className="h-10 w-24 bg-secondary-200 rounded"></div>
                    <div className="h-10 w-24 bg-secondary-200 rounded"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-secondary-200 rounded"></div>
                ))}
            </div>
            <div className="h-96 bg-secondary-200 rounded"></div>
        </div>
    );
}
