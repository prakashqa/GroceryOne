import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-white font-medium truncate">
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
