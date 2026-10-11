import { arePublicAdsConfigured } from "@/lib/public-site-config";

interface AdSlotProps {
  format: "square" | "inline";
  placement: string;
}

export function AdSlot({ format, placement }: AdSlotProps) {
  if (!arePublicAdsConfigured()) return null;

  return (
    <div
      aria-label="Advertisement"
      data-ad-format={format}
      data-ad-placement={placement}
      className={
        format === "square"
          ? "aspect-square w-full rounded-lg bg-[#E8F2F4]"
          : "my-7 min-h-[104px] w-full rounded-lg bg-[#E8F2F4]"
      }
    />
  );
}
