# virgoOS UI design manual

How the virgoOS interface looks and behaves, and the rules for adding to it. It covers the node UI, Setup and the fleet UI. Read it before designing a screen, a dialog or a single control.

The same rules, drawn with Do and Don't examples, are in `design/index.html` (open it in a browser straight from a clone, no build needed). Keep the two in step: a rule changed here is changed there.

The fastest way to get a new screen right is to find the closest existing screen and copy its shape. When this manual and the existing screens disagree, ask before choosing.

## Principles

1. **Calm and quiet.** Neutral surfaces, one brand blue, color only where it carries meaning (state, direction, danger). Most text is near black or muted gray.
2. **Same job, same look.** Every list page, detail page, settings section and dialog follows one of the patterns below. Never invent a new layout for a job an existing pattern already does.
3. **Stock before custom.** Use Bootstrap 6 classes, modifiers and the theme tokens first. Write SCSS only when no class can do it, as a scoped modifier class. Never use inline `style=""`, not even for a CSS variable. (Some older templates still have inline styles; do not copy them.)
4. **Both themes, always.** Every color comes from a token that already adapts to light and dark. Never hardcode a hex value in a screen.
5. **Smallest fix.** When something looks wrong, find the one cause and fix only that. Layout restructures are proposed first, not done.

## The shell

- A narrow icon rail on the left: logo on top, page icons in groups separated by thin dividers, the collapse toggle and the account avatar at the bottom.
- The page sits on a white (dark: near black) rounded panel raised over a soft tinted background.
- The active page in the rail gets a filled rounded square behind its icon. A small badge on a rail icon (for example the update arrow on Apps) signals something waiting there.

## Page types

### Page title (every page)

- Duotone icon of the page, then the page name, as an `h4`. The icon is the same one the rail uses.
- The page's single primary action sits at the top right as a small outline secondary button ("App center", "New user").

### List pages (Apps, Users, Folders, Storage, Services...)

- Under the title: a search field (no floating label, placeholder "Search"), an optional filter icon button next to it, and the item count on the far right ("3 apps").
- A full width table. Sortable columns show a faint up/down caret; the active direction turns brand blue. Numeric and icon-only columns are compact; icon-only headers carry a tooltip.
- The whole row opens the item's detail page at its own address; it ends with a ⋮ menu and a light chevron (`icon-light icon-caret-right fg-4`). Clicks on links and the menu stay with them. Never a "View details" button per row.
- Secondary columns hide below the `md` breakpoint so the table still reads on a phone; the ⋮ menu and the chevron always stay.
- Each row starts with the item image (app logo, avatar with initials, or a light weight icon). Stopped items show their image in grayscale.

### Detail pages

- Top row: back button, item image, name with status badges, and its link (blue, with the external link icon) under the name.
- Top right: the action tray. Start, Restart and Stop as icon buttons in a soft gray tray, the ⋮ menu attached at its end. Icons are colored only when the action is possible (green play, neutral restart, red stop) and gray when not.
- Left column: facts, each as a small label above its value (State, Updates, Resource usage, Data).
- Right side: underline tabs, each with an icon and a count ("Services 3", "Snapshots 78").
- On wide screens the facts column stays beside the tabs; on narrower screens the facts become a tab.

### Settings style pages (Network, Settings, About, Profile)

- Two columns. Left: the section name (`h5`) and one plain sentence saying what the section is for ("The name the node answers to."). Right: one card for that section.
- A card starts with a square icon tile (soft brand blue background, duotone icon). Next to it the main value in large text, with supporting values as small gray pill badges written as "Label value" ("Hostname spica").
- Further values below, in a grid, each with its small label **above** the value. Never put labels under values.
- Card actions are text links with an icon on the right side of the card: "Edit" (pen), "Add" (plus), "Refresh" (arrows).
- Dangerous actions (Reboot, Shut down) are a row with a title and a one-line consequence ("The node stays off until you power it on again.") and a small solid red button on the right.
- An empty section shows a gray icon tile and a plain statement ("No trusted proxies configured") with the "Add" link.

### Dashboard

- Node chips across the top, a time range slider, then one strip of metric tiles (CPU, RAM, Network, disks, UPS): a label top left, an optional status badge top right, a big number with a small unit, a chart or bar, and two small facts at the bottom.
- App shortcuts in groups; each group has a small pill label. Cards are flat and gain a soft shadow on hover.

