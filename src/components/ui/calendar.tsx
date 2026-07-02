"use client"

import { DayPicker, getDefaultClassNames } from "react-day-picker"
import type { Locale, DayButtonProps } from "react-day-picker"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function IconPlaceholder({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      className={cn("size-4", className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      {...props}
    />
  )
}

function CalendarDayButton({
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof Button> & { day: DayButtonProps["day"]; modifiers?: Record<string, boolean> }) {
  return <Button {...props} />
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames: classNamesProp,
  showOutsideDays = true,
  captionLayout,
  buttonVariant,
  components: componentsProp,
  ...props
}: CalendarProps & { buttonVariant?: string }) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...defaultClassNames,
        root: cn(
          "bg-background rounded-md border",
          defaultClassNames.root
        ),
        months: cn("flex flex-col sm:flex-row gap-4", defaultClassNames.months),
        month: cn("flex flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 absolute inset-x-0 top-0 w-full px-6",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline", className: "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1" }),
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", className: "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1" }),
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex justify-center items-center h-10 w-full relative",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex justify-center items-center gap-2 w-full",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring has-focus:ring-ring/50 has-focus:ring-[3px]",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute appearance-none bg-background border border-input text-foreground px-2 py-1 rounded-md text-sm font-medium opacity-0 z-50",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "text-sm font-medium",
          defaultClassNames.caption_label
        ),
        month_grid: cn(
          "border-collapse w-full",
          defaultClassNames.month_grid
        ),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "w-8",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:bg-accent [&:has([data-selected].day-outside)]:bg-accent/50 [&:has([data-selected].day-range-end)]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn("", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r-md",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-accent text-accent-foreground",
          defaultClassNames.today
        ),
        outside: cn(
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNamesProp,
      }}
      components={{
        Root: ({ className, ...props }) => {
          return (
            <div
              data-slot="calendar"
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ orientation, className, ...props }) => {
          if (orientation === "left") {
            return (
              <IconPlaceholder
                aria-hidden="true"
                data-slot="chevron-icon"
                className={className}
                {...props}
              />
            )
          }
          if (orientation === "right") {
            return (
              <IconPlaceholder
                aria-hidden="true"
                data-slot="chevron-icon"
                className={className}
                {...props}
              />
            )
          }
          return (
            <IconPlaceholder
              aria-hidden="true"
              data-slot="chevron-icon"
              className={cn("rotate-90", className)}
              {...props}
            />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <span {...props}>
              {children}
            </span>
          )
        },
        ...componentsProp,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar, CalendarDayButton }
