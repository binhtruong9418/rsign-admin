import type { DocumentStatus, SigningMode } from "@/types";

export interface DashboardStatistics {
    overview: OverviewMetrics;
    documents: DocumentMetrics;
    recentActivity: RecentActivityMetrics;
    signingProgress: SigningProgressMetrics;
    users: UserMetrics;
    topMetrics: TopMetrics;
}

export interface OverviewMetrics {
    totalDocuments: number;
    totalUsers: number;
    totalSignatures: number;
    totalTemplates: number;
}

export interface DocumentMetrics {
    draft: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    completionRate: number;
}

export interface RecentActivityMetrics {
    last24Hours: ActivityPeriod;
    last7Days: ActivityPeriod;
    last30Days: ActivityPeriod;
}

export interface ActivityPeriod {
    documentsCreated: number;
    documentsSigned: number;
    newUsers: number;
}

export interface SigningProgressMetrics {
    awaitingSignature: number;
    signedToday: number;
    averageSigningTime: number;
}

export interface UserMetrics {
    active: number;
    inactive: number;
    suspended: number;
    totalAdmins: number;
}

export interface TopMetrics {
    mostActiveUsers: MostActiveUser[];
    documentsNearDeadline: DocumentNearDeadline[];
    recentCompletedDocuments: RecentCompletedDocument[];
    recentDocuments: RecentDocument[];
}

export interface MostActiveUser {
    userId: string;
    userName: string;
    email: string;
    signaturesCount: number;
}

export interface DocumentNearDeadline {
    documentId: string;
    title: string;
    deadline: string;
    daysRemaining: number;
    status: DocumentStatus;
}

export interface RecentCompletedDocument {
    documentId: string;
    title: string;
    completedAt: string;
    totalSigners: number;
}

export interface RecentDocument {
    documentId: string;
    title: string;
    status: DocumentStatus;
    signingMode: SigningMode;
    createdAt: string;
    createdBy: {
        id: string;
        fullName: string;
        email: string;
    };
    progress?: {
        totalSigners: number;
        completedSigners: number;
        completionPercentage: number;
    };
}

export interface TimeSeriesData {
    date: string;
    documentsCreated: number;
    documentsCompleted: number;
    signaturesCreated: number;
}
