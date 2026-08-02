"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-[#173d56]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 rounded-full border-[#dcebe9] bg-white p-0 text-[#0d7d75] opacity-80 shadow-sm hover:border-[#a6ddd4] hover:bg-[#edf9f6] hover:text-[#0b8d81] hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "w-9 rounded-md text-[0.72rem] font-medium text-[#7890a5]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 p-0 text-center text-sm",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 rounded-[10px] p-0 text-[12px] font-medium text-[#36566b] transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:bg-[#e8f7d0] hover:text-[#0a776e] focus-visible:ring-[#14b8a6]/25 aria-selected:opacity-100 active:scale-95"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[linear-gradient(135deg,#9fda39,#079889)] text-white shadow-[0_7px_14px_rgba(15,159,143,0.22)] hover:bg-[linear-gradient(135deg,#95d331,#05897e)] hover:text-white focus:bg-[linear-gradient(135deg,#9fda39,#079889)] focus:text-white",
        day_today: "bg-[#b8df42] text-[#174a35] shadow-[inset_0_0_0_1px_rgba(23,74,53,0.05)] hover:bg-[#aedd39] hover:text-[#123f31]",
        day_outside:
          "day-outside text-[#a1b2bf] hover:bg-[#f2fae5] aria-selected:bg-[#e4f5ce] aria-selected:text-[#0b766d]",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-[#e4f5ce] aria-selected:text-[#0b766d]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
