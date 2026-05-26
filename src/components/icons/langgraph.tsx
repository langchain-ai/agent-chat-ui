export function LangGraphLogoSVG({
  className,
  width,
  height,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <img
      src="/conaigua-logo.png"
      alt="ConAIgua"
      width={width}
      height={height}
      className={className}
    />
  );
}