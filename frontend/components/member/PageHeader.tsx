interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
}: PageHeaderProps) {
  return (
    <header className="mb-10">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
          {eyebrow}
        </p>
      )}

      <h1 className="text-4xl font-bold text-white">
        {title}
      </h1>

      {description && (
        <p className="mt-3 max-w-3xl text-gray-300">
          {description}
        </p>
      )}
    </header>
  );
}