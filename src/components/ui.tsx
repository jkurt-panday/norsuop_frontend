import * as React from 'react'
import { Input as BaseInput } from '@base-ui/react/input'
import { cn } from '../lib/utils'

export function Card({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white text-slate-900 shadow-xl', className)} {...props} /> }
export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('border-b border-slate-100 px-8 py-6', className)} {...props} /> }
export function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) { return <h2 className={cn('text-xl font-semibold text-blue-900', className)} {...props} /> }
export function CardDescription({ className, ...props }: React.ComponentProps<'p'>) { return <p className={cn('mt-1 text-sm text-slate-600', className)} {...props} /> }
export function CardContent({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('space-y-6 px-8 py-6', className)} {...props} /> }
export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('flex items-center justify-end gap-3 border-t border-slate-100 px-8 py-6', className)} {...props} /> }
export function Input({ className, type, ...props }: React.ComponentProps<'input'>) { return <BaseInput type={type} className={cn('h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-slate-100 aria-invalid:border-red-500', className)} {...props} /> }
export function Field({ className, ...props }: React.ComponentProps<'div'>) { return <div className={cn('space-y-2', className)} {...props} /> }
export function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) { return <label className={cn('mb-2 block font-medium text-slate-700', className)} {...props} /> }
export function FieldError({ className, ...props }: React.ComponentProps<'p'>) { return <p role="alert" className={cn('mt-1 text-sm text-red-700', className)} {...props} /> }
export function Separator({ className, ...props }: React.ComponentProps<'hr'>) { return <hr className={cn('my-2 border-blue-100', className)} {...props} /> }