## Screen sizes

Everything works from a phone to a wide desktop. Design the phone width first.

| Width | What changes |
| --- | --- |
| under 576px | No side menu: a top bar with the account and a ⋮ button that opens navigation in a bottom drawer |
| `sm` 576px | The side menu appears, collapsible to icons |
| `md` 768px | Tables show secondary columns, detail pages show the action tray, buttons show labels beside icons |
| `lg` 992px | Settings style pages split into two columns; apps open in floating windows |
| `xl` 1200px | The dashboard lays shortcuts out in a fluid grid |
| `2xl` 1400px | Detail pages keep the facts column beside the tabs; below this the facts become a tab |

- Use the breakpoint prefixes (`md:d-table-cell`, `lg:col-4`, `md:d-none`), not media queries.
- Stack first: columns start as `col-12` and split from `lg` up.
- Never hide an action on a phone; move it into the ⋮ menu.
- Long values wrap or truncate in their own cell; the page never scrolls sideways.

## When to use a dialog

A dialog is for a short task the user comes back from to the same page.

- **Dialog:** creating or editing one thing from the current page (New user, Edit host); a list that belongs to one row (Sessions); a focused task with steps or a picker (App center, Expand pool, Replace drive, Restore snapshot).
- **Confirm dialog:** one yes or no before something destructive or disruptive.
- **Not a dialog:** looking at one item (its own address and detail page); turning a setting on or off (a switch that applies at once); reporting a result or a running job (a toast); explaining (a tooltip or help text); something that takes over the node, like a system update (a full page).
- **Sizes:** `dialog-sm` for a question or a few fields, default for a form, `dialog-lg` for a picker or tree, `dialog-xl` for a table or catalog.

## Dialogs

- Header: the title only, in sentence case ("New user"). A close button only on dialogs that show information and have no footer actions (for example Sessions).
- Footer: Cancel (outline, secondary) pushed to the right, then the primary action (solid primary) at the far right. Destructive dialogs use a solid red primary.
- Sizes: small for a single question or field, default for forms, large or extra large for browsers and tables.
- The backdrop blurs and grays the page behind it. Header and footer float over the body with a blurred background so long bodies scroll under them.
- Every dialog root has `tabindex="-1"`.
- Confirmations go through the shared confirm dialog, worded as a question ("Are you sure you want to delete the user emma?") with an explicit red action ("Yes, delete", "Reboot"). When an action can lose data, the confirm button stays disabled until the user ticks an acknowledgment checkbox.

## Forms

- Inputs use floating labels inside the field. The label is the field name in sentence case ("Email address", "Confirm password").
- Group related fields; separate groups with vertical space, not with headings, unless the form is long.
- A button that starts a slow action switches to a progress label ending in three periods while it runs ("Creating pool...", "Signing in...").
- Help that explains a field sits inline in the label as a hint, not as a paragraph above the form. Do not restate validation rules in help text; the validation messages already say them.

### Validation

- Every form validates in the browser before anything is sent (`u-form` with a `validation` list).
- A field is checked 300 ms after typing stops and again when the user leaves it. Submitting checks every field and focuses the first one that fails.
- A failing field turns red with one message under it: the first rule that failed.
- A check that needs the server shows a status line with a spinner under the fields ("Checking availability...", then "This name is available").
- If the server still rejects the request, the reason comes back as an error toast.

Messages are a few words saying what the field needs: sentence case, no period, no "please", no "Error:", no blame, no internal codes. Reuse the existing wording: "Can't be empty", "Invalid email address", "At least 8 characters", "Passwords do not match", "Must be unique", "Letters, digits and hyphens only", "Must be a domain with a TLD, like example.com".

### Autocomplete

Only the user's own login gets real values; everything else is `off`, so a saved password never lands in the wrong field.

| Field | `autocomplete` |
| --- | --- |
| Username when signing in | `username` |
| Password when signing in | `current-password` |
| The user's own new password when signing up, or in Setup | `new-password` |
| The user's own name when signing up | `name` |
| 6-digit sign in codes | `one-time-code` |
| Everything else: other people's details, password changes in a profile, service credentials (SMTP, the fleet account in Setup), node names and addresses, search and filter fields | `off` |

