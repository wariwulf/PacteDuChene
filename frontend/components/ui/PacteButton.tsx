import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type PacteButtonProps =
  | {
      href: string;
      children: ReactNode;
      onClick?: never;
      className?: string;
      ariaLabel?: string;
    }
  | {
      href?: never;
      children: ReactNode;
      onClick: MouseEventHandler<HTMLButtonElement>;
      className?: string;
      ariaLabel?: string;
    };

const buttonStyle = {
  width: "420px",
  maxWidth: "100%",
  aspectRatio: "1027 / 199",
};

export default function PacteButton(props: PacteButtonProps) {
  const className = [
    "group relative ml-0 mt-3 block overflow-hidden",
    "transition duration-200 hover:brightness-110",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3bd70]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d09]",
    props.className ?? "",
  ]
    .join(" ")
    .trim();

  const content = (
    <>
      <img
        src="/images/decorations/button.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 block h-full w-full select-none object-fill"
      />

      <img
        src="/images/pacte/carousel-arrow-left.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 z-30 h-11 w-auto -translate-y-1/2 object-contain transition-transform duration-200 group-hover:-translate-x-1"
        style={{ left: "15%" }}
      />

      <span
        className="absolute inset-0 z-10 flex items-center justify-center pb-[1%] pl-[4%] font-serif text-[11px] font-semibold uppercase tracking-[0.13em] text-[#eadb80] transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{
          fontFamily: "var(--font-cinzel), Georgia, serif",
          textShadow: "rgba(0, 0, 0, 0.85) 0px 1px 2px",
        }}
      >
        {props.children}
      </span>

      <img
        src="/images/member/arbre-pacte.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 z-30 h-11 w-auto -translate-y-1/2 object-contain opacity-90"
        style={{ right: "15%" }}
      />
    </>
  );

  if (props.href) {
    return (
      <Link
        href={props.href}
        aria-label={props.ariaLabel}
        className={className}
        style={buttonStyle}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.ariaLabel}
      className={className}
      style={buttonStyle}
    >
      {content}
    </button>
  );
}
