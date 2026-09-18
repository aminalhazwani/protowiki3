/**
 * Regenerate the data behind the article language menu:
 *
 *   src/i18n/homeButtonMessages.ts                        translated labels
 *   src/components/article/shared/articleLanguageLinks.ts the menu rows
 *
 * Three upstream sources, all fetched fresh:
 *
 * 1. `mobile-frontend-home-button` — the MediaWiki message behind Minerva's home
 *    affordance, which our Vector chrome header mirrors. Translated on
 *    translatewiki.net, which exports daily into the MinervaNeue skin's
 *    `i18n/*.json`; we read the export rather than scraping the wiki.
 *    https://translatewiki.net/wiki/Special:Translations?message=mobile-frontend-home-button&namespace=8
 *
 * 2. Autonyms — `wikimedia/language-data`, the dataset behind the Universal
 *    Language Selector. Covers every translatewiki locale, including script
 *    variants that have no Wikipedia of their own.
 *
 * 3. Which wikis exist — the `sitematrix` API, so a row only carries an `href`
 *    when there is really an open Wikipedia behind it. Script variants and
 *    creoles that translatewiki knows but Wikipedia does not (`bgc-arab`,
 *    `ban-bali`, …) become link-less rows: still selectable, so they still swap
 *    the chrome label, but they do not promise a page that would 404.
 *
 * translatewiki lists a few dozen more rows than land here: MediaWiki's export
 * drops any translation identical to its fallback language (`de-at` → `de`,
 * `en-gb` → `en`, …), so those never reach a shipped i18n file. Codes absent
 * from the message map fall back to English, which is the same string.
 *
 *   node scripts/import-language-menu.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MESSAGES_OUT = path.join(ROOT, 'src/i18n/homeButtonMessages.ts')
const LINKS_OUT = path.join(ROOT, 'src/components/article/shared/articleLanguageLinks.ts')

const MESSAGE_KEY = 'mobile-frontend-home-button'
const MINERVA_REPO = 'wikimedia/mediawiki-skins-MinervaNeue'
const MINERVA_TARBALL = `https://codeload.github.com/${MINERVA_REPO}/tar.gz/refs/heads/master`
const LANGUAGE_DATA =
  'https://raw.githubusercontent.com/wikimedia/language-data/master/data/language-data.json'
const SITEMATRIX =
  'https://en.wikipedia.org/w/api.php?action=sitematrix&format=json&formatversion=2' +
  '&smtype=language&smsiteprop=url%7Ccode%7Cclosed'
const USER_AGENT = fs.readFileSync(path.join(ROOT, 'src/api-user-agent.txt'), 'utf8').trim()

/**
 * Wikipedia subdomains whose content language has no i18n file of its own.
 * Aliased so the row still shows a translation: `no` is `nb` on translatewiki,
 * `zh` defaults to Simplified, and `simple` is a subdomain rather than a
 * language at all.
 */
const WIKI_CODE_ALIASES = { no: 'nb', zh: 'zh-hans', simple: 'en' }

const sh = (command) =>
  execFileSync('sh', ['-c', command], {
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  })

const fetchJson = (url) =>
  JSON.parse(
    sh(`curl -sfL -H ${JSON.stringify(`User-Agent: ${USER_AGENT}`)} ${JSON.stringify(url)}`),
  )

/** Emit Prettier-shaped source: single quotes, bare object keys where legal. */
const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const key = (code) => (/^[A-Za-z_$][\w$]*$/.test(code) ? code : quote(code))

// ---------------------------------------------------------------- translations

