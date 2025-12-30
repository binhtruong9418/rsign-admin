import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    FileText,
    Plus,
    Trash2,
    Edit,
    Copy,
    Calendar,
    User,
    Layers,
} from 'lucide-react';
import { templatesAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import type { Document } from '@/types';

export default function TemplateList() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const limit = 10;

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['templates', currentPage],
        queryFn: () => templatesAPI.getTemplates({ page: currentPage, limit }),
    });

    const handleDelete = async (templateId: string, templateName: string) => {
        if (
            !confirm(
                `Delete template "${templateName}"?\n\nDocuments created from this template will not be affected.`
            )
        ) {
            return;
        }

        setDeletingId(templateId);
        try {
            const result = await templatesAPI.deleteTemplate(templateId);
            toast.success(
                `Template deleted successfully. ${result.affectedDocuments} documents were using this template.`
            );
            refetch();
        } catch (error: any) {
            toast.error(error.error || 'Failed to delete template');
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return <TemplateListSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load templates. Please try again.
                </div>
            </div>
        );
    }

    const templates = data?.items || [];
    const totalPages = data?.totalPages || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">
                        Document Templates
                    </h1>
                    <p className="text-secondary-600 mt-1">
                        Create reusable document templates for faster workflow
                    </p>
                </div>
                <Button onClick={() => navigate('/admin/documents/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            </div>

            {/* Stats */}
            {data && (
                <div className="flex items-center gap-4 text-sm text-secondary-600">
                    <span>
                        Total: <strong>{data.total}</strong> templates
                    </span>
                    <span>•</span>
                    <span>
                        Page {currentPage + 1} of {totalPages || 1}
                    </span>
                </div>
            )}

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="text-center py-12 card">
                    <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                        No templates yet
                    </h3>
                    <p className="text-secondary-600 mb-4">
                        Create your first document template to speed up your workflow
                    </p>
                    <Button onClick={() => navigate('/admin/documents/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Template
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="card p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Template Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-secondary-900 truncate">
                                            {template.templateName}
                                        </h3>
                                        <p className="text-xs text-secondary-500 truncate">
                                            {template.title}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Template Info */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-xs text-secondary-600">
                                    <User className="h-3 w-3 mr-1.5" />
                                    {template.createdBy?.fullName || 'Unknown'}
                                </div>
                                <div className="flex items-center text-xs text-secondary-600">
                                    <Calendar className="h-3 w-3 mr-1.5" />
                                    {formatDate(template.createdAt)}
                                </div>
                                <div className="flex items-center text-xs text-secondary-600">
                                    <Layers className="h-3 w-3 mr-1.5" />
                                    {template.totalSteps || 0} steps •{' '}
                                    {template.signatureZones?.length || 0} zones
                                </div>
                            </div>

                            {/* Signing Info */}
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="secondary" className="text-xs">
                                    {template.signingMode}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {template.signingFlow}
                                </Badge>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() =>
                                        navigate(
                                            `/admin/templates/${template.id}/use`
                                        )
                                    }
                                    className="flex-1"
                                >
                                    <Copy className="h-3 w-3 mr-1.5" />
                                    Use Template
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        navigate(`/admin/documents/${template.id}`)
                                    }
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handleDelete(
                                            template.id,
                                            template.templateName || template.title
                                        )
                                    }
                                    disabled={deletingId === template.id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}

function TemplateListSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 bg-secondary-200 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-secondary-200 rounded w-96"></div>
                </div>
                <div className="h-10 bg-secondary-200 rounded w-32"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card p-6">
                        <div className="flex items-start space-x-3 mb-4">
                            <div className="w-10 h-10 bg-secondary-200 rounded-lg"></div>
                            <div className="flex-1">
                                <div className="h-5 bg-secondary-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-3 bg-secondary-200 rounded w-full"></div>
                            <div className="h-3 bg-secondary-200 rounded w-full"></div>
                            <div className="h-3 bg-secondary-200 rounded w-2/3"></div>
                        </div>
                        <div className="flex gap-2 mb-4">
                            <div className="h-5 bg-secondary-200 rounded w-16"></div>
                            <div className="h-5 bg-secondary-200 rounded w-20"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 bg-secondary-200 rounded flex-1"></div>
                            <div className="h-8 bg-secondary-200 rounded w-8"></div>
                            <div className="h-8 bg-secondary-200 rounded w-8"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
