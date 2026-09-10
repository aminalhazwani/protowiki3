import type { Icon } from '@wikimedia/codex-icons'

/**
 * One fact in a card's supporting-text row: an optional leading icon plus its
 * label. A row carrying more than one signal joins them with
 * {@link SUPPORTING_SIGNAL_SEPARATOR} rather than a comma.
 */
export interface WikitaLiteSupportingSignal {
  icon?: Icon
  text: string
}

/**
 * Interpunct between signals, padded with non-breaking spaces so the bullet
 * can never be orphaned at the start or end of a wrapped line.
 */
export const SUPPORTING_SIGNAL_SEPARATOR = '\u00a0\u00b7\u00a0'

/** Drops blank signals, so a missing label never leaves a stray bullet. */
export function visibleSupportingSignals(
  signals: WikitaLiteSupportingSignal[] | undefined,
): WikitaLiteSupportingSignal[] {
  return (signals ?? []).filter((signal) => signal.text.trim().length > 0)
}

/** Bullet-joins signal labels for the few places that render a bare string. */
export function joinSupportingSignals(...parts: (string | undefined)[]): string {
  return parts
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join(SUPPORTING_SIGNAL_SEPARATOR)
}
