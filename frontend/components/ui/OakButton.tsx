type OakButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export default function OakButton({
  children,
  onClick,
}: OakButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        rounded-xl
        border
        border-yellow-700
        bg-gradient-to-b
        from-yellow-700
        to-yellow-900
        px-10
        py-4
        font-semibold
        tracking-wide
        text-white
        shadow-xl
        transition-all
        duration-300
        hover:scale-105
        hover:shadow-yellow-900/40
        active:scale-95
        "
    >
      {children}
    </button>
  );
}