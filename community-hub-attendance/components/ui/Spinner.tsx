type Size = 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

export function Spinner({ size = 'md' }: { size?: Size }) {
  return (
    <div
      className={`animate-spin rounded-full border-gray-200 ${sizeMap[size]}`}
      style={{ borderTopColor: '#2563eb' }}
      role="status"
      aria-label="Loading"
    />
  );
}
