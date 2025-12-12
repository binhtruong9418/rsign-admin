import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    FileText,
    Clock,
    CheckCircle,
    Users,
    TrendingUp,
    Plus
} from 'lucide-react';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { documentsAPI, signerGroupsAPI, usersAPI } from '@/lib/api';
import type { Document } from '@/types';

export default function Dashboard() {
    // Fetch dashboard statistics
    const { data: documentsData, isLoading: documentsLoading } = useQuery({
        queryKey: ['dashboard-documents'],
        queryFn: () => documentsAPI.getDocuments({ limit: 5 }),
    });

    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['dashboard-users'],
        queryFn: () => usersAPI.getUsers({ limit: 1 }),
    });

    const { data: groupsData, isLoading: groupsLoading } = useQuery({
        queryKey: ['dashboard-groups'],
        queryFn: () => signerGroupsAPI.getSignerGroups({ limit: 1 }),
    });

    const isLoading = documentsLoading || usersLoading || groupsLoading;
    const recentDocuments = documentsData?.items || [];
    const totalDocuments = documentsData?.total || 0;
    const totalUsers = usersData?.total || 0;
    
    // Calculate pending and completed documents from the fetched data
    const pendingDocuments = recentDocuments.filter(doc => 
        doc.status === 'PENDING' || doc.status === 'IN_PROGRESS'
    ).length;
    const completedDocuments = recentDocuments.filter(doc => 
        doc.status === 'COMPLETED'
    ).length;

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-secondary-600">
                        Welcome back! Here's what's happening with your documents.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        to="/admin/documents/create"
                        className="btn-primary inline-flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Document
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Documents"
                    value={totalDocuments.toLocaleString()}
                    icon={FileText}
                    color="primary"
                    trend={+8.2}
                />
                <StatCard
                    title="Pending Signatures"
                    value={pendingDocuments.toString()}
                    icon={Clock}
                    color="warning"
                    trend={-12.5}
                />
                <StatCard
                    title="Completed"
                    value={completedDocuments.toString()}
                    icon={CheckCircle}
                    color="success"
                    trend={+15.3}
                />
                <StatCard
                    title="Total Signers"
                    value={totalUsers.toString()}
                    icon={Users}
                    color="secondary"
                    trend={+3.1}
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Documents */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="px-6 py-4 border-b border-secondary-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-secondary-900">Recent Documents</h3>
                                <Link
                                    to="/admin/documents"
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-secondary-200">
                            {recentDocuments.map((document: Document) => (
                                <div key={document.id} className="px-6 py-4 hover:bg-secondary-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <p className="text-sm font-medium text-secondary-900 truncate">
                                                    {document.title}
                                                </p>
                                                {document.batchId && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        Batch
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-secondary-600 mt-1">
                                                Created {formatDate(document.createdAt, 'relative')} • {document.signingMode}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                                getStatusColor(document.status)
                                            )}>
                                                {getStatusLabel(document.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="card">
                        <div className="px-6 py-4 border-b border-secondary-200">
                            <h3 className="text-lg font-semibold text-secondary-900">Quick Actions</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <Link
                                to="/admin/documents/create"
                                className="w-full btn-primary justify-start"
                            >
                                <Plus className="h-4 w-4 mr-3" />
                                Create Document
                            </Link>
                            <Link
                                to="/admin/signer-groups"
                                className="w-full btn-secondary justify-start"
                            >
                                <Users className="h-4 w-4 mr-3" />
                                Manage Groups
                            </Link>
                            <Link
                                to="/admin/documents?status=pending"
                                className="w-full btn-ghost justify-start"
                            >
                                <Clock className="h-4 w-4 mr-3" />
                                Review Pending
                            </Link>
                        </div>
                    </div>

                    {/* Activity Summary */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-secondary-200">
                            <h3 className="text-lg font-semibold text-secondary-900">Today's Activity</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-secondary-600">5 documents completed</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-secondary-600">3 signatures pending</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-secondary-600">2 new signer groups</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    icon: any;
    color: 'primary' | 'secondary' | 'success' | 'warning';
    trend?: number;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
    const colorClasses = {
        primary: 'bg-primary-100 text-primary-600',
        secondary: 'bg-secondary-100 text-secondary-600',
        success: 'bg-green-100 text-green-600',
        warning: 'bg-yellow-100 text-yellow-600',
    };

    return (
        <div className="card p-6">
            <div className="flex items-center">
                <div className={cn('p-3 rounded-lg', colorClasses[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                    <p className="text-2xl font-bold text-secondary-900">{value}</p>
                    <p className="text-sm text-secondary-600">{title}</p>
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center">
                    <TrendingUp className={cn(
                        'h-4 w-4 mr-1',
                        trend > 0 ? 'text-green-600' : 'text-red-600'
                    )} />
                    <span className={cn(
                        'text-sm font-medium',
                        trend > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-sm text-secondary-600 ml-1">from last month</span>
                </div>
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-start">
                <div>
                    <div className="h-8 bg-secondary-200 rounded w-32"></div>
                    <div className="h-4 bg-secondary-200 rounded w-64 mt-2"></div>
                </div>
                <div className="h-10 bg-secondary-200 rounded w-32"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-secondary-200 rounded-lg"></div>
                            <div className="ml-4 flex-1">
                                <div className="h-6 bg-secondary-200 rounded w-16"></div>
                                <div className="h-4 bg-secondary-200 rounded w-24 mt-2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <div className="p-6">
                        <div className="h-6 bg-secondary-200 rounded w-32 mb-4"></div>
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="h-4 bg-secondary-200 rounded w-48"></div>
                                        <div className="h-3 bg-secondary-200 rounded w-32 mt-2"></div>
                                    </div>
                                    <div className="h-6 bg-secondary-200 rounded w-20"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="card p-6">
                    <div className="h-6 bg-secondary-200 rounded w-24 mb-4"></div>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-10 bg-secondary-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}