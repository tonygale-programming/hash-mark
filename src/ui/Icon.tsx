import type { LucideIcon } from 'lucide-react';

/**
 * Lucide icon in the Brace style: 16px, currentColor, lines 1.5px on screen (stroke 2.25 on the 24px grid).
 * Decorative: label the control instead.
 */
export function Icon({ icon: IconComponent }: { icon: LucideIcon }) {
  return (
    <IconComponent
      className="icon"
      size={16}
      strokeWidth={2.25}
      aria-hidden="true"
      focusable="false"
    />
  );
}
