/** 8bitの目盛りバー。階調を作らず、マスで数える */
export default function Bar({
  value,
  segs = 20,
  color,
  dim = false,
}: {
  value: number;
  segs?: number;
  color: string;
  dim?: boolean;
}) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * segs);
  return (
    <div className="flex h-[9px] gap-[1px]">
      {Array.from({ length: segs }, (_, i) => (
        <div
          key={i}
          className="h-full flex-1"
          style={{
            background: i < filled ? color : "#e6e3dd",
            opacity: i < filled && dim ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  );
}
