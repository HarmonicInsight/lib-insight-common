interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_CLASSES = {
  primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#2563EB]',
  secondary: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] focus:ring-[#E2E8F0]',
  danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]',
  ghost: 'text-[#475569] hover:bg-[#F1F5F9] focus:ring-[#E2E8F0]',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
