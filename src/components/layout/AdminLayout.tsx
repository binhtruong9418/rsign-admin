import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Plus,
    Bell,
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Documents', href: '/admin/documents', icon: FileText },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Signer Groups', href: '/admin/signer-groups', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isCurrentPath = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div className="flex h-screen bg-secondary-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 flex z-40 lg:hidden">
                    <div className="fixed inset-0 bg-secondary-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                        <SidebarContent isCurrentPath={isCurrentPath} />
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <SidebarContent isCurrentPath={isCurrentPath} />
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-secondary-200">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Mobile menu button */}
                            <button
                                className="lg:hidden -ml-2 p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            {/* Quick Actions */}
                            <div className="flex-1 flex justify-between items-center lg:ml-0">
                                <div className="flex-1" />

                                <div className="flex items-center space-x-4">
                                    {/* Create Document Button */}
                                    <Link
                                        to="/admin/documents/create"
                                        className="btn-primary inline-flex items-center"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Document
                                    </Link>

                                    {/* Notifications */}
                                    <button className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg">
                                        <Bell className="h-5 w-5" />
                                    </button>

                                    {/* User Menu */}
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">
                                                    {user?.fullName?.charAt(0) || 'A'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-sm font-medium text-secondary-900">{user?.fullName}</p>
                                            <p className="text-xs text-secondary-600">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg"
                                            title="Logout"
                                        >
                                            <LogOut className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function SidebarContent({ isCurrentPath }: { isCurrentPath: (path: string) => boolean }) {
    return (
        <div className="flex flex-col flex-grow bg-white border-r border-secondary-200 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-secondary-200">
                <div className="flex items-center">
                    <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                        <h1 className="text-lg font-semibold text-secondary-900">RSign</h1>
                        <p className="text-xs text-secondary-600">Admin Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                isCurrentPath(item.href)
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-secondary-700 hover:text-secondary-900 hover:bg-secondary-100'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'mr-3 h-5 w-5 transition-colors',
                                    isCurrentPath(item.href)
                                        ? 'text-primary-600'
                                        : 'text-secondary-400 group-hover:text-secondary-600'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="flex-shrink-0 border-t border-secondary-200 p-4">
                <div className="text-xs text-secondary-600">
                    Version 2.0
                </div>
            </div>
        </div>
    );
}