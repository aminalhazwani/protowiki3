# Chrome primitives — `ChromeHeader`, `ChromeFooter`

These are the two components `ChromeWrapper` composes to paint the
Wikipedia chrome. They're independently importable when you want the
chrome-without-the-wrapper (e.g., a custom layout that doesn't use
`ChromeWrapper`'s default arrangement).

## Skin variants

**`ChromeHeader`** delegates to **`VectorChromeHeader`** (desktop skin)
or **`MinervaChromeHeader`** (mobile skin) based on effective skin:

| Skin | Component | Chrome feel | Notes |
| --- | --- | --- | --- |
| `desktop` | **`VectorChromeHeader`** | **Vector 2022–style** | Wordmark/tagline (**`wordmarkSrc`**, **`taglineSrc`**, **`#logo`**), **`Search`** + **Search** button, username link (**`username`** + **`#username`**), user-tool cluster (**`navTools`** vs **`#nav`**). Main-menu glyph is icon-only (mock). Global skin stays **desktop** until viewport **≤640px**; below **1120px** inline search collapses to a search icon; below **768px** watchlist hides. |
| `mobile` | **`MinervaChromeHeader`** | **Minerva-style** | Grey elevated bar: menu · wordmark · search + notifications + user — prop-driven **`left`** / **`middle`** / **`right`** item arrays. **`navTools`** is ignored. |

**`ChromeFooter`** matches the skin:

- **`desktop`** — Vector-ish reader strip (muted top border on the inner block). When **`lastEditedNotice`**:
  1. Mock line: **“This page was last edited on …”**
  2. Mock **CC BY-SA** licence blurb + Terms / Privacy / Foundation sentence (article-style metadata)
  Then the prototype note and bullet links.
- **`mobile`** — Minerva-ish stack (see `ChromeFooter.vue`):
  1. Optional **mock “Last edited … by …”** row — driven by **`username`** (forwarded from **`ChromeWrapper`**) with **`lastEditedNotice`**; when hidden, the grey well gains a compensating **top border** so the footer still attaches cleanly.
  2. Grey **well**: wordmark, Wikimedia/MediaWiki badge buttons, divider, short licence line, middot-linked footer rows.

That notice is chrome **fiction** for prototypes — not wired to revisions. The toggle is **`lastEditedNotice`** on **`ChromeFooter`** / **`ChromeWrapper`**.

## ChromeHeader

Public skin-aware delegator — import directly or use via **`ChromeWrapper`'s** default **`#header`** slot.

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | Local skin override; falls back to global `useSkin()` |
| `theme` | `'light' \| 'dark'` | `undefined` | Local theme override; falls back to global `useTheme()` |
| `username` | `string` | `'Username'` | **Desktop:** Meta link mock before tool icons; trimmed; **`''`** hides unless **`#username`** overrides |
| `wordmarkSrc` | `string` | EN CDN SVG | Desktop wordmark **`#logo`** (+ Minerva fallback when **`mobileWordmarkSrc`** omitted) |
| `taglineSrc` | `string` | EN CDN SVG | Desktop tagline **`#logo`** stack |
| `mobileWordmarkSrc` | `string` | **`wordmarkSrc`** then EN CDN | Minerva bar wordmark when **`middle`** is omitted |
| `navTools` | `ChromeNavTool[]` | full set | **Desktop only** — which Vector tool icons render; **`#nav`** replaces cluster |
| `left` | `HeaderItem[]` | Minerva default | **Mobile only** — override Minerva **`left`** region |
| `middle` | `HeaderItem[]` | built-in wordmark | **Mobile only** — override Minerva **`middle`** region |
| `right` | `HeaderItem[]` | Minerva default | **Mobile only** — override Minerva **`right`** region |

`HeaderItem` matches **`AppChromeHeader`** (`link` / `button` / `component` / `title` with kebab-case icon names).

`lang` / `dir` are deliberately not props on the primitives. Set them once
on the surrounding wrapper (or on `<html>`) and the chrome inherits them
through the DOM.

Desktop **inline search** is always **`<Search />`** inside **`VectorChromeHeader`** (not a slot).

### Slots

| Slot | Skin | Default | Use for |
| --- | --- | --- | --- |
| `#menu` | both | menu button / icon | Replace main-menu control (**`ChromeWrapper`** forwards this) |
| `#logo` | both | EN Wikipedia wordmark (+ tagline on desktop) | Replace wordmark / lockup |
| `#username` | desktop | Anchor from **`username`** | Replace markup before tool icons |
| `#nav` | desktop | Vector tool icons | Replace user-tool cluster (**`navTools`** ignored) |

### Example

```vue
<script setup lang="ts">
import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
</script>

<template>
  <ChromeHeader />
</template>
```

## VectorChromeHeader

Force desktop Vector chrome regardless of global skin. Same props/slots as the desktop path of **`ChromeHeader`** (except **`skin`** / Minerva item arrays).

```ts
import VectorChromeHeader from '@/components/chrome/VectorChromeHeader.vue'
```

Props: **`theme?`**, **`username?`**, **`wordmarkSrc?`**, **`taglineSrc?`**, **`navTools?`**

Slots: **`#menu`**, **`#logo`**, **`#username`**, **`#nav`**

### Sticky header

Every desktop chrome page gets Vector 2022's condensed sticky bar — no prop, no
opt-in. The site header scrolls away normally; the bar then slides down over the
content and stays until the page is back near the top.

`VectorStickyHeader` renders it, and it reads the page subject from
`src/components/chrome/stickyHeaderSubject.ts`:

- **With an article** — `ArticleHeader` registers its title and hands the bar
  its **`<h1>`** as the trigger, so the bar appears exactly when the title
  leaves. Contents: search, the title, talk / history / watch / reading lists /
  edit, **“N languages”**, user menu.
- **Without one** (special pages, dashboards, homepages) — nothing registers, so
  the site nav becomes the trigger and the bar reduces to search plus the user
  menu. Page-scoped tools would have nothing to act on.

Two knobs sit in the main-menu playground under **sticky header**, both
round-tripping through the URL like the Home button controls
(`src/components/chrome/stickyHeaderPlayground.ts`):

| Toggle | Param | Effect |
| --- | --- | --- |
| **Home button** | `?stickyHome=1` | Home at the head of the tool cluster, just before talk. Follows the playground's own `action` / `weight` / **Icon only** settings, so both Home buttons stay in step. Site navigation, so it doesn't wait on a registered subject — but like the site header's cluster it stays out of logged-out chrome. |
| **Languages count only** | `?stickyLangCountOnly=1` | Shortens the interlanguage label to the bare count — **“445”**, not **“445 languages”**. The full phrase stays on as the button's `aria-label`, since a lone number tells a screen reader nothing. |

Registering a different subject is a two-call contract, keyed by a per-instance
token so a late unmount can't clear a newer registration:

```ts
import {
  clearStickyHeaderSubject,
  setStickyHeaderSubject,
} from '@/components/chrome/stickyHeaderSubject'

const token = Symbol('my-surface')
setStickyHeaderSubject(token, { title: 'Wet Leg', sentinel: headingEl.value })
onBeforeUnmount(() => clearStickyHeaderSubject(token))
```

The interlanguage menu comes from
`@/components/article/shared/articleLanguageMenu`, the same composable
**`ArticleHeader`** uses, so both offer identical rows and both swap the chrome's
UI language on pick. The trigger itself is
`useScrolledPast` (`src/composables/useScrolledPast.ts`) — an
`IntersectionObserver`, not a scroll listener. The slide honours
`prefers-reduced-motion`, and the parked bar is `inert` so it never catches a
Tab.

## MinervaChromeHeader

Force mobile Minerva bar regardless of global skin. Prop-driven **`left`** / **`middle`** / **`right`** item arrays — same shape as **`AppChromeHeader`**. No slots.

```ts
import MinervaChromeHeader from '@/components/chrome/MinervaChromeHeader.vue'
import type { MinervaHeaderItem } from '@/components/chrome/MinervaChromeHeader.vue'
```

| Region | Default |
| --- | --- |
| `left` | menu button |
| `middle` | Wikipedia wordmark (`RouterLink` + `<img>`) when **`middle`** omitted |
| `right` | search, notifications, user avatar buttons |

Adjacent icon buttons/links in **`left`** and **`right`** have **no gap** between them (flush groups).

Props: **`theme?`**, **`left?`**, **`middle?`**, **`right?`**, **`wordmarkSrc?`**, **`mobileWordmarkSrc?`**

## ChromeFooter

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | |
| `theme` | `'light' \| 'dark'` | `undefined` | |
| `lastEditedNotice` | `boolean` | `true` | Mock last-edited **notice** — **`false`** hides it on **both** skins (**`ChromeWrapper`** forwards this). |
| `username` | `string` | `'Username'` | Mobile “last edited … by …” line — **`ChromeWrapper`** forwards it |

### Slots

| Slot | Default | Use for |
| --- | --- | --- |
| default | Desktop strip or Minerva well (see skin section above) | Replace the entire footer |

### Example

```vue
<ChromeFooter>
  <p>This prototype is for design review only.</p>
</ChromeFooter>
```

## When to use the primitives directly

Most prototypes use `<ChromeWrapper>`, which composes both primitives.
Use them directly when:

- You want the chrome but with a non-default layout between header and
  footer (e.g., a 3-column layout with sticky toolbars that isn't covered
  by `ArticleLive` / `ArticleSnapshot` / `ArticleCustom` / `ArticleWrapper` / `ArticleRenderer` /
  `SpecialPageWrapper`).
- You want the header but no footer (or vice versa).
- You're building your own wrapper and the new wrapper genuinely warrants
  living in `src/components/` (rare).

```vue
<script setup lang="ts">
import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import ChromeFooter from '@/components/chrome/ChromeFooter.vue'
</script>

<template>
  <div class="custom-shell">
    <ChromeHeader />
    <main class="custom-shell__body">
      <!-- bespoke layout here -->
    </main>
    <ChromeFooter />
  </div>
</template>
```

## Inheriting skin/theme inside `ChromeWrapper`

`ChromeWrapper` **provides** effective skin and theme to descendants.
**`ArticleLive`**, **`ArticleSnapshot`**, **`ArticleCustom`**, **`ArticleWrapper`**, **`ArticleRenderer`** **inject** them when their own
`skin` / `theme` props are omitted, so article columns and special-page
typography track embedded `<ChromeWrapper skin="mobile">` previews without
repeating props on every child.
