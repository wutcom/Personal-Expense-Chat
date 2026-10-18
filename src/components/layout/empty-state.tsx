import { Sprout } from "lucide-react";

export function EmptyState({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <section className="empty-state">
      <span className="empty-icon">
        <Sprout aria-hidden="true" size={30} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="muted-tag">{phase}</span>
    </section>
  );
}
