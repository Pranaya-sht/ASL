// components/Navbar.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Hand,
    BookOpen,
    Play,
    User,
    Moon,
    Sun,
    Menu,
    X,
    LogOut,
    Home,
    BookA
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        // Check if user is authenticated by looking for the token in localStorage
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
        router.push('/login');
    };

    const navigation = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Practice', href: '/study/Dashboard', icon: Hand },
        { name: 'Progress', href: '/study/Progress', icon: Play },
        { name: 'Dictionary', href: '/study/Dictionary', icon: BookA },
    ];

    // Close mobile menu when clicking outside or on navigation
    const handleNavigationClick = (href) => {
        router.push(href);
        setIsMobileMenuOpen(false);
    };

    if (!mounted) {
        // Return a skeleton navbar during hydration
        return (
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <Hand className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                ASL Learn
                            </span>
                        </div>
                        <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="relative     top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => handleNavigationClick('/')}
                    >
                        <Hand className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            ASL Learn
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigationClick(item.href)}
                                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{item.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right side buttons */}
                    <div className="flex items-center space-x-4">
                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-4 w-4 text-yellow-500" />
                            ) : (
                                <Moon className="h-4 w-4 text-gray-600" />
                            )}
                        </button>

                        {/* User actions */}
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleNavigationClick('/profile')}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                                    aria-label="Profile"
                                >
                                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors duration-200"
                                    aria-label="Logout"
                                >
                                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => handleNavigationClick('/login')}
                                variant="outline"
                                size="sm"
                                className="hidden md:flex"
                            >
                                Sign In
                            </Button>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <div className="px-4 py-4 space-y-3">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigationClick(item.href)}
                                    className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.name}</span>
                                </button>
                            );
                        })}
                        {!isAuthenticated && (
                            <button
                                onClick={() => handleNavigationClick('/login')}
                                className="flex items-center space-x-3 w-full text-left px-3 py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                            >
                                <User className="h-5 w-5" />
                                <span className="font-medium">Sign In</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile menu backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden"
                    style={{ top: '64px' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </nav>
    );
}