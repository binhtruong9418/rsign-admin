import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

// Custom toast styles matching our design system
const toastStyles = {
    success: {
        style: {
            border: "1px solid #10b981",
            padding: "16px",
            color: "#065f46",
            backgroundColor: "#d1fae5",
        },
        iconTheme: {
            primary: "#10b981",
            secondary: "#d1fae5",
        },
    },
    error: {
        style: {
            border: "1px solid #ef4444",
            padding: "16px",
            color: "#7f1d1d",
            backgroundColor: "#fee2e2",
        },
        iconTheme: {
            primary: "#ef4444",
            secondary: "#fee2e2",
        },
    },
    warning: {
        style: {
            border: "1px solid #f59e0b",
            padding: "16px",
            color: "#78350f",
            backgroundColor: "#fef3c7",
        },
        iconTheme: {
            primary: "#f59e0b",
            secondary: "#fef3c7",
        },
    },
    info: {
        style: {
            border: "1px solid #3b82f6",
            padding: "16px",
            color: "#1e3a8a",
            backgroundColor: "#dbeafe",
        },
        iconTheme: {
            primary: "#3b82f6",
            secondary: "#dbeafe",
        },
    },
};

// Enhanced toast functions with custom icons and styling
export const showToast = {
    success: (message: string, options?: any) => {
        return toast.success(message, {
            ...toastStyles.success,
            icon: "✅",
            duration: 4000,
            ...options,
        });
    },

    error: (message: string, options?: any) => {
        return toast.error(message, {
            ...toastStyles.error,
            icon: "❌",
            duration: 6000,
            ...options,
        });
    },

    warning: (message: string, options?: any) => {
        return toast(message, {
            ...toastStyles.warning,
            icon: "⚠️",
            duration: 5000,
            ...options,
        });
    },

    info: (message: string, options?: any) => {
        return toast(message, {
            ...toastStyles.info,
            icon: "ℹ️",
            duration: 4000,
            ...options,
        });
    },

    // Loading toast with promise handling
    promise: <T>(
        promise: Promise<T>,
        {
            loading = "Loading...",
            success = "Success!",
            error = "Something went wrong",
        }: {
            loading?: string;
            success?: string | ((data: T) => string);
            error?: string | ((error: any) => string);
        }
    ) => {
        return toast.promise(promise, {
            loading,
            success,
            error,
            // style: {
            //     border: "1px solid #e2e8f0",
            //     padding: "16px",
            //     color: "#1e293b",
            // },
        });
    },

    // Custom toast for API operations
    apiSuccess: (action: string, entity?: string) => {
        const message = entity
            ? `${entity} ${action} successfully`
            : `${action} completed successfully`;
        return showToast.success(message);
    },

    apiError: (action: string, error: any, entity?: string) => {
        let message = entity
            ? `Failed to ${action} ${entity}`
            : `Failed to ${action}`;

        // Add specific error message if available
        if (error?.error || error?.message) {
            message += `: ${error.error || error.message}`;
        }

        return showToast.error(message);
    },
};

// Common toast messages for the application
export const TOAST_MESSAGES = {
    // Authentication
    LOGIN_SUCCESS: "Welcome back! You have been logged in successfully.",
    LOGIN_ERROR: "Invalid email or password. Please try again.",
    LOGOUT_SUCCESS: "You have been logged out successfully.",

    // Documents
    DOCUMENT_CREATED: "Document created successfully and sent for signature.",
    DOCUMENT_UPDATED: "Document updated successfully.",
    DOCUMENT_DELETED: "Document deleted successfully.",
    DOCUMENT_UPLOAD_SUCCESS: "Document uploaded successfully.",
    DOCUMENT_UPLOAD_ERROR: "Failed to upload document. Please try again.",

    // Signer Groups
    GROUP_CREATED: "Signer group created successfully.",
    GROUP_UPDATED: "Signer group updated successfully.",
    GROUP_DELETED: "Signer group deleted successfully.",
    MEMBERS_ADDED: "Members added to the group successfully.",
    MEMBERS_REMOVED: "Members removed from the group successfully.",

    // General
    SAVE_SUCCESS: "Changes saved successfully.",
    SAVE_ERROR: "Failed to save changes. Please try again.",
    DELETE_CONFIRM: "Are you sure you want to delete this item?",
    NETWORK_ERROR: "Network error. Please check your connection and try again.",
    UNAUTHORIZED: "Your session has expired. Please log in again.",

    // Validation
    REQUIRED_FIELD: "This field is required.",
    INVALID_EMAIL: "Please enter a valid email address.",
    INVALID_FILE_TYPE: "Please select a valid file type.",
    FILE_TOO_LARGE: "File size is too large. Please select a smaller file.",
};

// Toast configuration for React Hot Toast
export const toastConfig = {
    position: "top-right" as const,
    toastOptions: {
        // Default options for all toasts
        duration: 4000,
        style: {
            background: "#fff",
            color: "#363636",
            fontFamily: "Inter, sans-serif",
        },
        // Success
        success: {
            duration: 4000,
            style: {
                background: "#f0f9ff",
                border: "1px solid #0ea5e9",
                color: "#0c4a6e",
            },
        },
        // Error
        error: {
            duration: 6000,
            style: {
                background: "#fef2f2",
                border: "1px solid #ef4444",
                color: "#7f1d1d",
            },
        },
    },
};

// Hook for handling API calls with toast notifications
export const useApiWithToast = () => {
    const handleApiCall = async <T>(
        apiCall: () => Promise<T>,
        {
            loadingMessage = "Processing...",
            successMessage = "Operation completed successfully",
            errorMessage = "An error occurred",
            showLoading = true,
        }: {
            loadingMessage?: string;
            successMessage?: string;
            errorMessage?: string;
            showLoading?: boolean;
        } = {}
    ): Promise<T | undefined> => {
        try {
            let result: T;

            if (showLoading) {
                result = await showToast.promise(apiCall(), {
                    loading: loadingMessage,
                    success: successMessage,
                    error: (error) =>
                        `${errorMessage}: ${
                            error?.error || error?.message || "Unknown error"
                        }`,
                });
            } else {
                result = await apiCall();
                showToast.success(successMessage);
            }

            return result;
        } catch (error) {
            console.error("API call failed:", error);
            if (!showLoading) {
                showToast.apiError("complete operation", error);
            }
            return undefined;
        }
    };

    return { handleApiCall };
};
