// Dark theme palette — navy/red/silver on deep dark backgrounds.
// Inspired by modern sports app design (dark mode first).

export const appTheme = {
  // ── Backgrounds ────────────────────────────────────────────────
  bg:          '#0d1117',   // deepest background (screen level)
  bgCard:      '#161d2e',   // card / surface level
  bgElevated:  '#1e2a42',   // elevated elements (modals, inputs)

  // ── Brand ──────────────────────────────────────────────────────
  navy:        '#1a2744',   // primary brand (nav bars, headers)
  navyDark:    '#0f1829',   // deeper navy for contrast
  navyLight:   '#243358',   // lighter navy for hover/pressed states

  // ── Accents ────────────────────────────────────────────────────
  red:         '#8B5CF6',   // primary accent (purple)
  redDark:     '#7C3AED',   // pressed/active purple
  redGlow:     '#8B5CF626', // purple with opacity for glow effects
  neonGreen:   '#39FF14',   // icon accent color

  // ── Text ───────────────────────────────────────────────────────
  text:        '#e8edf5',   // primary text (on dark bg)
  textMuted:   '#8899b4',   // secondary / caption text
  textLight:   '#607d8b',   // tertiary / disabled text

  // ── UI Elements ────────────────────────────────────────────────
  silver:      '#b0bec5',   // icons, dividers, inactive states
  border:      '#243358',   // card borders, dividers
  borderLight: '#1e2a4240', // subtle borders

  // ── Semantic ───────────────────────────────────────────────────
  success:     '#22c55e',
  warning:     '#f59e0b',
  error:       '#e03e2d',

  // ── Legacy aliases (keep for backward compat during migration) ──
  gray:        '#0d1117',   // was light gray bg — now maps to dark bg
  white:       '#ffffff',   // keep for explicit white needs
};