import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PDFViewerComplete, type Zone } from '@/components/pdf';
import { storage } from "@/lib/utils";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
    ArrowLeft,
    FileText,
    Users,
    Download,
    User,
    Clock,
    Activity,
    PlayCircle,
    Smartphone,
    Globe,
    Fingerprint,
    Calendar,
    CheckCircle,
    XCircle,
    Send,
    Eye,
    CheckCheck,
    AlertTriangle,
    Trash2,
} from 'lucide-react';
import { formatDate, getStatusLabel, cn } from '@/lib/utils';
import { documentsAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { JWT_STORAGE_KEY } from '@/lib/constant';
import '@/lib/pdf-worker';

type TabType = 'overview' | 'signatures' | 'timeline' | 'audit';

export default function DocumentDetailNew() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Send document mutation
    const sendDocumentMutation = useMutation({
        mutationFn: () => documentsAPI.sendDocument(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-document-detail', id] });
            showToast.success('Document sent for signing successfully');
        },
        onError: (error: any) => {
            showToast.error(error?.message || 'Failed to send document');
        },
    });

    // Delete document mutation
    const deleteDocumentMutation = useMutation({
        mutationFn: () => documentsAPI.deleteDocument(id!),
        onSuccess: () => {
            showToast.success('Document deleted successfully');
            navigate('/admin/documents');
        },
        onError: (error: any) => {
            showToast.error(error?.message || 'Failed to delete document');
        },
    });

    const { data: documentDetail, isLoading, error } = useQuery({
        queryKey: ['admin-document-detail', id],
        queryFn: () => documentsAPI.getDocument(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error || !documentDetail) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 text-sm">
                    Failed to load document. Please try again.
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate('/admin/documents')}
                    className="mt-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Documents
                </Button>
            </div>
        );
    }

    const { document, files, progress, timeline, signers, zones, steps, activities } = documentDetail;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/documents')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-secondary-900">{document.title}</h1>
                            <Badge
                                variant={document.status === 'COMPLETED' ? 'success' :
                                    document.status === 'IN_PROGRESS' ? 'warning' :
                                        document.status === 'CANCELLED' || document.status === 'REJECTED' ? 'danger' : 'default'}
                            >
                                {getStatusLabel(document.status)}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-secondary-600 mt-1">
                            <span>Created {formatDate(document.createdAt)}</span>
                            <span>by {document.createdBy.fullName}</span>
                            {document.deadline && (
                                <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Due {formatDate(document.deadline)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {document.status === 'DRAFT' && (
                        <>
                            <Button
                                onClick={() => {
                                    if (confirm('Are you sure you want to send this document for signing?')) {
                                        sendDocumentMutation.mutate();
                                    }
                                }}
                                disabled={sendDocumentMutation.isPending}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {sendDocumentMutation.isPending ? 'Sending...' : 'Send Document'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                                        deleteDocumentMutation.mutate();
                                    }
                                }}
                                disabled={deleteDocumentMutation.isPending}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                        </>
                    )}
                    {files.original && (
                        <Button variant="outline" onClick={() => window.open(files.original, '_blank')}>
                            <FileText className="h-4 w-4 mr-2" />
                            Download Original
                        </Button>
                    )}
                    {files.display && document.status !== 'COMPLETED' && (
                        <Button variant="outline" onClick={() => window.open(files.display, '_blank')}>
                            <Activity className="h-4 w-4 mr-2" />
                            Download Current
                        </Button>
                    )}
                    {files.signed && (
                        <Button onClick={() => window.open(files.signed!, '_blank')}>
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Download Signed
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-secondary-600">Progress</span>
                        <span className="text-xs text-secondary-500">{progress.percentage}%</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-secondary-900">
                            {progress.signed}/{progress.signed + progress.pending + progress.declined}
                        </p>
                        {/* Multi-color progress bar */}
                        <div className="w-full bg-secondary-200 rounded-full h-2 flex overflow-hidden">
                            <div
                                className="bg-green-500 h-2 transition-all"
                                style={{ width: `${((progress.signed / (progress.signed + progress.pending + progress.declined)) * 100) || 0}%` }}
                            />
                            <div
                                className="bg-red-500 h-2 transition-all"
                                style={{ width: `${((progress.declined / (progress.signed + progress.pending + progress.declined)) * 100) || 0}%` }}
                            />
                            <div
                                className="bg-yellow-500 h-2 transition-all"
                                style={{ width: `${((progress.pending / (progress.signed + progress.pending + progress.declined)) * 100) || 0}%` }}
                            />
                        </div>
                        {/* Statistics */}
                        <div className="flex items-center gap-4 text-xs text-secondary-600">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Signed: {progress.signed}</span>
                            </div>
                            {progress.declined > 0 && (
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span>Declined: {progress.declined}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span>Pending: {progress.pending}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 text-primary-600 mr-2" />
                        <span className="text-sm font-medium text-secondary-600">Signing Mode</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary-900">
                        {document.mode === 'MULTI' ? 'Multi-Signature' : document.mode}
                    </p>
                    <p className="text-sm text-secondary-600 mt-1">{document.flow} Flow</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-secondary-600">Current Step</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary-900">
                        {progress.current} of {progress.total}
                    </p>
                </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-secondary-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: FileText },
                        { id: 'signatures', label: 'Signatures', icon: PlayCircle },
                        { id: 'timeline', label: 'Timeline', icon: Clock },
                        { id: 'audit', label: 'Audit Trail', icon: Activity },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                'flex items-center py-4 px-1 border-b-2 font-medium text-sm',
                                activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                            )}
                        >
                            <tab.icon className="h-4 w-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'overview' && (
                    <OverviewTab
                        document={document}
                        files={files}
                        progress={progress}
                        timeline={timeline}
                        signers={signers}
                        steps={steps}
                        zones={zones}
                    />
                )}
                {activeTab === 'signatures' && <SignaturesTab zones={zones} />}
                {activeTab === 'timeline' && <TimelineTab timeline={timeline} document={document} />}
                {activeTab === 'audit' && <AuditTrailTab activities={activities} />}
            </div>
        </div>
    );
}

