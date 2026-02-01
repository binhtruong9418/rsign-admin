import { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';
import { adminConfigAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function Settings() {
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
            showToast.error(error.error || 'Failed to load configuration');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (timeoutMinutes < 5 || timeoutMinutes > 120) {
            showToast.error('Timeout must be between 5 and 120 minutes');
            return;
        }

        try {
            setLoading(true);
            const result = await adminConfigAPI.updateSessionConfig(timeoutMinutes);
            setTimeoutMinutes(result.timeoutMinutes);
            showToast.success('Configuration updated successfully');
        } catch (error: any) {
            showToast.error(error.error || 'Failed to update configuration');
        } finally {
            setLoading(false);
        }
    };

    const presetValues = [
        { value: 5, label: 'High Security', description: '5 minutes' },
        { value: 10, label: 'Standard', description: '10 minutes' },
        { value: 30, label: 'Flexible', description: '30 minutes' },
        { value: 60, label: 'Extended', description: '60 minutes' },
    ];

    if (fetching) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
                        <p className="mt-1 text-sm text-secondary-600">
                            Configure system settings and preferences
                        </p>
                    </div>
                </div>
                <div className="card p-12">
                    <div className="flex items-center justify-center">
                        <div className="text-sm text-secondary-600">Loading configuration...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
                    <p className="mt-1 text-sm text-secondary-600">
                        Configure system settings and preferences
                    </p>
                </div>
            </div>

            {/* Session Timeout Configuration */}
            <div className="card">
                <div className="px-6 py-4 border-b border-secondary-200">
                    <div className="flex items-center">
                        <Clock className="h-5 w-5 text-primary-600 mr-2" />
                        <h2 className="text-lg font-semibold text-secondary-900">
                            Session Timeout Configuration
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-secondary-600">
                        Configure the timeout duration for signing sessions
                    </p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Info Alert */}
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                            <div className="flex">
                                <Info className="h-5 w-5 text-primary-600 flex-shrink-0" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-primary-900">
                                        Important Information
                                    </h3>
                                    <div className="mt-2 text-sm text-primary-800">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>This configuration applies to all new signing sessions</li>
                                            <li>Existing sessions will not be affected</li>
                                            <li>Recommended value: 10-30 minutes</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Configuration Display */}
                        <div className="bg-secondary-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-secondary-700">
                                        Current Configuration
                                    </p>
                                    <p className="text-3xl font-bold text-secondary-900 mt-1">
                                        {timeoutMinutes} minutes
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-secondary-500">Equivalent to</p>
                                    <p className="text-xl font-semibold text-secondary-700 mt-1">
                                        {timeoutMinutes * 60} seconds
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Input Form */}
                        <div>
                            <label
                                htmlFor="timeout"
                                className="block text-sm font-medium text-secondary-700 mb-2"
                            >
                                Timeout Duration (minutes)
                            </label>
                            <input
                                id="timeout"
                                type="number"
                                min={5}
                                max={120}
                                value={timeoutMinutes}
                                onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                                className="input w-full"
                                placeholder="Enter timeout duration (5-120 minutes)"
                                required
                            />
                            <p className="mt-2 text-sm text-secondary-500">
                                Enter a value between 5 and 120 minutes
                            </p>
                        </div>

                        {/* Preset Values */}
                        <div>
                            <p className="text-sm font-medium text-secondary-700 mb-3">
                                Quick Presets
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {presetValues.map((preset) => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => setTimeoutMinutes(preset.value)}
                                        className={`
                                            px-4 py-3 rounded-lg border-2 text-sm font-medium
                                            transition-all
                                            ${timeoutMinutes === preset.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'
                                            }
                                        `}
                                    >
                                        <div className="font-semibold">{preset.description}</div>
                                        <div className="text-xs mt-1 opacity-75">{preset.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-secondary-200">
                            <button
                                type="button"
                                onClick={fetchCurrentConfig}
                                disabled={loading}
                                className="btn-secondary"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Guidelines */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Configuration Guidelines
                </h3>
                <div className="space-y-4 text-sm text-secondary-600">
                    <div>
                        <h4 className="font-medium text-secondary-900 mb-1">
                            What is Session Timeout?
                        </h4>
                        <p>
                            Session timeout is the maximum duration a user can maintain a signing session
                            before it expires. When a session expires, the user must create a new session
                            to continue signing.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-secondary-900 mb-1">
                            Recommended Configuration
                        </h4>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                                <strong>5-10 minutes:</strong> For high-security documents
                            </li>
                            <li>
                                <strong>10-30 minutes:</strong> For normal usage
                            </li>
                            <li>
                                <strong>30-60 minutes:</strong> For complex documents requiring extended
                                review time
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-secondary-900 mb-1">Important Notes</h4>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Configuration only applies to new sessions, not existing ones</li>
                            <li>
                                Very short timeout values may inconvenience users due to frequent session
                                expiration
                            </li>
                            <li>Very long timeout values may reduce system security</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
