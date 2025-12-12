import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail } from '@/lib/utils';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { Input, Button, Card, CardContent } from '@/components/ui';

interface LocationState {
    from?: {
        pathname: string;
    };
}

export default function LoginPage() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Redirect if already authenticated
    if (isAuthenticated) {
        const from = (location.state as LocationState)?.from?.pathname || '/admin/dashboard';
        return <Navigate to={from} replace />;
    }

    // Show loading state during auth check
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            await login(formData);
        } catch (error) {
            setErrors({
                general: error instanceof Error ? error.message : 'Login failed. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof typeof formData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        // Clear field-specific error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-600">
                        <LogIn className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-secondary-900">
                        Sign in to RSign Admin
                    </h2>
                    <p className="mt-2 text-sm text-secondary-600">
                        Manage your digital signature platform
                    </p>
                </div>

                {/* Login Form */}
                <Card className="mt-8">
                    <CardContent>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {/* Email Field */}
                                <div className="relative">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        label="Email address"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleInputChange('email')}
                                        error={errors.email}
                                        required
                                        autoComplete="email"
                                        className="pl-10"
                                    />
                                    <div className="absolute left-3 top-10 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-secondary-400" />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        label="Password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleInputChange('password')}
                                        error={errors.password}
                                        required
                                        autoComplete="current-password"
                                        className="pl-10 pr-10"
                                    />
                                    <div className="absolute left-3 top-10 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-secondary-400" />
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute right-3 top-10 flex items-center text-secondary-400 hover:text-secondary-600 focus:outline-none focus:text-secondary-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* General Error */}
                            {errors.general && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <p className="text-sm text-red-800">{errors.general}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div>
                                <Button
                                    type="submit"
                                    size="lg"
                                    isLoading={isSubmitting}
                                    disabled={isSubmitting}
                                    className="w-full"
                                >
                                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </div>

                            {/* Demo Credentials */}
                            <div className="rounded-md bg-blue-50 p-4">
                                <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
                                <p className="text-xs text-blue-700">
                                    Email: admin@rsign.com<br />
                                    Password: admin123
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}