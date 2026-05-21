'use client'

import type { TemperatureInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TemperatureDotProps {
  temperature: TemperatureInfo
  showLabel?: boolean
}

export default function TemperatureDot({ temperature, showLabel = true }: TemperatureDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full', temperature.dotClass)} />
      {showLabel && temperature.label && (
        <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-medium', temperature.badgeClass)}>
          {temperature.label}
        </span>
      )}
    </span>
  )
}
