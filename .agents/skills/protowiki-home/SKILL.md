---
name: protowiki-home
description: How the Home prototype (`src/prototypes/home/`, route `/home`) is built — the logged-out Main Page → Create account → onboarding wizard → personalized Home story; its module registry (`modules.ts`, `HomeSection`, `HomeCard`), data loaders in `home/data/`, the no-jump loading contract, state layers (Mock user preset, `protowiki-home-config-v1`, day cache, URL params), layout and personalization dialogs, and the shared ProtoWiki hooks it registers (article opener, account actions). Use when changing the Home, adding or changing a Home module, touching its onboarding, or building test links for it.
---

# The Home prototype

A demo where you go through onboarding after account creation, and then land
on a personalized Home. It lives in `src/prototypes/home/` and its sibling
route folders, and is the rebuilt version of `home2`'s `wikita-lite` prototype.

The story, end to end:

1. **Logged out**, `/home` is today's live Main Page, under a one-time intro
   splash ("Home prototype … Begin"). Links open articles in the prototype at
   `/home/wiki/<Title>`.
2. **Create account** (Vector header link, Minerva avatar menu) opens the
   prototype's own `/home/create-account`. From an article it passes
   `?from=<Title>`.
3. Submitting signs in as the **New user** preset, named as typed, and opens
   the **onboarding wizard** over the Home: Welcome → Survey → Interests. The
   `from` article is the first interest.
4. The **Home** shows the modules the survey answer picked, personalized from
   the interests and the Mock user's saved, edited and watched pages.

Component APIs live in [`protowiki-components`](../protowiki-components/SKILL.md);
Codex usage in [`codex-usage`](../codex-usage/SKILL.md); the APIs the loaders
call in [`wiki-apis`](../wiki-apis/SKILL.md).

## Routes

| Route                  | Folder                 | What                                                                    |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------- |
| `/home`                | `home/index.vue`       | Logged out: Main Page + splash. Signed in: `HomeDashboard` (+ wizard)   |
| `/home/wiki/<Title>`   | `home.wiki.[title]/`   | An article in the prototype (`ArticleLive`), save button, floating Home |
| `/home/<module>`       | `home.[module]/`       | A module's own page, for modules with `pageSize`; else back to `/home`  |
| `/home/create-account` | `home.create-account/` | Mock `Special:CreateAccount`; the static segment wins over `[module]`   |

Every page wraps in **`HomeChrome`** (not bare `ChromeWrapper`). It points the
wordmark at `/home`, passes the Home's Vector nav tools, registers the article
opener and account actions, puts the ☰ "Reset prototype" menu in the header,
and asks before any link leaves the prototype (`useHomeLeavePrototype`).

## Folder layout

`home/` is flat:

- `Home*.vue` — components. `HomeSection` / `HomeSectionFrame` / `HomeCard` are
  the module surface; `Home*Dialog.vue` sit on `HomeDialogShell`;
  `HomeOnboarding*.vue` are the wizard.
- `use*.ts` — composables, mostly **module-level** state shared by every page.
- `modules.ts` — the module registry. `routes.ts` — paths and title helpers.
- `data/` — plain TS: config, URL params, cache, fetchers, `load*` per module,
  types. No Vue components.

Shared helpers it uses: `src/lib/fetchWikimedia.ts` (per-host queue, retry,
7s timeout), `src/lib/mapWithConcurrency.ts`, `src/components/search/titleSearch.ts`.

## State, in four layers

| Layer            | Where                                                 | Holds                                                                                         |
| ---------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Mock user preset | ProtoWiki config, `?user=`                            | Signed in or not (`logged-out` → Main Page), and the Saved / edited / watched page lists      |
| Home config      | `data/homeConfig.ts`, `protowiki-home-config-v1`      | Account name, save times, layout, interests, sources, onboarding step, survey, mentor, splash |
| Day cache        | `data/homeCache.ts`, `protowiki-home-cache-v1:<slot>` | Disposable module data per UTC day; never caches empties                                      |
| URL params       | `data/homeUrlParams.ts`                               | Test-link seeds, applied once then stripped                                                   |

- **Who is signed in is the Mock user preset**, never the Home config.
  `useHomeAccount()` reads it; `logIn(name?)` sets `new`, `logOut()` sets
  `logged-out`. The default preset is `new`, so a logged-out link needs
  `?user=logged-out`.
