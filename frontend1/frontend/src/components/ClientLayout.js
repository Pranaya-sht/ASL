'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const hideNavbar = pathname === '/login' || pathname === '/register';

    return (
        <>
            {!hideNavbar && <Navbar />}
            {children}
        </>
    );
}
