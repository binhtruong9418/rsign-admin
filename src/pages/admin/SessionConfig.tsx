import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { adminConfigAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SessionConfig() {
    const [timeoutMinutes, setTimeoutMinutes] = useState<number>(10);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchCurrentConfig();
    }, []);

    const fetchCurrentConfig = async () => {
        try {
            setFetching(true);
            const config = await adminConfigAPI.getSessionConfig();
            setTimeoutMinutes(config.timeoutMinutes);
        } catch (error: any) {
            toast.error(error.error || 'Không thể tải cấu hình');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (timeoutMinutes < 5 || timeoutMinutes > 120) {
            toast.error('Thời gian timeout phải từ 5 đến 120 phút');
            return;
        }

        try {
            setLoading(true);
            const result = await adminConfigAPI.updateSessionConfig(timeoutMinutes);
            setTimeoutMinutes(result.timeoutMinutes);
            toast.success('Cập nhật cấu hình thành công');
        } catch (error: any) {
            toast.error(error.error || 'Không thể cập nhật cấu hình');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Cấu hình Session Timeout
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Thiết lập thời gian hết hạn cho phiên ký số (signing session)
                    </p>
                </div>

                <Card className="max-w-2xl">
                    {fetching ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-gray-500">Đang tải...</div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-blue-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">
                                                Thông tin
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>
                                                        Cấu hình này áp dụng cho tất cả phiên ký số mới
                                                    </li>
                                                    <li>
                                                        Phiên đã tạo sẽ không bị ảnh hưởng
                                                    </li>
                                                    <li>
                                                        Giá trị khuyến nghị: 10-30 phút
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Config Display */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Cấu hình hiện tại
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {timeoutMinutes} phút
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                Tương đương
                                            </p>
                                            <p className="text-lg font-semibold text-gray-700 mt-1">
                                                {timeoutMinutes * 60} giây
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Input Form */}
                                <div>
                                    <label
                                        htmlFor="timeout"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Thời gian timeout (phút)
                                    </label>
                                    <Input
                                        id="timeout"
                                        type="number"
                                        min={5}
                                        max={120}
                                        value={timeoutMinutes}
                                        onChange={(e) =>
                                            setTimeoutMinutes(Number(e.target.value))
                                        }
                                        placeholder="Nhập thời gian (5-120 phút)"
                                        required
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        Nhập giá trị từ 5 đến 120 phút
                                    </p>
                                </div>

                                {/* Recommended Values */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">
                                        Giá trị đề xuất
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { value: 5, label: 'Bảo mật cao', variant: 'danger' },
                                            { value: 10, label: 'Tiêu chuẩn', variant: 'primary' },
                                            { value: 30, label: 'Linh hoạt', variant: 'success' },
                                            { value: 60, label: 'Thoải mái', variant: 'warning' },
                                        ].map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => setTimeoutMinutes(preset.value)}
                                                className={`
                                                    px-4 py-3 rounded-lg border-2 text-sm font-medium
                                                    transition-all
                                                    ${
                                                        timeoutMinutes === preset.value
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                    }
                                                `}
                                            >
                                                <div className="font-semibold">
                                                    {preset.value} phút
                                                </div>
                                                <div className="text-xs mt-1 opacity-75">
                                                    {preset.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={fetchCurrentConfig}
                                        disabled={loading}
                                    >
                                        Làm mới
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Đang lưu...' : 'Lưu cấu hình'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </Card>

                {/* Additional Info */}
                <div className="mt-6 max-w-2xl">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Hướng dẫn sử dụng
                        </h3>
                        <div className="space-y-4 text-sm text-gray-600">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">
                                    Session Timeout là gì?
                                </h4>
                                <p>
                                    Session timeout là thời gian tối đa mà người dùng có thể giữ một phiên
                                    ký số trước khi phiên đó hết hạn. Khi phiên hết hạn, người dùng cần
                                    tạo phiên mới để tiếp tục ký.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">
                                    Khuyến nghị cấu hình
                                </h4>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>
                                        <strong>5-10 phút:</strong> Cho tài liệu có tính bảo mật cao
                                    </li>
                                    <li>
                                        <strong>10-30 phút:</strong> Cho sử dụng thông thường
                                    </li>
                                    <li>
                                        <strong>30-60 phút:</strong> Cho tài liệu phức tạp, cần nhiều
                                        thời gian xem xét
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Lưu ý quan trọng</h4>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Cấu hình chỉ áp dụng cho phiên ký mới, không ảnh hưởng phiên cũ</li>
                                    <li>
                                        Giá trị quá nhỏ có thể gây khó chịu cho người dùng khi phiên hết
                                        hạn nhanh
                                    </li>
                                    <li>
                                        Giá trị quá lớn có thể giảm tính bảo mật của hệ thống
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