// Overview Tab Component
function OverviewTab({ document, files, progress, timeline, signers, steps, zones }: any) {
    const previewFile = files.display || files.signed || files.original;

    // Transform zones to Zone format
    const transformedZones: Zone[] = (zones || [])
        .filter((zone: any) => zone.position)
        .map((zone: any) => ({
            id: zone.id,
            page: zone.page,
            x: zone.position.x,
            y: zone.position.y,
            width: zone.position.w,
            height: zone.position.h,
            label: zone.label || zone.signer?.user?.fullName || 'Signature',
            color: '#2563eb',
        }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Viewer - Takes 2 columns */}
            <div className="lg:col-span-2">
                <Card>
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900">Document Preview</h3>
                    </div>
                    <div className="p-6">
                        <PDFViewerComplete
                            fileUrl={previewFile}
                            zones={transformedZones}
                            showZonesDefault={false}
                            maxHeight="700px"
                        />
                    </div>
                </Card>
            </div>

            {/* Right Sidebar - Document Info & Signers */}
            <div className="space-y-6">
                {/* Timeline Summary */}
                <Card>
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900">Timeline</h3>
                    </div>
                    <div className="p-6 space-y-3">
                        <div className="flex items-start space-x-3">
                            <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-secondary-900">Created</p>
                                <p className="text-xs text-secondary-600">{formatDate(timeline.created.at)}</p>
                            </div>
                        </div>
                        {timeline.deadline && (
                            <div className="flex items-start space-x-3">
                                <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-secondary-900">Deadline</p>
                                    <p className="text-xs text-secondary-600">{formatDate(timeline.deadline)}</p>
                                </div>
                            </div>
                        )}
                        {timeline.completed && (
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-secondary-900">Completed</p>
                                    <p className="text-xs text-secondary-600">{formatDate(timeline.completed)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Signers List */}
                <Card>
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900">
                            Signers ({signers.length})
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {signers.map((signer: any) => (
                                <div key={signer.id} className="p-3 bg-secondary-50 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-medium">
                                                {signer.user.fullName.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary-900 truncate">{signer.user.fullName}</p>
                                            <p className="text-xs text-secondary-600 truncate">{signer.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-secondary-500">Step {signer.stepOrder}</span>
                                        <Badge
                                            variant={
                                                signer.status === 'SIGNED' ? 'success' :
                                                    signer.status === 'DECLINED' ? 'danger' :
                                                        signer.status === 'PENDING' ? 'warning' : 'default'
                                            }
                                            className="text-xs"
                                        >
                                            {signer.status === 'SIGNED' ? '✓ Signed' :
                                                signer.status === 'DECLINED' ? '✗ Declined' :
                                                    signer.status === 'PENDING' ? '⏳ Pending' :
                                                        signer.status === 'WAITING' ? '⏸ Waiting' : signer.status}
                                        </Badge>
                                    </div>
                                    {signer.signedAt && (
                                        <p className="text-xs text-secondary-500 mt-1">
                                            Signed {formatDate(signer.signedAt)}
                                        </p>
                                    )}
                                    {signer.status === 'DECLINED' && signer.declinedAt && (
                                        <div className="mt-3 p-2 bg-red-50 rounded border-l-4 border-red-500">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-red-900">Declined Reason:</p>
                                                    <p className="text-xs text-red-800 mt-1">{signer.declineReason || 'No reason provided'}</p>
                                                    <p className="text-xs text-red-600 mt-1">{formatDate(signer.declinedAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Signatures Tab Component
function SignaturesTab({ zones }: any) {
    const [selectedZone, setSelectedZone] = useState<any>(null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zones List */}
            <div className="lg:col-span-1">
                <Card>
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900">
                            Signature Zones ({zones.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-secondary-200">
                        {zones.map((zone: any, index: number) => (
                            <button
                                key={zone.id}
                                onClick={() => setSelectedZone(zone)}
                                className={cn(
                                    'w-full p-4 text-left hover:bg-secondary-50 transition-colors',
                                    selectedZone?.id === zone.id && 'bg-primary-50'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-secondary-900">
                                            Zone #{index + 1} • Page {zone.page}
                                        </p>
                                        {zone.label && (
                                            <p className="text-xs text-secondary-600 mt-1">{zone.label}</p>
                                        )}
                                    </div>
                                    {zone.signer && (
                                        <Badge variant={zone.signer.status === 'SIGNED' ? 'success' : 'warning'}>
                                            {zone.signer.status}
                                        </Badge>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Signature Detail */}
            <div className="lg:col-span-2">
                {selectedZone ? (
                    <SignatureDetail zone={selectedZone} />
                ) : (
                    <Card className="p-12 text-center">
                        <FileText className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                        <p className="text-secondary-600">Select a zone to view signature details</p>
                    </Card>
                )}
            </div>
        </div>
    );
}

// Signature Detail Component
function SignatureDetail({ zone }: { zone: any }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

    if (!zone.signer) {
        return (
            <Card className="p-12 text-center">
                <User className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                <p className="text-secondary-600">No signature for this zone yet</p>
            </Card>
        );
    }

    const { signer } = zone;

    // Fetch preview image with JWT
    useEffect(() => {
        const fetchPreviewImage = async () => {
            if (!signer.signature?.previewUrl) return;

            try {
                const token = storage.get<string>(JWT_STORAGE_KEY);
                const response = await fetch(
                    `${signer.signature.previewUrl}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    setPreviewBlobUrl(blobUrl);
                }
            } catch (error) {
                console.error('Failed to fetch signature preview:', error);
            }
        };

        fetchPreviewImage();

        return () => {
            if (previewBlobUrl) {
                URL.revokeObjectURL(previewBlobUrl);
            }
        };
    }, [signer.signature?.previewUrl]);

    return (
        <div className="space-y-6">
            {/* Signer Information */}
            <Card>
                <div className="px-6 py-4 border-b border-secondary-200">
                    <h3 className="text-lg font-semibold text-secondary-900">Signer Information</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg font-medium">
                                {signer.user.fullName.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium text-secondary-900">{signer.user.fullName}</p>
                            <p className="text-sm text-secondary-600">{signer.user.email}</p>
                        </div>
                    </div>

                    {signer.signedAt && (
                        <div className="pt-4 border-t border-secondary-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="font-medium text-secondary-600">Signed At</label>
                                    <p className="text-secondary-900">{formatDate(signer.signedAt)}</p>
                                </div>
                                <div>
                                    <label className="font-medium text-secondary-600">Status</label>
                                    <div className="mt-1">
                                        <Badge variant="success">{signer.status}</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Signature Preview */}
            {signer.signature && (
                <Card>
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900">Signature</h3>
                    </div>
                    <div className="p-6">
                        {/* Signature Preview/Animation Container */}
                        <div className="border-2 border-secondary-200 rounded-lg p-4 bg-secondary-50 mb-4 flex items-center justify-center" style={{ minHeight: '200px' }}>
                            {!isPlaying ? (
                                previewBlobUrl ? (
                                    <img
                                        src={previewBlobUrl}
                                        alt="Signature"
                                        className="max-w-full max-h-full object-contain"
                                        style={{ maxHeight: '180px' }}
                                    />
                                ) : (
                                    <div className="text-secondary-400 text-sm">Loading signature...</div>
                                )
                            ) : (
                                <SignaturePlayback
                                    playbackData={signer.signature.playback}
                                    onComplete={() => setIsPlaying(false)}
                                />
                            )}
                        </div>

                        {/* Replay Button */}
                        {signer.signature.playback && (
                            <Button
                                variant="outline"
                                onClick={() => setIsPlaying(true)}
                                disabled={isPlaying}
                                className="w-full mb-4"
                            >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                {isPlaying ? 'Playing...' : 'Replay Signature'}
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {/* Device & Verification Info */}
            {(signer.ip || signer.device) && (
                <Card>
                    <div className="px-6 py-4 border-b border-secondary-200">
                        <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                            <Activity className="h-5 w-5 mr-2" />
                            Verification Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {signer.ip && (
                            <div className="flex items-start space-x-3">
                                <Globe className="h-5 w-5 text-secondary-400 mt-0.5" />
                                <div>
                                    <label className="text-sm font-medium text-secondary-600">IP Address</label>
                                    <p className="text-sm font-mono text-secondary-900">{signer.ip}</p>
                                </div>
                            </div>
                        )}

                        {signer.device && (
                            <>
                                <div className="flex items-start space-x-3">
                                    <Fingerprint className="h-5 w-5 text-secondary-400 mt-0.5" />
                                    <div>
                                        <label className="text-sm font-medium text-secondary-600">Device Fingerprint</label>
                                        <p className="text-xs font-mono text-secondary-900 break-all">
                                            {signer.device.fingerprint}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <Smartphone className="h-5 w-5 text-secondary-400 mt-0.5" />
                                    <div>
                                        <label className="text-sm font-medium text-secondary-600">User Agent</label>
                                        <p className="text-xs text-secondary-700 break-all">
                                            {signer.device.userAgent}
                                        </p>
                                    </div>
                                </div>

                                {signer.device.acceptLanguage && (
                                    <div className="flex items-start space-x-3">
                                        <Globe className="h-5 w-5 text-secondary-400 mt-0.5" />
                                        <div>
                                            <label className="text-sm font-medium text-secondary-600">Accept Language</label>
                                            <p className="text-sm text-secondary-900">{signer.device.acceptLanguage}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}

// Signature Playback Component
function SignaturePlayback({ playbackData, onComplete }: { playbackData: any; onComplete: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        if (!playbackData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear any existing timeouts
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];

        const { strokes, color, width } = playbackData;

        // Calculate canvas dimensions based on signature bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        strokes.forEach((stroke: any) => {
            stroke.points.forEach((point: any) => {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            });
        });

        const signatureWidth = maxX - minX;
        const signatureHeight = maxY - minY;
        const padding = 20;

        // Set canvas size with padding
        canvas.width = signatureWidth + padding * 2;
        canvas.height = signatureHeight + padding * 2;

        // Calculate scale to fit container
        const containerMaxHeight = 180;
        const scale = Math.min(1, containerMaxHeight / canvas.height);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transform to center and scale signature
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Get all timestamps to calculate delays
        const allTimestamps: number[] = [];
        strokes.forEach((stroke: any) => {
            stroke.points.forEach((point: any) => {
                allTimestamps.push(point.timestamp);
            });
        });

        const startTime = Math.min(...allTimestamps);

        // Animate points based on their actual timestamps
        strokes.forEach((stroke: any) => {
            stroke.points.forEach((point: any, pointIndex: number) => {
                const delay = point.timestamp - startTime;

                const timeout = setTimeout(() => {
                    if (pointIndex === 0) {
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                        ctx.stroke();
                    }
                }, delay);

                timeoutsRef.current.push(timeout);
            });
        });

        // Complete animation after all points are drawn
        const maxDelay = Math.max(...allTimestamps) - startTime;
        const completeTimeout = setTimeout(() => {
            ctx.restore();
            onComplete();
        }, maxDelay + 100);

        timeoutsRef.current.push(completeTimeout);

        // Cleanup on unmount
        return () => {
            timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        };
    }, [playbackData, onComplete]);

    return (
        <canvas
            ref={canvasRef}
            className="max-w-full max-h-full bg-white rounded"
        />
    );
}

// Timeline Tab Component  
function TimelineTab({ timeline, document }: any) {
    return (
        <Card>
            <div className="px-6 py-4 border-b border-secondary-200">
                <h3 className="text-lg font-semibold text-secondary-900">Document Timeline</h3>
            </div>
            <div className="p-6">
                <div className="space-y-6">
                    {/* Created */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900">Document Created</p>
                            <p className="text-sm text-secondary-600">{formatDate(timeline.created.at)}</p>
                            <p className="text-xs text-secondary-500 mt-1">
                                Created by {timeline.created.by.fullName} ({timeline.created.by.email})
                            </p>
                        </div>
                    </div>

                    {/* Deadline */}
                    {timeline.deadline && (
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-secondary-900">Signing Deadline</p>
                                <p className="text-sm text-secondary-600">{formatDate(timeline.deadline)}</p>
                                {timeline.isOverdue && (
                                    <Badge variant="danger" className="mt-2">Overdue</Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Completed */}
                    {timeline.completed && (
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-secondary-900">Document Completed</p>
                                <p className="text-sm text-secondary-600">{formatDate(timeline.completed)}</p>
                                <Badge variant="success" className="mt-2">All signatures collected</Badge>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

// Audit Trail Tab Component
function AuditTrailTab({ activities }: any) {
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'DOCUMENT_CREATED': return Calendar;
            case 'DOCUMENT_SENT': return Send;
            case 'SESSION_CREATED': return User;
            case 'SIGNATURE_APPLIED': return CheckCircle;
            case 'SIGNATURE_DECLINED': return XCircle;
            case 'STEP_COMPLETED': return CheckCheck;
            case 'DOCUMENT_COMPLETED': return CheckCircle;
            case 'DOCUMENT_VIEWED': return Eye;
            case 'SESSION_EXPIRED': return Clock;
            default: return Activity;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'DOCUMENT_CREATED': return 'bg-blue-100 text-blue-600';
            case 'DOCUMENT_SENT': return 'bg-purple-100 text-purple-600';
            case 'SESSION_CREATED': return 'bg-indigo-100 text-indigo-600';
            case 'SIGNATURE_APPLIED': return 'bg-green-100 text-green-600';
            case 'SIGNATURE_DECLINED': return 'bg-red-100 text-red-600';
            case 'STEP_COMPLETED': return 'bg-emerald-100 text-emerald-600';
            case 'DOCUMENT_COMPLETED': return 'bg-green-100 text-green-600';
            case 'DOCUMENT_VIEWED': return 'bg-gray-100 text-gray-600';
            case 'SESSION_EXPIRED': return 'bg-orange-100 text-orange-600';
            default: return 'bg-secondary-100 text-secondary-600';
        }
    };

    return (
        <Card>
            <div className="px-6 py-4 border-b border-secondary-200">
                <h3 className="text-lg font-semibold text-secondary-900">
                    Activity Log ({activities.length} events)
                </h3>
            </div>
            <div className="p-6">
                <div className="space-y-4">
                    {activities.map((activity: any, index: number) => {
                        const Icon = getActivityIcon(activity.type);
                        const colorClass = getActivityColor(activity.type);

                        return (
                            <div key={index} className="flex items-start space-x-4">
                                <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', colorClass)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-secondary-900">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-secondary-500 mt-1">
                                                {formatDate(activity.time)}
                                            </p>
                                            {activity.actor && (
                                                <p className="text-xs text-secondary-600 mt-1">
                                                    by {activity.actor.fullName} ({activity.actor.email})
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {activity.type.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>

                                    {/* Metadata */}
                                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-secondary-500 cursor-pointer hover:text-secondary-700">
                                                View details
                                            </summary>
                                            <pre className="mt-2 p-3 bg-secondary-50 rounded text-xs overflow-x-auto">
                                                {JSON.stringify(activity.metadata, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}

// Loading Skeleton
function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="h-8 bg-secondary-200 rounded w-64"></div>
                    <div className="h-4 bg-secondary-200 rounded w-48"></div>
                </div>
                <div className="h-10 bg-secondary-200 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-secondary-200 rounded"></div>
                ))}
            </div>
            <div className="h-96 bg-secondary-200 rounded"></div>
        </div>
    );
}
