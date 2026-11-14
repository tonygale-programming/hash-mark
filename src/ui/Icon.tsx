import type { LucideIcon } from 'lucide-react';

/** Lucide icon at the design-system size (20px, currentColor). Decorative: label the control instead. */
export function Icon({ icon: IconComponent }: { icon: LucideIcon }) {
  return (
    <IconComponent
      className="icon"
      size={20}
      strokeWidth={1.75}
      aria-hidden="true"
      focusable="false"
    />
  );
}
