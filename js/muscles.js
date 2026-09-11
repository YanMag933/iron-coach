/**
 * Visual assets: realistic exercise photos + muscle highlight maps.
 */
window.ExerciseMedia = {
  form: {
    pullup: "assets/exercises/pullup-form.png",
    weighted_pullup: "assets/exercises/weighted_pullup-form.png",
    chinup: "assets/exercises/chinup-form.png",
    scap_pull: "assets/exercises/scap_pull-form.png",
    australian_row: "assets/exercises/australian_row-form.png",
    dip: "assets/exercises/dip-form.png",
    pushup: "assets/exercises/pushup-form.png",
    pike_pushup: "assets/exercises/pike_pushup-form.png",
    hanging_knee: "assets/exercises/hanging_knee-form.png",
    hanging_leg: "assets/exercises/hanging_leg-form.png",
    dead_hang: "assets/exercises/dead_hang-form.png",
  },
  muscles: {
    pullup: "assets/muscles/muscles-pull.png",
    weighted_pullup: "assets/muscles/weighted_pullup-muscles.png",
    chinup: "assets/muscles/muscles-chin.png",
    scap_pull: "assets/muscles/muscles-pull.png",
    australian_row: "assets/muscles/muscles-pull.png",
    dip: "assets/muscles/dip-muscles.png",
    pushup: "assets/muscles/muscles-push.png",
    pike_pushup: "assets/muscles/muscles-shoulders.png",
    hanging_knee: "assets/muscles/muscles-core.png",
    hanging_leg: "assets/muscles/muscles-core.png",
    dead_hang: "assets/muscles/muscles-grip.png",
  },
};

window.MuscleMap = {
  formUrl(exerciseId) {
    return window.ExerciseMedia.form[exerciseId] || null;
  },
  musclesUrl(exerciseId) {
    return window.ExerciseMedia.muscles[exerciseId] || null;
  },

  /** Thumb for exercise cards */
  thumbHtml(exerciseId) {
    const src = this.formUrl(exerciseId);
    if (!src) return `<div class="ex-thumb placeholder"></div>`;
    return `<div class="ex-thumb"><img src="${src}" alt="" loading="lazy" decoding="async" /></div>`;
  },

  /** Technique block: form photo + muscle map */
  detailHtml(exerciseId, primaryLabels, secondaryLabels) {
    const form = this.formUrl(exerciseId);
    const muscles = this.musclesUrl(exerciseId);
    return `
      <div class="media-grid">
        <figure class="media-card">
          ${form ? `<img src="${form}" alt="Техника упражнения" loading="eager" decoding="async" />` : ""}
          <figcaption>Техника</figcaption>
        </figure>
        <figure class="media-card">
          ${muscles ? `<img src="${muscles}" alt="Рабочие мышцы" loading="eager" decoding="async" />` : ""}
          <figcaption>Рабочие мышцы</figcaption>
        </figure>
      </div>
      <div class="legend">
        <span><i class="dot primary"></i>Основные: ${primaryLabels}</span>
        <span><i class="dot secondary"></i>Вспомогательные: ${secondaryLabels}</span>
      </div>`;
  },

  /** Compact muscle image for workout screen */
  musclesOnlyHtml(exerciseId) {
    const muscles = this.musclesUrl(exerciseId);
    if (!muscles) return "";
    return `<div class="muscle-wrap"><img src="${muscles}" alt="Рабочие мышцы" loading="lazy" decoding="async" /></div>
      <div class="legend"><span><i class="dot primary"></i>Основные</span><span><i class="dot secondary"></i>Вспомогательные</span></div>`;
  },
};
