import './globals.css';
import React from 'react';

export const metadata = {
    title: 'AI Answer Engine',
    description: 'AI Search Engine locally resolving multi-hop semantic integrations natively',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="antialiased min-h-screen font-sans bg-gray-50">
                {children}
            </body>
        </html>
    );
}
