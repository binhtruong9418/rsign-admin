import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    Users,
    PenLine,
    Layers,
    Clock,
    CheckCircle,
    AlertTriangle,
    UserCheck,
    Timer,
    Plus,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { statisticsAPI } from "@/lib/api";
import type { DashboardStatistics, TimeSeriesData } from "@/types";

const DEFAULT_TIME_SERIES_DAYS = 14;
const REFRESH_INTERVAL_MS = 60000;

export default function Dashboard() {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ["admin-statistics-dashboard"],
        queryFn: statisticsAPI.getDashboardStatistics,
        staleTime: REFRESH_INTERVAL_MS,
        refetchInterval: REFRESH_INTERVAL_MS,
    });

    const { data: timeSeries } = useQuery({
        queryKey: ["admin-statistics-time-series", DEFAULT_TIME_SERIES_DAYS],
        queryFn: () => statisticsAPI.getTimeSeries(DEFAULT_TIME_SERIES_DAYS),
        enabled: !!stats,
        staleTime: REFRESH_INTERVAL_MS,
        refetchInterval: REFRESH_INTERVAL_MS,
    });

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (isError || !stats) {
        return (
            <div className="card p-6">
                <p className="text-sm text-secondary-600">
                    Unable to load dashboard statistics. Please try again.
                </p>
            </div>
        );
    }

    const totalByStatus =
        stats.documents.draft +
        stats.documents.pending +
        stats.documents.inProgress +
        stats.documents.completed +
        stats.documents.cancelled;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">
                        Admin Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-secondary-600">
                        Real-time overview of your documents, users, and signing
                        activity.
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Documents"
                    value={stats.overview.totalDocuments.toLocaleString()}
                    icon={FileText}
                    color="primary"
                />
                <MetricCard
                    title="Total Users"
                    value={stats.overview.totalUsers.toLocaleString()}
                    icon={Users}
                    color="secondary"
                />
                <MetricCard
                    title="Total Signatures"
                    value={stats.overview.totalSignatures.toLocaleString()}
                    icon={PenLine}
                    color="warning"
                />
                <MetricCard
                    title="Templates"
                    value={stats.overview.totalTemplates.toLocaleString()}
                    icon={Layers}
                    color="success"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-secondary-900">
                            Documents by Status
                        </h3>
                        <span className="text-xs text-secondary-500">
                            Completion {stats.documents.completionRate}%
                        </span>
                    </div>
                    <StatusRow
                        label="Draft"
                        value={stats.documents.draft}
                        total={totalByStatus}
                        color="bg-blue-500"
                    />
                    <StatusRow
                        label="Pending"
                        value={stats.documents.pending}
                        total={totalByStatus}
                        color="bg-yellow-500"
                    />
                    <StatusRow
                        label="In Progress"
                        value={stats.documents.inProgress}
                        total={totalByStatus}
                        color="bg-orange-500"
                    />
                    <StatusRow
                        label="Completed"
                        value={stats.documents.completed}
                        total={totalByStatus}
                        color="bg-green-500"
                    />
                    <StatusRow
                        label="Cancelled"
                        value={stats.documents.cancelled}
                        total={totalByStatus}
                        color="bg-red-500"
                    />
                </div>

                <div className="card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-900">
                        Signing Progress
                    </h3>
                    <MetricRow
                        icon={Clock}
                        label="Awaiting signature"
                        value={stats.signingProgress.awaitingSignature}
                    />
                    <MetricRow
                        icon={CheckCircle}
                        label="Signed today"
                        value={stats.signingProgress.signedToday}
                    />
                    <MetricRow
                        icon={Timer}
                        label="Average signing time"
                        value={`${stats.signingProgress.averageSigningTime}h`}
                    />
                </div>

                <div className="card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-900">
                        User Health
                    </h3>
                    <MetricRow
                        icon={UserCheck}
                        label="Active users"
                        value={stats.users.active}
                    />
                    <MetricRow
                        icon={Users}
                        label="Inactive users"
                        value={stats.users.inactive}
                    />
                    <MetricRow
                        icon={AlertTriangle}
                        label="Suspended users"
                        value={stats.users.suspended}
                    />
                    <MetricRow
                        icon={Layers}
                        label="Total admins"
                        value={stats.users.totalAdmins}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ActivityTrendCard data={timeSeries} />
                <RecentActivityCard data={stats.recentActivity} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <MostActiveUsersCard data={stats.topMetrics.mostActiveUsers} />
                <NearDeadlineCard data={stats.topMetrics.documentsNearDeadline} />
                <RecentCompletedCard
                    data={stats.topMetrics.recentCompletedDocuments}
                />
            </div>

            <RecentDocumentsCard data={stats.topMetrics.recentDocuments} />
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string;
    icon: any;
    color: "primary" | "secondary" | "success" | "warning";
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
    const colorClasses = {
        primary: "bg-primary-100 text-primary-600",
        secondary: "bg-secondary-100 text-secondary-600",
        success: "bg-green-100 text-green-600",
        warning: "bg-yellow-100 text-yellow-600",
    };

    return (
        <div className="card p-6">
            <div className="flex items-center">
                <div className={cn("p-3 rounded-lg", colorClasses[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                    <p className="text-2xl font-bold text-secondary-900">
                        {value}
                    </p>
                    <p className="text-sm text-secondary-600">{title}</p>
                </div>
            </div>
        </div>
    );
}

function StatusRow({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const percent = total === 0 ? 0 : Math.round((value / total) * 100);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-700">{label}</span>
                <span className="text-secondary-600">
                    {value} ({percent}%)
                </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary-100">
                <div
                    className={cn("h-2 rounded-full", color)}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function MetricRow({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-secondary-100 text-secondary-600">
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-secondary-600">{label}</span>
            </div>
            <span className="text-sm font-semibold text-secondary-900">
                {value}
            </span>
        </div>
    );
}

function ActivityTrendCard({ data }: { data?: TimeSeriesData[] }) {
    const series = data ?? [];
    const maxCreated = Math.max(
        1,
        ...series.map((item) => item.documentsCreated)
    );

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900">
                    Activity Trends
                </h3>
                <span className="text-xs text-secondary-500">
                    Last {DEFAULT_TIME_SERIES_DAYS} days
                </span>
            </div>
            {series.length === 0 ? (
                <p className="mt-6 text-sm text-secondary-600">
                    No activity data available yet.
                </p>
            ) : (
                <div className="mt-6">
                    <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-32">
                        {series.map((item) => {
                            const height = Math.max(
                                8,
                                Math.round(
                                    (item.documentsCreated / maxCreated) * 100
                                )
                            );
                            return (
                                <div
                                    key={item.date}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div
                                        className="w-2.5 sm:w-3 rounded-full bg-primary-500/80"
                                        style={{ height: `${height}%` }}
                                    />
                                    <span className="text-[10px] text-secondary-500">
                                        {item.date.slice(5)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-secondary-500">
                        <span>Documents created</span>
                        <span>Peak {maxCreated} / day</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function RecentActivityCard({
    data,
}: {
    data: DashboardStatistics["recentActivity"];
}) {
    const items = [
        { label: "Last 24 hours", value: data.last24Hours },
        { label: "Last 7 days", value: data.last7Days },
        { label: "Last 30 days", value: data.last30Days },
    ];

    return (
        <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-secondary-900">
                Recent Activity
            </h3>
            {items.map((item) => (
                <div
                    key={item.label}
                    className="rounded-xl border border-secondary-200 p-4 space-y-2"
                >
                    <div className="text-sm font-semibold text-secondary-700">
                        {item.label}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-secondary-600">
                        <div className="space-y-1">
                            <span className="text-secondary-500">Created</span>
                            <p className="text-sm font-semibold text-secondary-900">
                                {item.value.documentsCreated}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-secondary-500">Signed</span>
                            <p className="text-sm font-semibold text-secondary-900">
                                {item.value.documentsSigned}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-secondary-500">New users</span>
                            <p className="text-sm font-semibold text-secondary-900">
                                {item.value.newUsers}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MostActiveUsersCard({
    data,
}: {
    data: DashboardStatistics["topMetrics"]["mostActiveUsers"];
}) {
    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900">
                Most Active Users
            </h3>
            <div className="mt-4 space-y-3">
                {data.length === 0 ? (
                    <p className="text-sm text-secondary-600">
                        No activity yet.
                    </p>
                ) : (
                    data.map((user) => (
                        <div
                            key={user.userId}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <p className="text-sm font-medium text-secondary-900">
                                    {user.userName}
                                </p>
                                <p className="text-xs text-secondary-500">
                                    {user.email}
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-secondary-900">
                                {user.signaturesCount}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function NearDeadlineCard({
    data,
}: {
    data: DashboardStatistics["topMetrics"]["documentsNearDeadline"];
}) {
    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900">
                Near Deadline
            </h3>
            <div className="mt-4 space-y-3">
                {data.length === 0 ? (
                    <p className="text-sm text-secondary-600">
                        No documents near deadline.
                    </p>
                ) : (
                    data.map((doc) => (
                        <Link
                            key={doc.documentId}
                            to={`/admin/documents/${doc.documentId}`}
                            className="block rounded-lg border border-secondary-200 p-3 hover:border-primary-300 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-secondary-900 truncate">
                                    {doc.title}
                                </p>
                                <span className="text-xs text-secondary-500">
                                    {doc.daysRemaining}d
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-secondary-500">
                                    Due {formatDate(doc.deadline, "short")}
                                </span>
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                        getStatusColor(doc.status)
                                    )}
                                >
                                    {getStatusLabel(doc.status)}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

function RecentCompletedCard({
    data,
}: {
    data: DashboardStatistics["topMetrics"]["recentCompletedDocuments"];
}) {
    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900">
                Recently Completed
            </h3>
            <div className="mt-4 space-y-3">
                {data.length === 0 ? (
                    <p className="text-sm text-secondary-600">
                        No completed documents yet.
                    </p>
                ) : (
                    data.map((doc) => (
                        <div
                            key={doc.documentId}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <p className="text-sm font-medium text-secondary-900">
                                    {doc.title}
                                </p>
                                <p className="text-xs text-secondary-500">
                                    {formatDate(doc.completedAt, "relative")}
                                </p>
                            </div>
                            <span className="text-xs text-secondary-600">
                                {doc.totalSigners} signers
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function RecentDocumentsCard({
    data,
}: {
    data: DashboardStatistics["topMetrics"]["recentDocuments"];
}) {
    return (
        <div className="card">
            <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900">
                    Recent Documents
                </h3>
                <Link
                    to="/admin/documents"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    View all
                </Link>
            </div>
            <div className="divide-y divide-secondary-200">
                {data.length === 0 ? (
                    <div className="px-6 py-6 text-sm text-secondary-600">
                        No documents created yet.
                    </div>
                ) : (
                    data.map((doc) => (
                        <Link
                            key={doc.documentId}
                            to={`/admin/documents/${doc.documentId}`}
                            className="block px-6 py-4 hover:bg-secondary-50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-secondary-900 truncate">
                                        {doc.title}
                                    </p>
                                    <p className="text-xs text-secondary-500 mt-1">
                                        {doc.createdBy.fullName} -{" "}
                                        {formatDate(doc.createdAt, "relative")} -{" "}
                                        {doc.signingMode}
                                    </p>
                                    {doc.progress && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs text-secondary-600 mb-1">
                                                <span>Signing progress</span>
                                                <span>
                                                    {doc.progress.completedSigners}/
                                                    {doc.progress.totalSigners}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-secondary-100">
                                                <div
                                                    className="h-2 rounded-full bg-primary-500"
                                                    style={{
                                                        width: `${doc.progress.completionPercentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                        getStatusColor(doc.status)
                                    )}
                                >
                                    {getStatusLabel(doc.status)}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-start">
                <div>
                    <div className="h-8 bg-secondary-200 rounded w-40"></div>
                    <div className="h-4 bg-secondary-200 rounded w-64 mt-2"></div>
                </div>
                <div className="h-10 bg-secondary-200 rounded w-36"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-secondary-200 rounded-lg"></div>
                            <div className="ml-4 flex-1">
                                <div className="h-6 bg-secondary-200 rounded w-24"></div>
                                <div className="h-4 bg-secondary-200 rounded w-28 mt-2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card p-6 space-y-4">
                        <div className="h-5 bg-secondary-200 rounded w-32"></div>
                        <div className="h-3 bg-secondary-200 rounded w-full"></div>
                        <div className="h-3 bg-secondary-200 rounded w-5/6"></div>
                        <div className="h-3 bg-secondary-200 rounded w-4/6"></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="card p-6 space-y-4">
                        <div className="h-5 bg-secondary-200 rounded w-32"></div>
                        <div className="h-24 bg-secondary-200 rounded"></div>
                    </div>
                ))}
            </div>

            <div className="card p-6 space-y-4">
                <div className="h-5 bg-secondary-200 rounded w-32"></div>
                <div className="h-20 bg-secondary-200 rounded"></div>
            </div>
        </div>
    );
}
