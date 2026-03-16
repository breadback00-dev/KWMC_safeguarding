interface OccupancyBarProps {
  present: number;
  capacity: number;
}

export function OccupancyBar({ present, capacity }: OccupancyBarProps) {
  const pct = capacity > 0 ? Math.min(Math.round((present / capacity) * 100), 100) : 0;
  const nearFull = pct >= 90;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-500 font-medium">Occupancy</span>
        <span className={`font-bold ${nearFull ? 'text-red-600' : 'text-gray-700'}`}>
          {pct}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            nearFull ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {nearFull && (
        <p className="text-red-600 text-xs font-semibold mt-1">Session nearly full</p>
      )}
    </div>
  );
}
