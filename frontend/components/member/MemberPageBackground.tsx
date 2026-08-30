import type { ReactNode } from "react";
import "./member-page-background.css";

interface MemberPageBackgroundProps {
  children: ReactNode;
  className?: string;
}

export default function MemberPageBackground({
  children,
  className = "",
}: MemberPageBackgroundProps) {
  return (
    <main className={`member-page-background ${className}`}>
      <div className="member-page-background__art" aria-hidden="true" />
      <div className="member-page-background__veil" aria-hidden="true" />
      <div className="member-page-background__content">{children}</div>
    </main>
  );
}
