import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DocumentStatus } from "@/types";

// Utility function for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format date utilities
export const formatDate = (
    date: string | Date,
    format: "short" | "long" | "relative" = "short"
): string => {
    const dateObj = new Date(date);

    switch (format) {
        case "short":
            return dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        case "long":
            return dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        case "relative":
            const now = new Date();
            const diffInHours =
                Math.abs(now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

            if (diffInHours < 1) {
                const minutes = Math.floor(diffInHours * 60);
                return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
            } else if (diffInHours < 24) {
                const hours = Math.floor(diffInHours);
                return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
            } else if (diffInHours < 24 * 7) {
                const days = Math.floor(diffInHours / 24);
                return `${days} day${days !== 1 ? "s" : ""} ago`;
            } else {
                return formatDate(date, "short");
            }
        default:
            return dateObj.toLocaleDateString();
    }
};

// Status utilities
export const getStatusColor = (status: DocumentStatus): string => {
    const colors = {
        [DocumentStatus.DRAFT]: "text-status-draft bg-status-draft/10",
        [DocumentStatus.PENDING]: "text-status-pending bg-status-pending/10",
        [DocumentStatus.IN_PROGRESS]:
            "text-status-in-progress bg-status-in-progress/10",
        [DocumentStatus.COMPLETED]:
            "text-status-completed bg-status-completed/10",
        [DocumentStatus.CANCELLED]:
            "text-status-cancelled bg-status-cancelled/10",
        [DocumentStatus.REJECTED]: "text-red-700 bg-red-100",
        [DocumentStatus.EXPIRED]: "text-orange-700 bg-orange-100",
    };
    return colors[status] || colors[DocumentStatus.DRAFT];
};

export const getStatusLabel = (status: DocumentStatus): string => {
    const labels = {
        [DocumentStatus.DRAFT]: "Draft",
        [DocumentStatus.PENDING]: "Pending",
        [DocumentStatus.IN_PROGRESS]: "In Progress",
        [DocumentStatus.COMPLETED]: "Completed",
        [DocumentStatus.CANCELLED]: "Cancelled",
        [DocumentStatus.REJECTED]: "Rejected",
        [DocumentStatus.EXPIRED]: "Expired",
    };
    return labels[status] || "Unknown";
};

// File utilities
export const formatFileSize = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (
    password: string
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }

    if (!/(?=.*[a-z])/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }

    if (!/(?=.*\d)/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Local storage utilities with error handling
export const storage = {
    set: (key: string, value: any): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
        }
    },

    get: <T>(key: string, defaultValue: T | null = null): T | null => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error("Failed to read from localStorage:", error);
            return defaultValue;
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Failed to remove from localStorage:", error);
        }
    },

    clear: (): void => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error("Failed to clear localStorage:", error);
        }
    },
};

// Signer color utilities
export const getSignerColor = (signerIndex: number): string => {
    const colors = [
        "bg-signer-1",
        "bg-signer-2",
        "bg-signer-3",
        "bg-signer-4",
        "bg-signer-5",
        "bg-signer-6",
    ];
    return colors[signerIndex % colors.length];
};

export const getSignerColorHex = (signerIndex: number): string => {
    const colors = [
        "#3b82f6", // Blue
        "#10b981", // Green
        "#f59e0b", // Yellow
        "#ef4444", // Red
        "#8b5cf6", // Purple
        "#ec4899", // Pink
    ];
    return colors[signerIndex % colors.length];
};