## Color

| Meaning | Color |
| --- | --- |
| Brand, primary actions, links, selection, active sort | brand blue (`#658ffc`, the `primary` theme) |
| Running, healthy, online, success, allowed | green |
| Failed, critical, 90% full, destructive, locked | red |
| Needs attention: 80% full, UPS on battery, drive health warning, slow I/O | orange |
| Minor: app only partly running, warm drive, waiting on the user ("Awaiting code") | yellow |
| Groups, roles, accounts | purple |
| Network: download (RX) | blue, arrow down |
| Network: upload (TX) | purple, arrow up |
| Neutral metadata, counts, labels | gray |

- Health is a ladder: green, yellow, orange, red. When several conditions apply, show the worst.
- Surfaces come from tokens: page, card, sunken, component (hover, active), modal. Use the `bg-1` to `bg-4` levels and never pick a gray by eye.
- Text has three levels: body, secondary (descriptions, `fg-emphasis-secondary`), muted (`fg-4`, small labels and empty state titles).
- Color scales run from `025` to `975`. In practice: `100` for tinted badge backgrounds, `300` to `400` for icons on light backgrounds, `500` for strong marks (dots, bars). Use the `fg-*`, `bg-*` and `border-*` scale classes.
- Disabled icons are `gray-500`.

## Buttons

| Button | Use for |
| --- | --- |
| Primary (solid) | The one main action of a dialog or step; at most one per view, placed last |
| Secondary outline | Cancel, and the page action at the top right (New user, App center) |
| Danger (solid red) | Removes, stops or interrupts something (Reboot, "Yes, delete", a pool create that wipes drives) |
| Link with an icon | Routine actions inside a card (Edit, Add, Refresh) |
| Icon only, text style | Toolbars, action trays, the ⋮ toggle; tray and toolbar buttons carry a tooltip |

There are no green, orange or yellow buttons.

## Toasts

The title is a full sentence ending with a period.

| Type | Use for | Lifetime |
| --- | --- | --- |
| `success` | A user action finished ("Session ended.") | Hides after 5 seconds |
| `error` | Something failed ("Failed to end the session."), including a request the server rejected | Stays until dismissed |
| `warning` | The user must fix something outside the app, and the toast says how | Stays until dismissed |
| `info` | A job is running | Can't be dismissed; becomes success or error when the job ends |
| `neutral` | A notice about the node (connection lost, reboot needed), often with an action button | Stays |

A problem with one field goes under the field, not in a toast. Anything the user must decide is a dialog.

## Badges

- Pills (`u-badge ... pill`). Neutral information is gray `100`. Status badges use the status color: green running or healthy, yellow minor, orange needs attention, red failed or locked, purple groups and roles. The one shape exception: a dashboard tile's status (ONLINE, GRID, BATTERY) is a small square uppercase badge.
- A badge can hold a small label and a value: the label in lighter weight, then the value.
- Counts of running parts use "2 / 2" style in a green badge when all run.
- Status dots inside badges are small filled circles colored by state.

## Typography

- Inter (variable), falling back to the system UI font. Do not introduce another typeface.
- Sizes: `h4` page titles, `h5` section titles and empty state messages, body text, `small` for labels, descriptions and badge text.
- Numbers that update or line up in columns use tabular figures (`numeric-tabular`).
- Big metric values show the unit smaller beside the number ("24 %").
- Terms that have an explanation get a dotted underline and a tooltip (`tooltip-hint`), like "99% cache hit".

## Icons

- Phosphor icons only. Weights by role:
  - **duotone:** page titles, card icon tiles, feature marks
  - **regular:** buttons, actions, menu items, inline marks
  - **fill:** small glyphs (⋮ menu, carets, status dots, icons inside badges)
  - **light:** quiet labels and fallback item images
- Use fixed width (`icon-fw`) wherever icons stack in a column (menus, lists).
- Always write the full icon class name (`icon-pen`). Never build it from parts (`icon-${name}`). The build keeps only the icons it can find written out in full, so a built name disappears.

## Menus and actions

- The ⋮ menu (`icon-dots-three-outline-vertical`) holds an item's actions, grouped with dividers: updates first, then start, then restart, stop and kill, then removal.
- Destructive menu items are red. An action that cannot run right now stays visible but disabled, with a tooltip that says why.
- In a list row the ⋮ menu holds every action; on the detail page the common ones move into the action tray.
- While a job runs on an item, its action area shows a spinning gear instead of buttons.

