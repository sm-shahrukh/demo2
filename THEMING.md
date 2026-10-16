# Shared styling

Load these stylesheets on each page, in this order:

```html
<link rel="stylesheet" href="css/vendor/bootstrap.min.css">
<link rel="stylesheet" href="css/theme.css">
<link rel="stylesheet" href="css/styles.css">
```

`css/theme.css` owns the design tokens and reusable Bootstrap component defaults.
`css/styles.css` composes the current page and handles responsive layouts using those tokens.
Do not edit the Bootstrap vendor files to customize the brand.

Change these shared tokens in `theme.css`:

| Setting | Tokens |
| --- | --- |
| Brand | `--color-primary`, `--color-primary-rgb`, `--color-primary-hover` |
| Text and surfaces | `--color-text`, `--color-muted`, `--color-surface`, `--color-page` |
| Fonts | `--font-body`, `--font-heading`, `--font-size-base`, `--font-size-*` |
| Buttons | `--font-size-button`, `--button-padding-*`, `--radius-control` |
| Cards | `--radius-card`, `--shadow-card`, `--card-padding` |
| Inputs and popups | `--control-padding-*`, `--radius-popup`, `--shadow-popup` |
| Hero image | `--hero-background-image` |

Use Bootstrap classes such as `btn btn-primary`, `card`, `form-control`, and `form-select`.
For a standalone padded panel with the shared border, corners and shadow, use `theme-card`.
Use the existing `--space-*`, `--font-size-*`, and palette tokens for new components;
add a new token in `theme.css` when a new design value is needed.
