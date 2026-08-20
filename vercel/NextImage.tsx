import type { CSSProperties, ImgHTMLAttributes } from "react";

type NextImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
};

export default function NextImage({ fill = false, priority = false, style, ...props }: NextImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : style;

  return (
    <img
      {...props}
      style={fillStyle}
      loading={priority ? "eager" : props.loading ?? "lazy"}
      fetchPriority={priority ? "high" : props.fetchPriority}
    />
  );
}
