'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Button
            variant="ghost"
            //className="absolute top-4 right-4 z-50"
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
        >
            {theme === 'dark' ? (
                <FaSun className="w-5 h-5 text-yellow-400" />
            ) : (
                <FaMoon className="w-5 h-5 text-gray-800" />
            )}
        </Button>
    );
}
