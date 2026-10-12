// Align node_modules Codex with patches/codex/ (stock vs patched).
// Used by postinstall, Vite dev/build startup, and git hooks.

import { wantsPatch } from './lib-codex-patch.mjs'
import { clearViteCache, ensureCodex } from './lib-codex-state.mjs'

/**
 * @param {{ log?: (msg: string) => void }} [opts]
 * @returns {Promise<boolean>} true when node_modules changed on disk
 */
export async function reconcileCodexInstall({ log = console.log } = {}) {
  const changed = await ensureCodex(wantsPatch(), { log })
  if (changed) clearViteCache()
  return changed
}