- **Switching account while navigating:** use `goHomeAs(switchAccount)`. A
  preset change rewrites `?user=` on the current route, which cancels a push in
  flight; `goHomeAs` switches in a one-shot `afterEach` instead.
- **Saved pages** are the preset's `readingList` (`useHomeSaved`); the Home
  config only adds when each was saved.
- **Adding a config field:** add it to `HomeConfig`, give it a default, and
  normalize it in `normalizeHomeConfig`. Bump the key only for breaking changes.
- **Module-level composables read the config on first use, not at import**
  (`config.value ??= loadHomeConfig()`), and the reading component must render
  inside `HomeChrome`, whose setup (`useHomeSession`) applies `?reset` first.

### Test links

| Param                                      | Effect                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `?user=logged-out\|new\|experienced\|real` | ProtoWiki's Mock user preset (persists, kept across routes)     |
| `?reset`                                   | Forget the Home config (layout, interests, onboarding, splash…) |
| `?username=<name>`                         | The prototype account's name, shown for the New user preset     |
| `?onboarding=<welcome\|survey\|interests>` | Open the wizard on that step (empty closes it)                  |
| `?nocache=1`                               | Skip day-cache reads                                            |
| `?skin=desktop\|mobile`, `?theme=dark`     | Global appearance                                               |

`reset` runs first, so `/home?user=new&reset&username=Amin&onboarding=welcome`
is a fresh new account at the start of onboarding, and
`/home?user=logged-out&reset` is the start of the story. Home params apply on
a full page load, not on an in-page query change.

The ☰ **Reset prototype** item clears **all** of localStorage (ProtoWiki
settings too) and reloads `/home?user=logged-out`, keeping a `?skin=` /
`?theme=` already in the URL.

## Modules

`modules.ts` is the catalogue: one spec per module. **Components never branch
on a module id** — they read the spec. Which modules show, and in what order,
is the layout (`data/homeLayout.ts`), not the registry order.

A card module (`HomeModuleSpec`):

```ts
{
  id: 'trending',
  title: 'Trending',
  variant: 'article',        // card layout, see below
  slots: 4,                  // cards on the Home = skeletons while loading; may be a function
  pageSize: 4,               // desktop "Show more" step; also gives it /home/trending
  moreLabel: 'Show more …',  // optional
  saveable: true,            // bookmark button on each card
  supportingIcon: cdxIconChart,
  load: loadTrending,        // (signal) => Promise<HomeCardData[]>; throws on failure
  // filters, empty, reloadOn, personalized, layoutLabel — see the type's comments
}
```

A custom module (`HomeCustomModuleSpec`, e.g. Mentor) is `{ id, title, body }`:
`HomeSectionFrame` gives it the shared heading and renders `body`.

**Variants** (`HomeCard`'s `LAYOUTS` table maps each to `CdxCard` props, and
each has an exact-height skeleton):

| Variant   | Used by                                       | Card                                                          |
| --------- | --------------------------------------------- | ------------------------------------------------------------- |
| `hero`    | Featured                                      | 16:9 image above the text                                     |
| `article` | Trending, Daily reads, Suggested edits, Saved | Large thumbnail before the text                               |
| `hook`    | Did you know                                  | Sentence with its article bold, thumbnail after it            |
| `change`  | Review changes                                | Status chips over the title, no thumbnail                     |
| `text`    | Active discussions                            | Title, description, supporting line                           |
| `stat`    | Your impact                                   | Number + label + icon; first spans the row, then two to a row |

### Adding a module

1. Write `data/load<Thing>.ts`: `(signal) => Promise<HomeCardData[]>`. Fetch
   through `fetchWikimedia` (or an existing fetcher: `fetchPageCards` batches
   title/description/thumbnail for 50 pages, `fetchMorelike`, `fetchFeaturedFeed`),
   honour `signal`, and cache with `readDayCache` / `writeDayCache` when the data
   holds for the day. Cards link in-prototype with `to: homeArticleLocation(title)`,
   or off it with `href`.
2. Add its id to `HomeModuleId` and a spec to `HOME_MODULES`. Reuse a variant;
   add one only if no layout fits (then a `LAYOUTS` row and a skeleton height).
3. It joins existing readers' layouts at the end, switched off
   (`resolveHomeLayout`). To show it by default, add it to `SURVEY_ORDER` or
   `DEFAULT_OFF` in `data/homeLayout.ts`.
4. Personal modules grow from `useHomeSeeds().seeds` (interests, then saved,
   edited and watched pages, each while its source is on) and set
   `personalized: true`, which adds the "Configure" menu and the in-place reload.

