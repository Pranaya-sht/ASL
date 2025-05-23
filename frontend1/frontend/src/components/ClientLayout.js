'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import ThemeToggle from './ui/ThemeToggle';
export default function ClientLayout({ children }) {
    const pathname = usePathname();

    // Hide Navbar on the login and register pages
    const hideNavbar = pathname === '/login' || pathname === '/register';

    return (
        <>
            {/* Conditionally render Navbar based on the current pathname */}
            {!hideNavbar && <Navbar />}

            {children}
        </>
    );
}
