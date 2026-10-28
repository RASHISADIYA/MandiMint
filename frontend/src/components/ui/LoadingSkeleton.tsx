import "./loading-skeleton.css";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={["mm-skeleton", "mm-skeleton-card__line", className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="mm-skeleton-card" aria-hidden="true">
      <div className="mm-skeleton mm-skeleton-card__line mm-skeleton-card__line--title" />
      <div className="mm-skeleton mm-skeleton-card__line" />
      <div className="mm-skeleton mm-skeleton-card__line mm-skeleton-card__line--short" />
    </div>
  );
}

export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div
      className="mm-skeleton-grid"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading list">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="mm-skeleton mm-skeleton-list__item" aria-hidden="true" />
      ))}
    </div>
  );
}
