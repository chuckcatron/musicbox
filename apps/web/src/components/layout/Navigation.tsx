'use client';

import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/browse/', label: 'Browse' },
  { href: '/favorites/', label: 'Favorites' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="mb-6">
      <ul className="flex gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <a
                href={item.href}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
