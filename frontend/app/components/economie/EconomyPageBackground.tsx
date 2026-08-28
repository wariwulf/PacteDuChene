import "./economy-page-background.css";

type EconomyPageBackgroundProps = {
  children: React.ReactNode;
};

export default function EconomyPageBackground({
  children,
}: EconomyPageBackgroundProps) {
  return (
    <main className="economy-page-background">
      <div className="economy-page-background__image" aria-hidden="true" />
      <div className="economy-page-background__overlay" aria-hidden="true" />
      <div className="economy-page-background__content">{children}</div>
    </main>
  );
}
