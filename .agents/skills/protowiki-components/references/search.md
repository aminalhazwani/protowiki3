# `Search`

Wikipedia typeahead search — `CdxTypeaheadSearch` wired to the MediaWiki
**opensearch** Action API. Default search component used by **`VectorChromeHeader`**.

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
| `host` | `string` | `'en.wikipedia.org'` | Wiki host the opensearch hits — also picks the language |
| `placeholder` | `string` | `'Search Wikipedia'` | Input placeholder + a11y label |
| `limit` | `number` | `10` | Max suggestions returned |
| `skin` | `'desktop' \| 'mobile'` | `undefined` | |
| `theme` | `'light' \| 'dark'` | `undefined` | |

`lang` / `dir` are inherited from the surrounding wrapper.

## Events

| Event | Payload | Fired when |
| --- | --- | --- |
| `select` | `string` (title) | User clicks / picks a suggestion (also opens it in place when an `articleOpener` is registered) |
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

## Opening articles inside the prototype (`articleOpener`)

By default every suggestion links to the real wiki. A prototype that can render
any article (e.g. the Home's `/home/wiki/<Title>`) registers an opener, for the
lifetime of the component that calls it:

```ts
import { registerArticleOpener } from '@/components/article/shared/articleOpener'

registerArticleOpener({
  href: (title) => router.resolve(`/my-proto/wiki/${encodeURIComponent(title)}`).href,
  open: (title) => router.push(`/my-proto/wiki/${encodeURIComponent(title)}`),
})
```

While one is registered, `Search`:

- links each suggestion to `opener.href(title)` (so ⌘/middle-click opens a new
  tab) and opens it with `opener.open(title)` on a plain click, without a page load;
- drops the "pages containing …" footer (there's no in-prototype results page);
- on Enter (or Vector's **Search** button), opens the best match for the field — an
  exact title, else the first suggestion — instead of submitting to `Special:Search`.

The last registration wins, and it's withdrawn when its component unmounts.

## Inside `VectorChromeHeader`

Desktop Vector chrome always mounts **`<Search />`** in the inline search cluster (no `#search` slot). Its **Search** button submits that form (`form="protowiki-search"`), so it carries the query. Below 1120px the box folds into a search icon; as in Vector 2022, the icon opens the box in place of the header's tools, and it folds again on Escape or when focus leaves it. Most prototypes never import **`Search`** — they use **`ChromeWrapper`**, which renders the default **`ChromeHeader`**.

The chrome user link is **`ChromeHeader`'s **`username`** prop (**`ChromeWrapper`** forwards the same prop when you use the default header). **`username=""`** hides that link.

For a different search surface, replace **`ChromeWrapper`'s `#header`** with a custom **`ChromeHeader`** (fork the template) or your own header markup.

## Etiquette

- The opensearch endpoint accepts `origin=*` and works from the browser
  without CORS preflight.
- Set `host` to a localized wiki to drive search there (`fr.wikipedia.org`,
  `commons.wikimedia.org`, etc.).
- See [`wiki-apis/references/etiquette.md`](../../wiki-apis/references/etiquette.md)
  for the WMF policy on User-Agent and rate-limits when extending this
  beyond opensearch.

## Mobile: `MobileSearchOverlay`

Minerva's search, in `src/components/search/`. **`MinervaChromeHeader`'s default
search button opens it** (a prototype passing its own `right` items brings its
own). It covers the screen with a search field (focused, so the keyboard is up)
over title suggestions from REST `search/title` (`titleSearch.ts`, with
descriptions and free thumbnails), rendered by `TitleSearchResults`.

- There's no results page: Enter does nothing, and picking a row is the way out.
- With an `articleOpener` registered, a row opens in place and the overlay closes;
  without one, rows are plain links to the real wiki.
- Back arrow or Escape closes it (`close` event).

| Prop | Default | Notes |
| --- | --- | --- |
| `placeholder` | `'Search Wikipedia'` | Also the dialog's label |
| `lang` | `'en'` | Wiki searched |
| `limit` | `6` | Max suggestions |
| `theme` | `undefined` | Local theme override |
