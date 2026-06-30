/**
 * InsightOS Design Token → CSS Variable Generator
 * 
 * Reads color-tokens and typography-tokens.json and outputs a single
 * design-tokens.css file containing:
 *   - Light-mode color role variables  (:root)
 *   - Dark-mode color role variables   ([data-theme="dark"])
 *   - Typography variables             (:root)
 *
 * Color roles reference the palette via "{color.palette.X.Y}" syntax.
 * The script resolves every reference to its concrete HSL value before
 * writing the CSS.  Primitive palette colors are intentionally excluded
 * from the output — only semantic color roles are exposed as variables.
 */

const fs = require('fs');
const path = require('path');

// ── Paths ────────────────────────────────────────────────────────────
const COLOR_FILE   = path.join(__dirname, 'color-tokens');
const TYPO_FILE    = path.join(__dirname, 'typography-tokens.json');
const OUTPUT_FILE  = path.join(__dirname, 'design-tokens.css');

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Convert a camelCase or PascalCase string to kebab-case.
 * "onPrimaryContainer" → "on-primary-container"
 * "surfaceContainerHigh" → "surface-container-high"
 */
function toKebab(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Convert a space-separated token name to kebab-case.
 * "display large" → "display-large"
 */
function nameToKebab(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Parse an HSL string like "hsl(218, 100%, 33%)" into {h, s, l}.
 */
function parseHSL(str) {
  const m = str.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/);
  if (!m) return null;
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) };
}

/**
 * Format {h, s, l} back to an HSL string.
 */
