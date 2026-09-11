/**
 * Inline SVG body maps with highlightable muscle regions.
 * Colors: primary #e10600, secondary #6b2b28, idle #2a2a2a
 */
window.MuscleMap = {
  colors: {
    idle: "#2a2a2a",
    primary: "#e10600",
    secondary: "#6b2b28",
    outline: "#3a3a3a",
    skin: "#141414",
  },

  /** @param {string[]} primary @param {string[]} secondary */
  colorFor(id, primary, secondary) {
    if (primary.includes(id)) return this.colors.primary;
    if (secondary.includes(id)) return this.colors.secondary;
    return this.colors.idle;
  },

  /** @param {{ primary: string[], secondary: string[], view?: "front"|"back" }} opts */
  render(opts) {
    const primary = opts.primary || [];
    const secondary = opts.secondary || [];
    const view = opts.view || (primary.includes("lats") || primary.includes("rear_delts") || primary.includes("traps") ? "back" : "front");
    return view === "back" ? this.backSvg(primary, secondary) : this.frontSvg(primary, secondary);
  },

  frontSvg(primary, secondary) {
    const c = (id) => this.colorFor(id, primary, secondary);
    const o = this.colors.outline;
    const s = this.colors.skin;
    return `
<svg viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="100" cy="36" rx="22" ry="26" fill="${s}" stroke="${o}" stroke-width="2"/>
  <path d="M78 62 C70 78 62 100 58 120 L78 128 L100 118 L122 128 L142 120 C138 100 130 78 122 62 Z" fill="${s}" stroke="${o}" stroke-width="2"/>
  <path d="M72 78 C60 90 48 108 42 130 L58 138 C62 112 70 94 78 84 Z" fill="${c("front_delts")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M128 78 C140 90 152 108 158 130 L142 138 C138 112 130 94 122 84 Z" fill="${c("front_delts")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M78 90 C88 100 112 100 122 90 L118 128 L100 122 L82 128 Z" fill="${c("chest")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M84 128 L100 122 L116 128 L114 170 L86 170 Z" fill="${c("abs")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M42 132 L30 190 L44 196 L58 140 Z" fill="${c("biceps")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M158 132 L170 190 L156 196 L142 140 Z" fill="${c("biceps")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M30 192 L22 250 L36 254 L44 198 Z" fill="${c("forearms")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M170 192 L178 250 L164 254 L156 198 Z" fill="${c("forearms")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M44 198 L36 254 L40 262 L48 206 Z" fill="${c("triceps")}" stroke="${o}" stroke-width="1"/>
  <path d="M156 198 L164 254 L160 262 L152 206 Z" fill="${c("triceps")}" stroke="${o}" stroke-width="1"/>
  <path d="M86 170 L70 260 L90 262 L100 176 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
  <path d="M114 170 L130 260 L110 262 L100 176 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
  <path d="M70 260 L62 330 L86 332 L90 264 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
  <path d="M130 260 L138 330 L114 332 L110 264 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
  <path d="M88 150 L100 146 L112 150 L110 168 L90 168 Z" fill="${c("hip_flexors")}" opacity="0.85"/>
</svg>`;
  },

  backSvg(primary, secondary) {
    const c = (id) => this.colorFor(id, primary, secondary);
    const o = this.colors.outline;
    const s = this.colors.skin;
    return `
<svg viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="100" cy="36" rx="22" ry="26" fill="${s}" stroke="${o}" stroke-width="2"/>
  <path d="M78 62 C70 78 62 100 58 120 L78 128 L100 118 L122 128 L142 120 C138 100 130 78 122 62 Z" fill="${s}" stroke="${o}" stroke-width="2"/>
  <path d="M82 70 C90 78 110 78 118 70 L114 100 L100 108 L86 100 Z" fill="${c("traps")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M72 78 C58 95 46 118 42 140 L60 146 C64 118 74 96 84 86 Z" fill="${c("rear_delts")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M128 78 C142 95 154 118 158 140 L140 146 C136 118 126 96 116 86 Z" fill="${c("rear_delts")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M78 95 C70 120 66 150 70 176 L100 168 L100 108 Z" fill="${c("lats")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M122 95 C130 120 134 150 130 176 L100 168 L100 108 Z" fill="${c("lats")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M86 168 L114 168 L112 200 L88 200 Z" fill="${c("abs")}" stroke="${o}" stroke-width="1" opacity="0.5"/>
  <path d="M42 142 L28 198 L42 204 L58 148 Z" fill="${c("triceps")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M158 142 L172 198 L158 204 L142 148 Z" fill="${c("triceps")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M28 200 L20 255 L34 258 L42 206 Z" fill="${c("forearms")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M172 200 L180 255 L166 258 L158 206 Z" fill="${c("forearms")}" stroke="${o}" stroke-width="1.5"/>
  <path d="M42 148 L34 160 L28 198 L42 204 L52 160 Z" fill="${c("biceps")}" opacity="0.35"/>
  <path d="M158 148 L166 160 L172 198 L158 204 L148 160 Z" fill="${c("biceps")}" opacity="0.35"/>
  <path d="M86 176 L70 260 L90 262 L100 182 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
  <path d="M114 176 L130 260 L110 262 L100 182 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
  <path d="M70 260 L62 330 L86 332 L90 264 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
  <path d="M130 260 L138 330 L114 332 L110 264 Z" fill="${s}" stroke="${o}" stroke-width="1.5"/>
</svg>`;
  },

  /** Simple pose glyph for exercise cards */
  poseGlyph(pose) {
    const stroke = "#e10600";
    const fill = "#1a1a1a";
    const common = `viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"`;
    if (pose === "hang") {
      return `<svg ${common}><line x1="20" y1="12" x2="60" y2="12" stroke="${stroke}" stroke-width="3"/><circle cx="40" cy="28" r="6" fill="${fill}" stroke="${stroke}"/><line x1="40" y1="34" x2="40" y2="52" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="40" x2="28" y2="48" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="40" x2="52" y2="48" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="52" x2="32" y2="68" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="52" x2="48" y2="68" stroke="${stroke}" stroke-width="3"/></svg>`;
    }
    if (pose === "dip") {
      return `<svg ${common}><line x1="18" y1="30" x2="18" y2="55" stroke="${stroke}" stroke-width="3"/><line x1="62" y1="30" x2="62" y2="55" stroke="${stroke}" stroke-width="3"/><circle cx="40" cy="22" r="5" fill="${fill}" stroke="${stroke}"/><line x1="40" y1="27" x2="40" y2="42" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="32" x2="22" y2="36" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="32" x2="58" y2="36" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="42" x2="34" y2="60" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="42" x2="46" y2="60" stroke="${stroke}" stroke-width="3"/></svg>`;
    }
    if (pose === "push" || pose === "pike") {
      return `<svg ${common}><circle cx="58" cy="28" r="5" fill="${fill}" stroke="${stroke}"/><line x1="20" y1="55" x2="52" y2="32" stroke="${stroke}" stroke-width="3"/><line x1="52" y1="32" x2="64" y2="48" stroke="${stroke}" stroke-width="3"/><line x1="34" y1="46" x2="28" y2="58" stroke="${stroke}" stroke-width="3"/><line x1="46" y1="38" x2="40" y2="58" stroke="${stroke}" stroke-width="3"/></svg>`;
    }
    if (pose === "row") {
      return `<svg ${common}><line x1="15" y1="40" x2="65" y2="40" stroke="${stroke}" stroke-width="3"/><circle cx="40" cy="28" r="5" fill="${fill}" stroke="${stroke}"/><line x1="40" y1="33" x2="40" y2="40" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="40" x2="28" y2="55" stroke="${stroke}" stroke-width="3"/><line x1="40" y1="40" x2="52" y2="55" stroke="${stroke}" stroke-width="3"/></svg>`;
    }
    return `<svg ${common}><circle cx="40" cy="40" r="18" fill="${fill}" stroke="${stroke}" stroke-width="3"/></svg>`;
  },
};