const messages = {}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'minerva-i18n-'))
try {
  sh(`curl -sfL ${JSON.stringify(MINERVA_TARBALL)} | tar -xzf - -C ${JSON.stringify(tmp)}`)
  const [checkout] = fs.readdirSync(tmp)
  const i18nDir = path.join(tmp, checkout, 'i18n')

  for (const file of fs.readdirSync(i18nDir).sort()) {
    if (!file.endsWith('.json')) continue
    const code = file.slice(0, -'.json'.length)
    if (code === 'qqq') continue // message documentation, not a translation
    const value = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8'))[MESSAGE_KEY]
    if (typeof value === 'string' && value.length > 0) messages[code] = value
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

for (const [wikiCode, i18nCode] of Object.entries(WIKI_CODE_ALIASES)) {
  if (messages[wikiCode] === undefined && messages[i18nCode] !== undefined) {
    messages[wikiCode] = messages[i18nCode]
  }
}

// ------------------------------------------------------------------ menu rows

const { languages } = fetchJson(LANGUAGE_DATA)

/**
 * `language-data` entries are `[script, regions, autonym]`, except aliases,
 * which are a one-element array naming another code.
 */
function autonym(code, seen = new Set()) {
  const entry = languages[code]
  if (!entry || seen.has(code)) return undefined
  if (entry.length === 1 && typeof entry[0] === 'string') {
    return autonym(entry[0], new Set([...seen, code]))
  }
  return typeof entry[2] === 'string' ? entry[2] : undefined
}

const wikiUrls = {}
for (const [index, group] of Object.entries(fetchJson(SITEMATRIX).sitematrix)) {
  if (!/^\d+$/.test(index)) continue
  for (const site of group.site ?? []) {
    if (site.code === 'wiki' && !site.closed) wikiUrls[group.code] = site.url
  }
}

const rows = [...new Set([...Object.keys(messages), ...Object.keys(WIKI_CODE_ALIASES)])]
  .map((code) => ({ code, label: autonym(code) ?? code, url: wikiUrls[code] }))
  .sort((a, b) => a.label.localeCompare(b.label, 'en'))

// ---------------------------------------------------------------------- write

const GENERATED_NOTE = ` * GENERATED — do not edit by hand. Re-run:
 *   node scripts/${path.basename(fileURLToPath(import.meta.url))}`

fs.writeFileSync(
  MESSAGES_OUT,
  `/**
 * Translations of the MediaWiki message \`${MESSAGE_KEY}\` — the label on
 * Minerva's home affordance, mirrored here by the Vector chrome header's Home
 * button. Keyed by language code, with Wikipedia subdomains that have no i18n
 * file of their own aliased onto the closest one (${Object.entries(WIKI_CODE_ALIASES)
   .map(([a, b]) => `\`${a}\` → \`${b}\``)
   .join(', ')}).
 *
 * Translated at translatewiki.net, read from \`${MINERVA_REPO}\`'s \`i18n/\`:
 * https://translatewiki.net/wiki/Special:Translations?message=${MESSAGE_KEY}&namespace=8
 *
${GENERATED_NOTE}
 */
export const HOME_BUTTON_MESSAGES: Record<string, string> = {
${Object.keys(messages)
  .sort()
  .map((code) => `  ${key(code)}: ${quote(messages[code])},`)
  .join('\n')}
}

/** Fallback language for any code translatewiki has no translation for. */
export const HOME_BUTTON_FALLBACK_LANG = 'en'

/** Translated home-button label for \`lang\`, falling back to English. */
export function homeButtonMessage(lang: string): string {
  return HOME_BUTTON_MESSAGES[lang] ?? HOME_BUTTON_MESSAGES[HOME_BUTTON_FALLBACK_LANG]
}
`,
  'utf8',
)

fs.writeFileSync(
  LINKS_OUT,
  `/**
 * Interlanguage rows for the article language menu — every language with a
 * translation of \`mobile-frontend-home-button\` (see \`@/i18n/homeButtonMessages\`),
 * labelled with its autonym from \`wikimedia/language-data\` and ordered by that
 * label.
 *
 * \`href\` is that wiki's main page, and is absent for the ${rows.filter((r) => !r.url).length} script variants and
 * regional languages translatewiki knows but Wikipedia has no open wiki for.
 * Those rows stay selectable — they still swap the chrome label — they just
 * aren't links.
 *
${GENERATED_NOTE}
 */
export interface ArticleLanguageLink {
  /** Language code, e.g. \`fr\`. Keys the chrome's translated labels. */
  code: string
  /** Autonym — the language's name in itself. */
  label: string
  /** That wiki's main page. Absent when no open Wikipedia exists for \`code\`. */
  href?: string
}

export const DEFAULT_ARTICLE_LANGUAGE_LINKS: ArticleLanguageLink[] = [
${rows
  .map(
    (row) =>
      `  { code: ${quote(row.code)}, label: ${quote(row.label)}${
        row.url ? `, href: ${quote(`${row.url}/wiki/`)}` : ''
      } },`,
  )
  .join('\n')}
]
`,
  'utf8',
)

execFileSync('npx', ['prettier', '--write', MESSAGES_OUT, LINKS_OUT], {
  cwd: ROOT,
  stdio: ['ignore', 'ignore', 'inherit'],
})

console.log(`${path.relative(ROOT, MESSAGES_OUT)}: ${Object.keys(messages).length} translations`)
console.log(
  `${path.relative(ROOT, LINKS_OUT)}: ${rows.length} rows (${rows.filter((r) => r.url).length} linked)`,
)
