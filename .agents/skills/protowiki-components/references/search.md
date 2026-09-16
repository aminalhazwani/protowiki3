# `Search`

Wikipedia typeahead search — `CdxTypeaheadSearch` wired to
**[`fetchTitleSearchResults`](#data)**, the same prefix-completion request the
mobile overlay makes. Default search component used by **`VectorChromeHeader`**.

## Usage

```vue
<Search @select="onSelect" @submit="onSubmit" />
```

```ts
function onSelect(title: string) {
  router.push(`/article/${encodeURIComponent(title)}`)
}

function onSubmit(query: string) {
  router.push({ path: '/search', query: { q: query } })
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `host` | `string` | `'en.wikipedia.org'` | Wiki host searched — also picks the language, and where the form falls back to |
| `placeholder` | `string` | `'Search Wikipedia'` | Input placeholder + a11y label |
| `limit` | `number` | `10` | Max suggestions returned |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | |
| `theme` | `'light' \| 'dark'` | `undefined` | |

`lang` / `dir` are inherited from the surrounding wrapper.

## Events

| Event | Payload | Fired when |
| --- | --- | --- |
| `select` | `string` (title) | User clicks / picks a suggestion |
| `submit` | `string` (query) | User presses Enter or clicks the search icon |

## Behaviour

- Each keystroke abort-cancels the previous request via `AbortController`,
  so fast typing doesn't pile up.
- Suggestions render with title + (when present) short description.
- The "Search Wikipedia for pages containing **&lt;query&gt;**" footer goes
  to `Special:Search` on the configured host.
- The form action posts to the same wiki's `/w/index.php` so the user can
  fall back to a real Wikipedia search by hitting Enter when offline-
  rendering this prototype.
- With an **[`articleOpener`](article.md)** registered none of that leaving
  happens: suggestions become ProtoWiki links, the footer drops out, and
  submitting opens the best match — the arrow-key-highlighted suggestion when
  there is one, otherwise an exact title match, otherwise the first completion.
  **`VectorChromeHeader`**'s **Search** button submits the same form, so it
  follows whichever behaviour is in force.

## Inside `VectorChromeHeader`

Desktop Vector chrome always mounts **`<Search />`** in the inline search cluster (no `#search` slot). Most prototypes never import **`Search`** — they use **`ChromeWrapper`**, which renders the default **`ChromeHeader`**.

The chrome user link is **`ChromeHeader`'s **`username`** prop (**`ChromeWrapper`** forwards the same prop when you use the default header). **`username=""`** hides that link.

For a different search surface, replace **`ChromeWrapper`'s `#header`** with a custom **`ChromeHeader`** (fork the template) or your own header markup.

## Etiquette

- The REST `search/title` endpoint works from the browser without CORS
  preflight.
- Set `host` to a localized wiki to drive search there (`fr.wikipedia.org`,
  `commons.wikimedia.org`, etc.).
- See [`wiki-apis/references/etiquette.md`](../../wiki-apis/references/etiquette.md)
  for the WMF policy on User-Agent and rate-limits when extending this
  beyond title completion.

<h2 id="mobile-full-screen-search">Mobile full-screen search (`MobileSearchOverlay`)</h2>

Minerva has no search dropdown: the icon in the bar replaces the **whole
screen** with a search bar and a list of title suggestions, and picking a row is
the only way out into an article — there is no search-results page behind Enter.
**`MobileSearchOverlay`** is that screen, and **`MinervaChromeHeader`**'s
built-in search icon opens it (see
[Minerva search](chrome-primitives.md#minerva-search)). Most prototypes get it
for free through **`ChromeWrapper`** and never import it.

```vue
<script setup lang="ts">
import MobileSearchOverlay from '@/components/search/MobileSearchOverlay.vue'
</script>

<template>
  <MobileSearchOverlay v-if="searchOpen" @close="searchOpen = false" />
</template>
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `placeholder` | `string` | `'Search Wikipedia'` | Input placeholder + a11y label |
| `lang` | `string` | `'en'` | Language code for the wiki searched |
| `limit` | `number` | `6` | Max suggestions returned |
| `clientTag` | `string` | `'mobile-search'` | Appended to the API user agent |
| `theme` | `'light' \| 'dark'` | `undefined` | |

One event: **`close`** — fired by the back button, **Escape**, or a pick that
opened in place. The overlay is **`position: fixed`** and teleported to the body,
so it covers the chrome that opened it (and the floating Home button) instead of
pushing the page down.

### Where a pick lands

The overlay routes a pick through the registered
**[`articleOpener`](article.md)** rather than deciding itself:

- **Opener registered** (a prototype that keeps its reading position in
  **`?article=`**, say) — rows are **ProtoWiki** links, and a plain click loads
  the article **in place**. The reader never leaves for en.wikipedia.org, so the
  reading trail includes the pages they *searched* their way into.
- **Nothing registered** (a dashboard, a special page, a hand-authored article) —
  rows are ordinary links to the real wiki, the only honest destination left.

Either way the row is a real **`<a>`** with a real **`href`**, so a middle- or
⌘-click opens a new tab and the status bar tells the truth.

<h3 id="data">Data</h3>

**`fetchTitleSearchResults`** (**`src/components/search/titleSearch.ts`**) hits
REST **`/w/rest.php/v1/search/title`** — the prefix-completion endpoint the
production bars use. It returns the short description **and** a thumbnail with
each title, so a result row needs no follow-up request (unlike Action API
**`opensearch`**, which carries no image). Both search surfaces share it —
**`Search`** ignores the thumbnails, since Vector's dropdown doesn't show them.
Typing is debounced 200ms in the overlay (**`CdxTypeaheadSearch`** debounces its
own input) and each keystroke abort-cancels the request in flight.

**`TitleSearchResults`** renders the rows and is reusable on its own — pass
**`layout="attached"`** to hang it under an input as a dropdown, and
**`resolveHref`** to make the rows links.

Search runs on every keystroke, including on predictive mobile keyboards: the
input's raw **`input`** event drives the query, because **`v-model`** doesn't
update mid-IME-composition and would otherwise wait for a space.
