# Synapse review demos

Pages built from work in progress on Synapse (TovSpace), for the team to try before a change reaches staging. All data is made up; nothing is saved or sent anywhere, and uploaded files are checked in the browser.

- `docs/` – the published site (GitHub Pages serves this folder).
- `builder/` – the glue that builds it from a `synapse-techability-2026` checkout.

## Rebuilding

From a checkout of the branch or worktree being demoed (with `npm ci` done):

```sh
cp -r <this repo>/builder artifact-demo
OUT_DIR=<this repo>/docs-new npx vite build --config artifact-demo/vite.config.mjs
rm -rf artifact-demo
```

Then copy `builder/index.html`, `public/app-icon-tovspace.svg` and an empty `.nojekyll` into the output, replace `docs/` with it, and check it locally with `uv run python builder/check.py docs`.
