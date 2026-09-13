import type { FontSize, LineWidth } from "@/lib/storage/types";

export const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  small: "text-[17px]",
  medium: "text-[19px]",
  large: "text-[22px]",
};

export const LINE_WIDTH_CLASSES: Record<LineWidth, string> = {
  narrow: "max-w-[56ch]",
  medium: "max-w-[66ch]",
  wide: "max-w-[76ch]",
};
