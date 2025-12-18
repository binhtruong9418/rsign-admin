import axios, { type AxiosError, type AxiosResponse } from "axios";
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
} from "@/types"; // Create axios instance with base configuration
import { JWT_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/constant";

export const api = axios.create({
    baseURL: "https://api-beta.rsign.io.vn/api", // This will be proxied by Vite to your backend
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = storage.get<string>(JWT_STORAGE_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError<ApiError>) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
            // Clear stored auth data
            storage.remove(JWT_STORAGE_KEY);
            storage.remove(USER_STORAGE_KEY);

            // Redirect to login if not already there
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
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
    }
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
};

export const documentsAPI = {
    getDocuments: async (
        params: EnhancedDocumentFilters
    ): Promise<PaginationResponse<Document>> => {
        const response = await api.get("/admin/documents", { params });
        return response.data;
    },

    getDocument: async (id: string): Promise<Document> => {
        const response = await api.get(`/admin/documents/${id}`);
        return response.data;
    },

    createDocument: async (
        documentData: CreateDocumentRequest
    ): Promise<DocumentCreateResponse> => {
        const response = await api.post("/admin/documents", documentData);
        return response.data;
    },

    createIndividualDocument: async (
        documentData: Partial<CreateDocumentRequest>
    ): Promise<DocumentCreateResponse> => {
        const response = await api.post(
            "/admin/documents/individual",
            documentData
        );
        return response.data;
    },

    getDocumentProgress: async (
        id: string
    ): Promise<DocumentProgressResponse> => {
        const response = await api.get(`/admin/documents/${id}/progress`);
        return response.data;
    },

    sendDocument: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.post(`/admin/documents/${id}/send`);
        return response.data;
    },

    getBatchDocuments: async (
        batchId: string
    ): Promise<PaginationResponse<Document>> => {
        const response = await api.get(`/admin/documents/batch/${batchId}`);
        return response.data;
    },

    uploadDocument: async (
        request: UploadUrlRequest
    ): Promise<UploadUrlResponse> => {
        const response = await api.post("/admin/documents/upload-url", request);
        return response.data;
    },

    // Helper method to upload file using presigned URL
    uploadFileToPresignedUrl: async (
        presignedUrl: string,
        file: File
    ): Promise<void> => {
        await fetch(presignedUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type,
            },
        });
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
        groupData: CreateSignerGroupRequest
    ): Promise<SignerGroup> => {
        const response = await api.post("/admin/signer-groups", groupData);
        return response.data;
    },

    updateSignerGroup: async (
        id: string,
        groupData: { name: string; description?: string }
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
        userIds: string[]
    ): Promise<{ success: boolean }> => {
        const response = await api.post(`/admin/signer-groups/${id}/members`, {
            userIds,
        });
        return response.data;
    },

    removeMember: async (
        groupId: string,
        userId: string
    ): Promise<{ success: boolean }> => {
        const response = await api.delete(
            `/admin/signer-groups/${groupId}/members/${userId}`
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
        documentSignerId: string
    ): Promise<DocumentSigningDetails> => {
        const response = await api.get(
            `/documents/${documentSignerId}/details`
        );
        return response.data;
    },

    checkout: async (documentSignerId: string): Promise<CheckoutResponse> => {
        const response = await api.post(
            `/documents/${documentSignerId}/checkout`
        );
        return response.data;
    },

    submitSignature: async (
        request: SignDocumentRequest
    ): Promise<{ success: boolean }> => {
        const response = await api.post("/documents/sign", request);
        return response.data;
    },

    declineDocument: async (
        documentSignerId: string,
        reason: string
    ): Promise<{ success: boolean }> => {
        const response = await api.post(
            `/documents/${documentSignerId}/decline`,
            { reason }
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
        params: DocumentBatchFilters
    ): Promise<PaginationResponse<DocumentBatch>> => {
        const response = await api.get("/admin/document-batches", { params });
        return response.data;
    },

    getDocumentBatch: async (batchId: string): Promise<DocumentBatch> => {
        const response = await api.get(`/admin/document-batches/${batchId}`);
        return response.data;
    },

    sendDocumentBatch: async (batchId: string): Promise<BatchSendResponse> => {
        const response = await api.post(
            `/admin/document-batches/${batchId}/send`
        );
        return response.data;
    },

    getBatchDocuments: async (
        batchId: string,
        params?: { page?: number; limit?: number }
    ): Promise<PaginationResponse<Document>> => {
        const response = await api.get(`/admin/documents/batch/${batchId}`, {
            params,
        });
        return response.data;
    },
};
