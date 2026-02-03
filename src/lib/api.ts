import axios, {
    type AxiosError,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";
import { storage } from "@/lib/utils";
import type {
    ApiError,
    LoginResponse,
    CreateDocumentRequest,
    DocumentCreateResponse,
    CreateSignerGroupRequest,
    UploadUrlRequest,
    UploadUrlResponse,
    PaginationResponse,
    User,
    Document,
    SignerGroup,
    DocumentProgressResponse,
    PendingDocumentItem,
    DocumentSigningDetails,
    CheckoutResponse,
    SignDocumentRequest,
    DocumentBatch,
    DocumentBatchFilters,
    EnhancedDocumentFilters,
    BatchSendResponse,
    AdminDocumentDetail,
    DashboardStatistics,
    TimeSeriesData,
    RefreshTokenResponse,
    SessionTimeoutConfig,
} from "@/types"; // Create axios instance with base configuration
import {
    JWT_STORAGE_KEY,
    USER_STORAGE_KEY,
    REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/constant";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // This will be proxied by Vite to your backend
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Flag để tránh refresh loop
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Thêm token vào queue để retry sau khi refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

// Thực thi tất cả request đang chờ với token mới
const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = storage.get<string>(JWT_STORAGE_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Tránh retry endpoint refresh-token
            if (originalRequest.url?.includes("/refresh-token")) {
                storage.remove(JWT_STORAGE_KEY);
                storage.remove(REFRESH_TOKEN_STORAGE_KEY);
                storage.remove(USER_STORAGE_KEY);
                window.location.href = "/login";
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            // Nếu đang refresh, queue request này
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const refreshToken = storage.get<string>(
                    REFRESH_TOKEN_STORAGE_KEY,
                );

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                // Gọi API refresh token
                const response = await axios.post<RefreshTokenResponse>(
                    `${import.meta.env.VITE_API_URL}/users/refresh-token`,
                    { refreshToken },
                );

                const { accessToken } = response.data;

                // Lưu access token mới
                storage.set(JWT_STORAGE_KEY, accessToken);

                // Cập nhật header cho request ban đầu
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                // Thực thi các request đang chờ
                onRefreshed(accessToken);

                isRefreshing = false;

                // Retry request ban đầu
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                refreshSubscribers = [];

                // Refresh token hết hạn hoặc không hợp lệ -> Logout
                storage.remove(JWT_STORAGE_KEY);
                storage.remove(REFRESH_TOKEN_STORAGE_KEY);
                storage.remove(USER_STORAGE_KEY);
                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        // Handle network errors
        if (!error.response) {
            return Promise.reject({
                error: "Network Error",
                message:
                    "Unable to connect to the server. Please check your internet connection.",
            });
        }

        // Return formatted error
        const errorMessage =
            error.response.data?.error ||
            error.response.data?.message ||
            "An unexpected error occurred";

        return Promise.reject({
            error: errorMessage,
            statusCode: error.response.status,
        });
    },
);

// API endpoints
export const authAPI = {
    login: async (credentials: {
        email: string;
        password: string;
    }): Promise<LoginResponse> => {
        const response = await api.post("/users/login", credentials);
        return response.data;
    },

    register: async (userData: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<User> => {
        const response = await api.post("/users/register", userData);
        return response.data;
    },

    loginHust: async (credentials: {
        email: string;
        password: string;
    }): Promise<LoginResponse> => {
        const response = await api.post("/users/login-hust", credentials);
        return response.data;
    },

    refreshToken: async (
        refreshToken: string,
    ): Promise<RefreshTokenResponse> => {
        const response = await axios.post<RefreshTokenResponse>(
            `${import.meta.env.VITE_API_URL}/users/refresh-token`,
            { refreshToken },
        );
        return response.data;
    },
};

export const documentsAPI = {
    getDocuments: async (
        params: EnhancedDocumentFilters,
    ): Promise<PaginationResponse<Document>> => {
        const response = await api.get("/admin/documents", { params });
        return response.data;
    },

    getDocument: async (id: string): Promise<AdminDocumentDetail> => {
        const response = await api.get(`/admin/documents/${id}`);
        return response.data;
    },

    createDocument: async (
        documentData: CreateDocumentRequest,
    ): Promise<DocumentCreateResponse> => {
        const response = await api.post("/admin/documents", documentData);
        return response.data;
    },

    updateDocument: async (
        id: string,
        documentData: Partial<CreateDocumentRequest>,
    ): Promise<{ success: boolean; document: any }> => {
        const response = await api.put(`/admin/documents/${id}`, documentData);
        return response.data;
    },

    createIndividualDocument: async (
        documentData: Partial<CreateDocumentRequest>,
    ): Promise<DocumentCreateResponse> => {
        const response = await api.post(
            "/admin/documents/individual",
            documentData,
        );
        return response.data;
    },

    getDocumentProgress: async (
        id: string,
    ): Promise<DocumentProgressResponse> => {
        const response = await api.get(`/admin/documents/${id}/progress`);
        return response.data;
    },

    sendDocument: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.post(`/admin/documents/${id}/send`);
        return response.data;
    },

    deleteDocument: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/admin/documents/${id}`);
        return response.data;
    },

    getBatchDocuments: async (
        batchId: string,
    ): Promise<PaginationResponse<Document>> => {
        const response = await api.get(`/admin/documents/batch/${batchId}`);
        return response.data;
    },

    uploadDocument: async (
        request: UploadUrlRequest,
    ): Promise<UploadUrlResponse> => {
        const response = await api.post("/admin/documents/upload-url", request);
        return response.data;
    },

    // Helper method to upload file using presigned URL
    uploadFileToPresignedUrl: async (
        presignedUrl: string,
        file: File,
    ): Promise<void> => {
        await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type,
            },
        });
    },

    // Validate uploaded PDF file
    validateFile: async (
        fileUrl: string,
    ): Promise<{
        isValid: boolean;
        message: string;
        detectedSource?: string;
    }> => {
        const response = await api.post("/admin/documents/validate-file", {
            fileUrl,
        });
        return response.data;
    },
};

export const signerGroupsAPI = {
    getSignerGroups: async (params: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<PaginationResponse<SignerGroup>> => {
        const response = await api.get("/admin/signer-groups", { params });
        return response.data;
    },

    getSignerGroup: async (id: string): Promise<SignerGroup> => {
        const response = await api.get(`/admin/signer-groups/${id}`);
        return response.data;
    },

    createSignerGroup: async (
        groupData: CreateSignerGroupRequest,
    ): Promise<SignerGroup> => {
        const response = await api.post("/admin/signer-groups", groupData);
        return response.data;
    },

    updateSignerGroup: async (
        id: string,
        groupData: { name: string; description?: string },
    ): Promise<SignerGroup> => {
        const response = await api.put(`/admin/signer-groups/${id}`, groupData);
        return response.data;
    },

    deactivateGroup: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`/admin/signer-groups/${id}`);
        return response.data;
    },

    addMembers: async (
        id: string,
        userIds: string[],
    ): Promise<{ success: boolean }> => {
        const response = await api.post(`/admin/signer-groups/${id}/members`, {
            userIds,
        });
        return response.data;
    },

    removeMember: async (
        groupId: string,
        userId: string,
    ): Promise<{ success: boolean }> => {
        const response = await api.delete(
            `/admin/signer-groups/${groupId}/members/${userId}`,
        );
        return response.data;
    },
};

export const usersAPI = {
    getUsers: async (params: {
        page?: number;
        limit?: number;
        email?: string;
        fullName?: string;
        status?: string;
        role?: string;
    }): Promise<PaginationResponse<User>> => {
        const response = await api.get("/admin/users", { params });
        return response.data;
    },

    getUser: async (id: string): Promise<User> => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    createUser: async (userData: {
        email: string;
        password: string;
        fullName: string;
        phoneNumber?: string;
        role: "USER" | "ADMIN";
    }): Promise<User> => {
        const response = await api.post("/admin/users", userData);
        return response.data;
    },

    updateUserStatus: async (
        userId: string,
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
    ): Promise<User> => {
        const response = await api.patch(`/admin/users/${userId}/status`, {
            status,
        });
        return response.data;
    },
};

// User - Signing Workflow API (for user interface, not admin)
export const signingAPI = {
    getPendingDocuments: async (params: {
        page?: number;
        limit?: number;
    }): Promise<PaginationResponse<PendingDocumentItem>> => {
        const response = await api.get("/documents/pending", { params });
        return response.data;
    },

    getDocumentDetails: async (
        documentSignerId: string,
    ): Promise<DocumentSigningDetails> => {
        const response = await api.get(
            `/documents/${documentSignerId}/details`,
        );
        return response.data;
    },

    checkout: async (documentSignerId: string): Promise<CheckoutResponse> => {
        const response = await api.post(
            `/documents/${documentSignerId}/checkout`,
        );
        return response.data;
    },

    submitSignature: async (
        request: SignDocumentRequest,
    ): Promise<{ success: boolean }> => {
        const response = await api.post("/documents/sign", request);
        return response.data;
    },

    declineDocument: async (
        documentSignerId: string,
        reason: string,
    ): Promise<{ success: boolean }> => {
        const response = await api.post(
            `/documents/${documentSignerId}/decline`,
            { reason },
        );
        return response.data;
    },

    getSigningHistory: async (params: {
        page?: number;
        limit?: number;
    }): Promise<PaginationResponse<any>> => {
        const response = await api.get("/documents/history", { params });
        return response.data;
    },
};

// Document Batch Management API
export const documentBatchAPI = {
    getDocumentBatches: async (
        params: DocumentBatchFilters,
    ): Promise<PaginationResponse<DocumentBatch>> => {
        const response = await api.get("/admin/documents/batches", { params });
        return response.data;
    },

    getDocumentBatch: async (batchId: string): Promise<DocumentBatch> => {
        const response = await api.get(`/admin/documents/batches/${batchId}`);
        return response.data;
    },

    sendDocumentBatch: async (batchId: string): Promise<BatchSendResponse> => {
        const response = await api.post(
            `/admin/documents/batches/${batchId}/send`,
        );
        return response.data;
    },

    getBatchDocuments: async (
        batchId: string,
        params?: { page?: number; limit?: number },
    ): Promise<PaginationResponse<Document>> => {
        const response = await api.get(`/admin/documents/batch/${batchId}`, {
            params,
        });
        return response.data;
    },
};

// Template Management API
export const templatesAPI = {
    // Get presigned URL for template file upload
    getUploadUrl: async (request: {
        fileName: string;
    }): Promise<{
        success: true;
        presignedUrl: string;
        fileUrl: string;
    }> => {
        const response = await api.post("/admin/templates/upload-url", request);
        return response.data;
    },

    // Upload file to presigned URL
    uploadFileToPresignedUrl: async (
        presignedUrl: string,
        file: File,
    ): Promise<void> => {
        await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": "application/pdf",
            },
        });
    },

    // Create new template
    createTemplate: async (
        data: any,
    ): Promise<{
        success: true;
        template: any;
    }> => {
        const response = await api.post("/admin/templates", data);
        return response.data;
    },

    // List templates with filters
    getTemplates: async (params: {
        page?: number;
        limit?: number;
        search?: string;
        signingMode?: string;
        signingFlow?: string;
    }): Promise<{
        items: any[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }> => {
        const response = await api.get("/admin/templates", { params });
        return response.data;
    },

    // Get template detail
    getTemplate: async (
        templateId: string,
    ): Promise<{
        success: true;
        template: any;
    }> => {
        const response = await api.get(`/admin/templates/${templateId}`);
        return response.data;
    },

    // Update template
    updateTemplate: async (
        templateId: string,
        data: any,
    ): Promise<{
        success: true;
        template: any;
    }> => {
        const response = await api.put(`/admin/templates/${templateId}`, data);
        return response.data;
    },

    // Delete template
    deleteTemplate: async (
        templateId: string,
    ): Promise<{
        success: true;
        message: string;
    }> => {
        const response = await api.delete(`/admin/templates/${templateId}`);
        return response.data;
    },

    // Duplicate template
    duplicateTemplate: async (
        templateId: string,
        newTemplateName: string,
    ): Promise<{
        success: true;
        template: any;
    }> => {
        const response = await api.post(
            `/admin/templates/${templateId}/duplicate`,
            {
                newTemplateName,
            },
        );
        return response.data;
    },

    // Create document from template
    createDocumentFromTemplate: async (
        data: any,
    ): Promise<{
        success: true;
        document?: any;
        documents?: any[];
        batchId?: string;
    }> => {
        const response = await api.post("/admin/documents/from-template", data);
        return response.data;
    },

    // Validate uploaded PDF file
    validateFile: async (
        fileUrl: string,
    ): Promise<{
        isValid: boolean;
        message: string;
        detectedSource?: string;
    }> => {
        const response = await api.post("/admin/templates/validate-file", {
            fileUrl,
        });
        return response.data;
    },
};

export const statisticsAPI = {
    getDashboardStatistics: async (): Promise<DashboardStatistics> => {
        const response = await api.get("/admin/statistics/dashboard");
        return response.data;
    },

    getTimeSeries: async (days = 30): Promise<TimeSeriesData[]> => {
        const response = await api.get("/admin/statistics/time-series", {
            params: { days },
        });
        return response.data;
    },
};

// Admin Config API - Session Timeout
export const adminConfigAPI = {
    getSessionConfig: async (): Promise<SessionTimeoutConfig> => {
        const response = await api.get("/admin/config/session");
        return response.data;
    },

    updateSessionConfig: async (
        timeoutMinutes: number,
    ): Promise<SessionTimeoutConfig> => {
        const response = await api.put("/admin/config/session", {
            timeoutMinutes,
        });
        return response.data;
    },
};
