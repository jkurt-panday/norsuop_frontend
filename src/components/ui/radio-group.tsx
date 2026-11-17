import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { cn } from '@/lib/utils'

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn('grid w-full gap-2', className)} {...props} />
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return <RadioPrimitive.Root data-slot="radio-group-item" className={cn('group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-slate-400 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-blue-600 focus-visible:ring-3 focus-visible:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-blue-600 data-checked:bg-blue-600', className)} {...props}>
    <RadioPrimitive.Indicator data-slot="radio-group-indicator" className="flex size-4 items-center justify-center"><span className="size-2 rounded-full bg-white" /></RadioPrimitive.Indicator>
  </RadioPrimitive.Root>
}

export { RadioGroup, RadioGroupItem }
