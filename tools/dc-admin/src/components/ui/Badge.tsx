interface BadgeProps {
  label: string;
  color: string;
  bgColor: string;
}

export function Badge({ label, color, bgColor }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ color, backgroundColor: bgColor }}
    >
      {label}
    </span>
  );
}