function formatHSL({ h, s, l }) {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Linearly interpolate between two numbers.
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Given a palette object (e.g. { "0": "hsl(…)", "10": "hsl(…)", … })
 * and a requested tonal stop that may NOT exist, interpolate between
 * the two nearest defined stops.
 */
function interpolateTone(palette, tone) {
  const definedTones = Object.keys(palette).map(Number).sort((a, b) => a - b);

  // Find the two surrounding stops
  let lower = definedTones[0];
  let upper = definedTones[definedTones.length - 1];

  for (const t of definedTones) {
    if (t <= tone) lower = t;
  }
  for (let i = definedTones.length - 1; i >= 0; i--) {
    if (definedTones[i] >= tone) upper = definedTones[i];
  }

  if (lower === upper) return palette[String(lower)];

  const lowerHSL = parseHSL(palette[String(lower)]);
  const upperHSL = parseHSL(palette[String(upper)]);
  if (!lowerHSL || !upperHSL) return palette[String(lower)];

  const t = (tone - lower) / (upper - lower);

  // Handle achromatic endpoints: when S=0 or L=0 the hue is
  // meaningless so we inherit it from the chromatic neighbor.
  const lowerIsAchromatic = lowerHSL.s === 0 || lowerHSL.l === 0;
  const upperIsAchromatic = upperHSL.s === 0 || upperHSL.l === 0;

  let h, s;
  if (lowerIsAchromatic && !upperIsAchromatic) {
    h = upperHSL.h;
    s = lerp(0, upperHSL.s, t);
  } else if (upperIsAchromatic && !lowerIsAchromatic) {
    h = lowerHSL.h;
    s = lerp(lowerHSL.s, 0, t);
  } else {
    h = lerp(lowerHSL.h, upperHSL.h, t);
    s = lerp(lowerHSL.s, upperHSL.s, t);
  }

  return formatHSL({
    h,
    s,
    l: lerp(lowerHSL.l, upperHSL.l, t),
  });
}

/**
 * Resolve a token reference like "{color.palette.primary.80}"
 * against the full color-tokens object.  If the reference points to a
 * palette tone that doesn't exist, interpolate it from nearby stops.
 */
function resolveReference(value, colorData) {
  if (typeof value !== 'string') return value;

  const refMatch = value.match(/^\{(.+)\}$/);
  if (!refMatch) return value;

  const refPath = refMatch[1].split('.');
  let current = colorData;

  for (let i = 0; i < refPath.length; i++) {
    const segment = refPath[i];
    if (current == null || typeof current !== 'object') return value;

    // Case-insensitive key lookup to handle "Error" vs "error"
    const key = Object.keys(current).find(
      k => k.toLowerCase() === segment.toLowerCase()
    );

    if (key !== undefined) {
      current = current[key];
    } else {
      // Try to interpolate a missing tonal stop in a palette
      // This is the case when segment is a number (e.g. "6") and
      // the parent object is a palette with numbered keys.
      const tone = parseFloat(segment);
      if (!isNaN(tone) && typeof current === 'object') {
        const result = interpolateTone(current, tone);
        return result;
      }
      return value;  // can't resolve
    }
  }

  return current;
}

/**
 * Map a CSS font-weight number to its keyword (for readability).
 */
function fontWeightKeyword(weight) {
  const map = {
    100: '100', 200: '200', 300: '300',
    400: '400', 500: '500', 600: '600',
    700: '700', 800: '800', 900: '900',
  };
  return map[weight] || String(weight);
}

// ── Read source files ────────────────────────────────────────────────
const colorData = JSON.parse(fs.readFileSync(COLOR_FILE, 'utf-8'));
const typoData  = JSON.parse(fs.readFileSync(TYPO_FILE, 'utf-8'));

// ── Build colour role variables ──────────────────────────────────────

function buildColorRoleVars(roles, colorData) {
  const lines = [];
  for (const [roleName, rawValue] of Object.entries(roles)) {
    const resolved = resolveReference(rawValue, colorData);
    const varName  = `--color-${toKebab(roleName)}`;
    lines.push(`  ${varName}: ${resolved};`);
  }
  return lines;
}

const lightRoles = colorData.color.role.light;
const darkRoles  = colorData.color.role.dark;

const lightVars = buildColorRoleVars(lightRoles, colorData);
const darkVars  = buildColorRoleVars(darkRoles, colorData);

// ── Build typography variables ───────────────────────────────────────

// We use the "typography" section which has individually typed properties.
const typoSection = typoData.typography;
const typoVars = [];

// Collect all unique font families for reference
const fontFamilies = new Set();

for (const [styleName, props] of Object.entries(typoSection)) {
  const prefix = `--typo-${nameToKebab(styleName)}`;

  const fontSize      = props.fontSize?.value;
  const fontFamily    = props.fontFamily?.value;
  const fontWeight    = props.fontWeight?.value;
  const fontStyle     = props.fontStyle?.value;
  const letterSpacing = props.letterSpacing?.value;
  const lineHeight    = props.lineHeight?.value;
  const textTransform = props.textCase?.value;

  if (fontFamily) fontFamilies.add(fontFamily);

  if (fontSize      !== undefined) typoVars.push(`  ${prefix}-font-size: ${fontSize}px;`);
  if (lineHeight    !== undefined) typoVars.push(`  ${prefix}-line-height: ${lineHeight}px;`);
  if (fontWeight    !== undefined) typoVars.push(`  ${prefix}-font-weight: ${fontWeightKeyword(fontWeight)};`);
  if (fontFamily)                  typoVars.push(`  ${prefix}-font-family: '${fontFamily}', sans-serif;`);
  if (fontStyle && fontStyle !== 'normal')
                                   typoVars.push(`  ${prefix}-font-style: ${fontStyle};`);
  if (letterSpacing !== undefined && letterSpacing !== 0)
                                   typoVars.push(`  ${prefix}-letter-spacing: ${letterSpacing}px;`);
  if (textTransform && textTransform !== 'none')
                                   typoVars.push(`  ${prefix}-text-transform: ${textTransform};`);

  typoVars.push('');   // blank line between style groups
}

// ── Assemble output ──────────────────────────────────────────────────

const banner = `/*  ═══════════════════════════════════════════════════════════
 *  InsightOS Design Tokens — auto-generated
 *  Generated: ${new Date().toISOString()}
 *  Source:    color-tokens  ·  typography-tokens.json
 *
 *  DO NOT EDIT MANUALLY — regenerate with:
 *    node generate-tokens.js
 *  ═══════════════════════════════════════════════════════════ */`;

const css = `${banner}

/* ── Light-mode Color Roles ───────────────────────────────── */
:root {
${lightVars.join('\n')}
}

/* ── Dark-mode Color Roles ────────────────────────────────── */
[data-theme="dark"] {
${darkVars.join('\n')}
}

/* ── Typography ───────────────────────────────────────────── */
:root {
${typoVars.join('\n').trimEnd()}
}
`;

fs.writeFileSync(OUTPUT_FILE, css, 'utf-8');

console.log(`✅  design-tokens.css generated successfully!`);
console.log(`    → ${OUTPUT_FILE}`);
console.log(`    → ${lightVars.length} light-mode color variables`);
console.log(`    → ${darkVars.length} dark-mode color variables`);
console.log(`    → ${typoVars.filter(l => l.trim()).length} typography variables`);
