import Link from 'next/link';

type Breadcrumb = {
  name: string;
  href: string;
};

export default function Breadcrumbs({ items, className = '' }: { items: Breadcrumb[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-neutral-500 ${className}`}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.href}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span className="text-neutral-300">{item.name}</span>
              ) : (
                <Link href={item.href} className="hover:text-white transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
