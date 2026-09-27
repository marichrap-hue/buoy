/** iOS large title: 34pt, у Buoy — жирність 800 (бриф: «heavy for titles»). */
export function LargeTitle({ children }: { children: string }) {
  return (
    <h1 className="px-[16px] pb-[8px] pt-[4px] text-[34px] font-extrabold leading-[41px] tracking-[-0.02em] text-ink">
      {children}
    </h1>
  )
}