### Loading contract

`useHomeModule(spec)` (used by `HomeSection`) loads abortably and never jumps:

- It holds `slots` skeletons at once, and only swaps in cards once their images
  have decoded (`preloadImages`, 1.5s cap). "Show more" reserves the next page
  as skeletons the same way.
- Errors show "Couldn't load this section." + Try again. A module with no cards
  drops out, unless its spec has `empty` copy.
- `reloadOn` and Personalization changes reload **in place** (no skeletons,
  revealed cards kept). Personalization reloads are held while the wizard is
  open and run once when it closes.

## Dialogs over the Home

All sit on `HomeDialogShell`: Codex's 32rem modal on Vector, full-height on
Minerva; `tall` gives the wizard one fixed height. It carries a focus holder so
nothing looks selected on open.

- **Home layout** (`HomeLayoutDialog`, the configure button by the greeting):
  on/off switches and drag reorder (`useDragReorder`, ↑/↓ on the handle).
  Saved as `layout`; until then the survey answer's default applies.
- **Personalization** (`HomePersonalizationDialog`, "…" → Configure on a
  personal module): interests (`HomeInterestsLookup`, max 10) and source
  switches.
- **Onboarding** (`HomeOnboarding`): steps come from `ONBOARDING_STEPS` in
  `data/onboarding.ts` plus the `STEPS` table in `HomeOnboarding.vue` (body +
  footer CTA). The survey picks the default layout and leaves Mentor unassigned
  for "read"; the interests step edits Personalization's interests directly.
- **Splash** (`HomeSplash`) on the logged-out Main Page, until dismissed.

## Shared ProtoWiki code it relies on

The Home changed shared code only where a step needed it, each change
backwards-compatible and tagged `PROTOWIKI+ (Home)`
(`git grep -n 'PROTOWIKI+ (Home)'`). Prototypes that don't opt in behave as
before. The pieces a Home-like prototype would reuse:

- `ArticleLive` / `ArticleWrapper` / `ArticleHeader`: `mainPage`,
  `persistCache`, `saved` + `saveClick` — [`article.md`](../protowiki-components/references/article.md).
- `ChromeWrapper` `brandTo`, opt-in Vector nav tools (`home`, `bookmarks`,
  `user-menu`), `accountActions` (Log out, Create account), `MinervaUserMenu`
  — [`wrappers.md`](../protowiki-components/references/wrappers.md),
  [`chrome-primitives.md`](../protowiki-components/references/chrome-primitives.md).
- `articleOpener` (header search opens articles in the prototype),
  `MobileSearchOverlay`, the Vector narrow search box —
  [`search.md`](../protowiki-components/references/search.md).
- `useUserOverride` and the global `?user=` param —
  [`chrome-primitives.md`](../protowiki-components/references/chrome-primitives.md),
  [`protowiki-deploy`](../protowiki-deploy/SKILL.md).

## Conventions specific to the Home

- Port behaviour from `home2` (`git show home2:src/prototypes/wikita-lite/…`),
  never files; UI copy comes from home2 or the author.
- Measure home2 live for fidelity rather than reading its CSS.
- Tag overrides: `CODEX+ <component>: …` on Codex workarounds, and
  `PROTOWIKI+ (Home) …` on shared-code changes.
- Teleported dialogs and popovers render outside `HomeChrome`, so any off-prototype
  link inside one wires `useHomeLeavePrototype().onLeaveCapture` itself.

## Testing notes

- Test desktop (`?skin=desktop`) and mobile (`?skin=mobile`), logged out and
  signed in, light and dark.
- On a dev origin someone also uses, back up localStorage first and restore it
  afterwards: the Home's params write into saved settings, and Reset clears them.
- A hidden browser pane freezes CSS animations at their first frame, throttles
  timers (the 200–300ms search debounces), stops IntersectionObserver (module
  pages' reveal on scroll) and can leave screenshots stale. Front the tab
  before measuring motion.
- Right after a cold load, requests queue on en.wikipedia.org behind the Home's
  own (Review changes' diffs), so allow a few seconds.

## Known gaps

- Module-level state read before an in-app `?reset` stays stale until a reload.
- Switching every module off leaves an empty Home; a module switched off is
  still reachable at `/home/<id>`.
- Reading lists (Vector) and most user-menu rows are inert. Log in leaves for
  the real wiki (Vector) or does nothing (Minerva).
