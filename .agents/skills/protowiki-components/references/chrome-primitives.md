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
| `desktop` | **`VectorChromeHeader`** | **Vector 2022–style** | Wordmark/tagline (**`wordmarkSrc`**, **`taglineSrc`**, **`#logo`**), **`Search`** + **Search** button, username affordances (**`username`** + **`#username`**, placed by the [playground](#desktop-nav-playground)), user-tool cluster (**`navTools`** vs **`#nav`**). Main-menu glyph is icon-only (mock). Global skin stays **desktop** until viewport **≤640px**; below **1120px** inline search collapses to a search icon; below **768px** watchlist hides. |
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
| `username` | `string` | mock user display name | **Desktop:** the name behind the username affordances; trimmed, display name substituted when empty. **`''`** starts it in the user menu only, a name starts it as the meta link — the [playground](#desktop-nav-playground) moves it either way. **`#username`** replaces the meta-link slot |
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
| `#username` | desktop | Anchor from **`username`** (when the playground places it in the toolbar) | Replace markup before tool icons |
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

### Desktop nav playground

The main-menu popover groups its knobs by what each changes in the bar —
**Home button**, **Username**, **Alerts and notices**, **Sticky header**. Like
the Home controls, each round-trips through the URL, and writes its param only
when it differs from the surface's own starting point, so links stay clean.

`src/components/chrome/desktopNavPlayground.ts` owns the two cluster settings:

| Control | Param | Effect |
| --- | --- | --- |
| **Username → Placement** | `?usernameIn=menu\|toolbar\|button\|button-bare` | Where the logged-in name shows: **Inside the user menu** (the menu's first row only), **In the toolbar** (Vector's meta link, before the tool icons), **As the menu button label** (beside the avatar on the button that closes the cluster — which then drops its `aria-label`, so the visible name *is* the accessible name), or the same label **without the icon** (`button-bare`: the name and the disclosure chevron alone, since the name already says whose menu it is). One name, one place, so these are **radios**, not a switch per position — and with the name on the button, the menu's first row names the destination (**“User page”**) rather than repeating it. The starting value follows the **`username`** prop: a name → `toolbar`, **`''`** → `menu`. |
| **Alerts and notices → Merge into one button** | `?mergeNotices=1` | Echo's two inboxes share the alerts bell: the notices tray drops out of the cluster and the bell's label becomes **“Alerts and notices”**, so nothing is lost to a screen reader. Needs **`notifications`** / **`notices`** in **`navTools`** to have anything to merge. |

The name itself comes from the **`username`** prop, or the mock user's display
name when that prop is empty — so the toolbar link and the button label always
read the same.

<h3 id="desktop-floating-help-button">Floating help button</h3>

Desktop seats Home in the end cluster, so the only thing floating over a page is
help — a round icon button in the trailing bottom corner, on the same project,
user and help pages as [Minerva's](#minerva-floating-buttons) and from the same
`src/components/chrome/helpButton.ts`. It's fixed rather than playground-styled:
a `quiet` button floating over article text would have no background of its own.

Reaching those pages by clicking is the prototype's call. Article HTML links to
them constantly (maintenance templates, policy links, `Help:IPA`), and
**`wikiLinkClick`** classifies them as `wiki-other` — nothing to render — unless
the page opts in:

```ts
import { wikiLinkClick } from '@/components/article/shared/wikiLinkClick'
import { PROJECT_NAMESPACES } from '@/components/article/shared/wikiNamespace'

const link = wikiLinkClick(event, { readableNamespaces: PROJECT_NAMESPACES })
```

`ArticleLive` renders a `Wikipedia:` or `Help:` page like any other, so the
opt-in is all it takes. Talk pages stay out: `User talk:` is a discussion
surface, not a page to read.

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

Two knobs sit in the main-menu playground under **Sticky header**, both
round-tripping through the URL like the rest
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

### Menus that size to their content

Codex positions a **`CdxMenuButton`**'s menu with Floating UI, which writes an
inline pixel `width` — the space available beside the trigger, clamped to
**`8rem`**–**`16rem`**. So an icon-only trigger gets a 16rem menu and a labelled
one gets a menu as narrow as its label, either way sized by the *button* rather
than by the rows inside it.

`src/styles/menu-content-width.css` (loaded in `main.ts`) is the opt-in fix: add
**`menu-content-width`** alongside the component's own class and the menu sizes
to its widest row instead, capped at **`22rem`** as a runaway guard.

```vue
<CdxMenuButton class="my-header__user-menu menu-content-width" :menu-items="items">
```

It's `!important` on `width`, because nothing in a stylesheet outranks an inline
style — the one place in this repo where that's the right tool. Nothing breaks at
the right edge: Floating UI measures the *rendered* menu, so it sees the content
width and flips a `bottom-start` menu to `bottom-end` when the wider box would
overflow, which is what already kept the icon-only user menu on screen. The rule
also reserves the scrollbar gutter, so a scrolling menu (Codex
**`visibleItemLimit`**) doesn't lay its scrollbar over the text it just sized
itself around.

Already applied to the desktop user menu (**`VectorChromeHeader`**), both sticky
bar menus (**`VectorStickyHeader`**), and the interlanguage menu on both skins
(**`ArticleHeader`**).

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
| `right` | [search](#minerva-search), notifications, then the built-in user avatar + [user menu](#minerva-user-menu) |

Adjacent icon buttons/links in **`left`** and **`right`** have **no gap** between them (flush groups).

Props: **`theme?`**, **`left?`**, **`middle?`**, **`right?`**, **`wordmarkSrc?`**, **`mobileWordmarkSrc?`**

<h3 id="minerva-user-menu">Minerva user menu</h3>

Leave **`right`** alone and the avatar at the end of the bar opens a **`CdxMenu`**
hanging off the bar's trailing corner — user page (the name comes from the
**`user`** config preset, so `NewEditor` by default), Talk, Sandbox, Saved,
Watchlist, Contributions, Log out. Rows are mocks: picking one just closes the
menu. It closes on an outside tap or **Escape**, and the focused avatar hands
arrow/Enter keys to the menu.

Local styles only reach for what Minerva does differently from a default Codex
menu: 44px rows, **`color-subtle`** icons _and_ labels, and
**`font-weight-semi-bold`** labels. They live in an **unscoped** `<style>` block
because **`CdxMenu`**'s root element never picks up the scope attribute.

Passing your own **`right`** replaces the whole cluster — avatar and menu
included — so a custom end cluster owns its own affordances.

<h3 id="minerva-floating-buttons">Floating buttons</h3>

Minerva floats **Home** in the bar's trailing bottom corner rather than seating
it in the bar — and on the pages that are *about* the project, a **help** button
joins it, nearest the corner. Both are inert affordances, like the rest of the
chrome.

The main-menu playground's **Floating buttons** section styles the pair as one
(`src/components/chrome/homeButtonPlayground.ts`), so they always read as a
pair: **Action** (`?homeAction=`), **Weight** (`?homeWeight=`), **Size**
(`?homeSize=`), **Show label** (`?homeIconOnly=`) and **Fully round**
(`?homeRound=`) — pill when labelled, circle when icon-only. Every knob
round-trips through the URL and writes its param only when it differs from the
skin's own starting point, so links stay clean.

When help shows is not a prop: `src/components/chrome/helpButton.ts` reads the
page subject `ArticleHeader` already registers (see
[Sticky header](#sticky-header)) and answers the namespace of its title —
`Wikipedia:` (or `Project:`), `User:` and `Help:` pages get the button, an
article or an unregistered page doesn't. A prototype gets it with no wiring; the
one thing it may need is to let those links be followed in the first place,
which is [`wikiLinkClick`'s **`readableNamespaces`**](#desktop-floating-help-button).

<h3 id="minerva-search">Minerva search</h3>

Leave **`right`** alone and the bar's search icon opens
**[`MobileSearchOverlay`](search.md#mobile-full-screen-search)** — the whole
screen becomes a search bar plus title suggestions, the way Minerva does it.
Where a picked result lands is the page's call, via the registered
**`articleOpener`**; passing your own **`right`** replaces the icon along with
the rest of the cluster.

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