## States

Every screen that loads data designs all four states:

- **Loading:** a centered spinner in gray.
- **Error:** a centered short message in light red ("Error fetching data").
- **Empty:** a centered illustration with one muted `h5` sentence under it ("No apps installed").
- **No results:** the no-results illustration with "Nothing matches the search" (or "...the search or filters").

Missing single values show a dash placeholder (`'—'`), never "N/A" or a blank.

## Illustrations

- Isometric, flat, light line work, on a rounded platform with a faint grid. Accents are brand blue, with green for success and red for errors. They animate gently (float, blink, pulse).
- They are generated by `scripts/illustrations.js`; `scripts/illustrations.html` previews all of them in both themes. A new illustration is added there, in the same style, never drawn by hand or taken from elsewhere.
- Use one per empty or final state screen, never decoratively elsewhere.

## Tooltips

- A tooltip written as a sentence ends with a period ("The pool mixes drive types."). Action labels and short status phrases do not ("Expand pool", "Snapshots disabled").
- Tooltips explain; they do not repeat the visible label.

## Punctuation by kind

| Kind | Example | Ends with |
| --- | --- | --- |
| Toast title | Session ended. | period |
| Description | The name the node answers to. | period |
| Tooltip, a sentence | The pool mixes drive types. | period |
| Confirm question | Are you sure you want to delete the user emma? | question mark |
| Tooltip, an action | Expand pool | nothing |
| Tooltip, a status | Snapshots disabled | nothing |
| Title, label, button | New user, Default gateway, Create | nothing |
| Badge | locked, 3 / 3 | nothing |
| Placeholder | "Search", "IP, CIDR, or hostname", "https://" | nothing |
| Validation message | Can't be empty | nothing |
| Something in progress | Creating pool..., Checking availability... | three periods |

A placeholder is a single word or the format the field expects, shown only while the field is empty. Only search fields use it instead of a label. It never gives instructions ("Enter your email here...").

## Layout details

- Single line flex rows align items to the center, never to the baseline, even with mixed text sizes.
- Spacing, sizes and colors come from utilities (`gap-3`, `px-2`, `btn-sm`, `btn-group-sm`). A one-off margin in SCSS is a sign a utility was missed.
- Breakpoints use the Bootstrap 6 prefix form (`md:d-table-cell`, `lg:col-4`). Design every screen at phone width as well; tables hide columns, trays collapse into menus.

## Motion

- Motion stays on for everyone; there is no reduced motion fallback, by choice.
- Buttons shrink slightly on press, badges can reveal a label on hover, cards lift with a shadow. Keep transitions short (about 0.15 to 0.3 s) and functional.

## Copy

- Sentence case for titles, buttons and labels ("New user", "App center", "Shut down").
- Section descriptions are one plain sentence from the user's point of view, written as what the thing is for.
- No em or en dashes as punctuation anywhere. Use a comma, colon, period or parentheses.
- Fixed wording: "Logged in as" (never "Signed in as"), "Sign out". The first run flow is "Setup", never "wizard". The product is "virgoOS". "Dashboard" means only the Dashboard page, never the whole interface.
- Romanian copy is written to read naturally to a Romanian speaker, not translated word for word.

## Accessibility attributes

Add `aria-*` or `role` only when our CSS or JS, or a library we use, reads it (for example `aria-expanded` for the rotating chevron). Do not add them for their own sake.

## Before you ship a screen

- [ ] It matches the closest existing page type; a new pattern was agreed first.
- [ ] Checked in light and dark mode, and at phone width.
- [ ] Buttons, badges and toasts use the color for their meaning.
- [ ] Every form validates with the house wording, and sets `autocomplete`.
- [ ] Loading, error, empty and no-results states exist.
- [ ] No inline styles, no hardcoded colors, no custom CSS that a class could replace.
- [ ] Labels above values, centered flex rows, icon names written in full.
- [ ] Copy: sentence case, no dashes, tooltip periods right, fixed wording respected.
- [ ] Destructive actions are red and confirmed; data loss needs an acknowledgment.
- [ ] The user docs (virgo-docs) and their screenshots are updated if the screen changed.
