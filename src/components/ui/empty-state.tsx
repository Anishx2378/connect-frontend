import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center w-full h-full min-h-[300px]", className)}>
      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">{title}</h3>
      <p className="text-muted-foreground text-[15px] max-w-md mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </div>
  )
}
