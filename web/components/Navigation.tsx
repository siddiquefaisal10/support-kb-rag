'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ModelSelector from './ModelSelector';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Chat' },
    { href: '/upload', label: 'Upload' },
    { href: '/tickets', label: 'Tickets' },
    { href: '/eval', label: 'Eval' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Support KB RAG</h1>
            </div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                  pathname === link.href
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="http://localhost:4000/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Metrics ↗
            </a>
          </div>
          <div className="flex items-center">
            <ModelSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}