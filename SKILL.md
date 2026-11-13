---
name: academic_niceslides
description: Build academic talk slides from a paper without AI-slop. Use when the user wants slides, a deck or a talk for a paper, thesis, seminar, conference or defence, or asks to restyle or fix academic slides.
---

# academic_niceslides: academic slides from a paper

You turn a paper into a talk. The engine in this folder renders a semantic deck file in any of the styles under `styles/`,
and a deterministic lint decides whether a deck may be delivered. Talk to the user in their language; write deck text in the language of the talk.

Read `PRESENTER.md` in full before the first deck. It is the method every style shares. Then read `styles/README.md`,
and the `STYLE.md` of the style in use.

## Setup (once)

`LIB` is the folder holding this file (a clone of https://github.com/mamingatzu/academic_niceslides). If you cannot find it, clone it; do not rebuild the engine from memory. Needs Python 3.10+ with `pip install -r $LIB/requirements.txt`, and Chrome
(or `playwright install chromium`; set `ACADEMIC_NICESLIDES_CHROME` to a browser path if it is not found). Fonts are bundled.
Each talk is a project folder holding `deck.json`, `facts.json` and `assets/`. Copy `examples/resume/` to see the shape; never edit it.

## Ask once, then work

One message, only what you cannot find out yourself: the paper (PDF) and any data or replication files; length and audience;
the speaker's name and email for the footer; logos to show (files, plus a light version if a dark style is possible); a style, or "show me options"; whether they want to approve the storyboard first.
If they are not there to answer, take: 12 minutes, a specialist audience, no logos, style options shown in the delivery.

## Steps

1. **Ground.** Write `<project>/analysis.py` that computes every number the talk will show into `facts.json`
   (`{id: {value, text, how}}`). With no data, register the numbers as published and say so in `how` ("Table 2, column 3, p. 14").
   Take figures out of the PDF with `python3 $LIB/engine/extract.py <project> paper.pdf --find <page>` then `--page --bbox --name --label`.
   Never retype a figure, never generate an image.
2. **Storyboard.** Write `deck.json`: for each slide an assertion title (a full sentence, at most two lines), the one piece of evidence,
   the notes, and the click order. If the user asked to approve it, send the titles as a list and wait.
3. **Choose the style.** If the user named none, build two or three slides in all styles (`build.py <project> --open gallery`)
   and send `out/deck.html`: it opens as a gallery of every style. Recommend one, with a reason from `styles/README.md`.
4. **Build.** `python3 $LIB/engine/build.py <project> --styles <slug>` writes `out/deck.html`, one self-contained file.
5. **Lint.** `python3 $LIB/engine/lint.py <project>` must pass. Fix the deck, not the rule: shorten a title, cut a sentence, crop further.
   Do not edit `engine/` or a style's CSS to make a failure go away.
6. **Look.** `python3 $LIB/engine/render.py <project> <slug>` and read `out/sheets/<slug>.png` and `out/steps/<slug>.png` yourself.
   One fix round for what you see: empty halves, a figure too small to read, a click that reveals nothing worth a click.
7. **Deliver.** `out/deck.html` and `out/<slug>.pdf` (one page per click). Tell the user, in their language and in three lines:
   which style you used; which claims you softened because the evidence did not carry them; and that the HTML file edits itself
   (press E while presenting): text, click order, chart labels, figure crop and zoom, colours, slide order, speaker notes.
   If they need PowerPoint: `python3 $LIB/engine/export_pptx.py <project> --style <slug>`, then send the `.pptx` with `out/fonts/`.

## After delivery

- The user sends back an edited `deck.json` (exported from the editor): put it in the project, lint, rebuild. Never overwrite it with your earlier version.
  Images they uploaded travel inside it under `uploads`; `build.py` unpacks them into `assets/uploads/` and rewrites the paths.
- Tell users that in the editor they click any text, label, logo, image or chart to get its own toolbar, the way Google Slides works.
- "Change X on slide N": edit `deck.json`, not the HTML. Rebuild and lint.
- PowerPoint is a one-way exit: text is native and editable, charts and figures are pictures, reveals are native click animations
  (`--pages` gives one slide per click instead). Edits made in PowerPoint are lost on the next build; say so once.

## The deck file

See `examples/resume/deck.json` for every layout in use. Top level: `{"meta": {...}, "slides": [...]}`. Layouts: `title`, `flow` (numbered steps), `fig` (chart + notes),
`models` (coefficient plot + table), `paperfig` (a figure from the paper), `close` (numbered conclusions + references).
Chart kinds: `bars`, `lines`, `coef`. Text markup: `{fact_id}`, `[a|term]` / `[b|term]` (ties a word to a data series), `[c|citation]`.

- **Numbers** appear only as `{fact_id}`. The build fails on an unregistered id.
- **Step-by-step reveal**: add `"at": n` to a bar, a series, a coefficient row, a table row, a note or a step. Bars also take
  `"gap"` (a dimension line with the difference) and `"sig"` (a bracket with the test result), each with its own `"at"`.
  Typical order: groups → difference → test. At most four clicks a slide.
- **Logos**: `META["logos"] = [{"file", "dark", "alt"}]`. They show on the title slide and, the first one, in the footer. Nowhere else.
- **Paper figures**: `"figure": {"src", "source", "text_px", "crop": [x, y, w, h], "cover": [[x, y, w, h]], "focus": {"box": [x, y, w, h], "at": 1}}`.
  Boxes are fractions; `crop` of the image, `cover` and `focus` of the cropped view. `text_px` comes from `extract.py`.
  Say in the caption what was left out. If lint reports `figure-legible`, crop or zoom further, or redraw from registered data and say "redrawn from Table X".
- **Footer**: `meta.short` (short title), `meta.author` and `meta.email` appear on every content slide. Ask for them; never invent an email.
- **Text formatting**: `[s|bold]`, `[e|extra accent]`, `[m|muted]` besides `[a|..]` and `[b|..]`. Use them sparingly; the editor applies the same markup.
- **Arrangement**: `"lay": {"side": "l"|"r", "split": 5–9, "valign": "start"|"center"|"end"}` on `fig`, `paperfig`, `flow`, `close` slides. Omit it to keep the style's layout.
- **Optional**: `"say"` on a slide is its speaker note (N while presenting; `render.py --handout` prints slides with notes). `meta.cite` is the full citation, `meta.link` a URL that becomes a QR code on the closing slide, `meta.style` the default style.
- **Anchor**: `META["anchor"] = {"kind": "image", "src": "assets/..."}` for one image from the paper that recurs on the title, method and closing slides. Omit it if the paper has none.

## What you never do

- No text above the title, no number set larger than its sentence, no cards, icon rows or decorative labels. The deck file has no field for them; do not add one.
- No second typeface, no text under 14pt (28px), no slide whose title is a topic rather than a claim.
- No altered paper figure: crop, cover and zoom only. No AI-generated or stock images.
- No claim in a title that the evidence on the slide does not support.

## Requests that change the plan

- **"More polished"** means composition, not ornament: one main visual a slide, the anchor repeated, a different style. Not smaller type or more elements.
- **A new style**: `PRESENTER.md` §13. Write the `STYLE.md` first; a style is a medium, not a palette.
- **PowerPoint**: export it (see above) and name the limits: pictures for charts, fonts to install, one-way.
- **Speaker notes or a handout**: fill `"say"` on each slide, then `render.py <project> <slug> --handout`.
