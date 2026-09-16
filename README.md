# car-key-technologies
Marketing website for Car Key Technologies — digital key and key fob programming for the auto and truck industry.

## Accessibility

This site targets WCAG 2.2 Level AA. See [`/accessibility-statement.html`](./accessibility-statement.html) for the full statement.

**Structural fixes (present regardless of JavaScript):**
- Semantic `<header>` / `<nav>` / `<main>` / `<footer>` landmarks on every page.
- Skip links ("Skip to main content" / "Skip to navigation" / "Skip to footer"), visible on keyboard focus.
- Visible `:focus-visible` outlines on every interactive element.
- Inline text links are underlined, not distinguished by color alone.
- One visible, descriptive `<h1>` and a unique `<title>` per page.

**`a11y.js` / `a11y.css`** (loaded on every page) add:
- A floating "Accessibility options" launcher (bottom-right desktop / bottom-center mobile) opening a focus-trapped dialog with: text size (100–200%), line spacing, a light/dark/high-contrast theme, a "highlight links" toggle, a dyslexia-friendly font (Atkinson Hyperlegible), an on-screen reading guide (arrow-key adjustable), a big-cursor mode, an enhanced focus ring, a reduce-motion toggle (also respects `prefers-reduced-motion` automatically), and a "pause all media" control.
- A standalone quick light/dark theme toggle (mounted into the nav).
- All of the above wrap or supplement the existing landmarks/skip-links rather than replacing them, so the page degrades gracefully if JavaScript fails to load.

Settings are stored client-side only, in `localStorage` under `a11y_prefs_v1`. Nothing is tracked or sent to a server.

**Known limitation:** the Request Service / Become a Partner forms on the Contact page are third-party Zoho Forms embeds; their internal accessibility is controlled by Zoho, not this codebase.

**Maintaining this:** run an accessibility check (e.g. `npx @axe-core/cli <url> --tags wcag2a,wcag2aa,wcag22aa` or the axe DevTools browser extension) after any structural change to `index.html`, `about.html`, `contact.html`, `industries.html`, `partners.html`, or `services.html`. A CI check (`eslint-plugin-jsx-a11y` doesn't apply to plain HTML — use `axe-core`/`pa11y-ci` in a GitHub Action) is a good next step; see the accessibility test report in this repo for the current baseline.
