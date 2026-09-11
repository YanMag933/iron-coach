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
    weighted_dip: "assets/exercises/weighted_dip-form.png",
    pushup: "assets/exercises/pushup-form.png",
    diamond_pushup: "assets/exercises/diamond_pushup-form.png",
    pike_pushup: "assets/exercises/pike_pushup-form.png",
    hanging_knee: "assets/exercises/hanging_knee-form.png",
    hanging_leg: "assets/exercises/hanging_leg-form.png",
    dead_hang: "assets/exercises/dead_hang-form.png",
    plate_press: "assets/exercises/plate_press-form.png",
    plate_raise: "assets/exercises/plate_raise-form.png",
    plate_squat: "assets/exercises/plate_squat-form.png",
    plate_twist: "assets/exercises/plate_twist-form.png",
    plate_row: "assets/exercises/plate_row-form.png",
    plank: "assets/exercises/plank-form.png",
    hollow_hold: "assets/exercises/hollow_hold-form.png",
    crunch: "assets/exercises/crunch-form.png",
  },
  muscles: {
    pullup: "assets/muscles/muscles-pull.png",
    weighted_pullup: "assets/muscles/weighted_pullup-muscles.png",
    chinup: "assets/muscles/muscles-chin.png",
    scap_pull: "assets/muscles/muscles-pull.png",
    australian_row: "assets/muscles/muscles-pull.png",
    plate_row: "assets/muscles/muscles-pull.png",
    dip: "assets/muscles/dip-muscles.png",
    weighted_dip: "assets/muscles/dip-muscles.png",
    pushup: "assets/muscles/muscles-push.png",
    diamond_pushup: "assets/muscles/muscles-push.png",
    pike_pushup: "assets/muscles/muscles-shoulders.png",
    plate_press: "assets/muscles/muscles-shoulders.png",
    plate_raise: "assets/muscles/muscles-shoulders.png",
    plate_squat: "assets/muscles/muscles-push.png",
    hanging_knee: "assets/muscles/muscles-core.png",
    hanging_leg: "assets/muscles/muscles-core.png",
    plate_twist: "assets/muscles/muscles-core.png",
    plank: "assets/muscles/muscles-core.png",
    hollow_hold: "assets/muscles/muscles-core.png",
    crunch: "assets/muscles/muscles-core.png",
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

  thumbHtml(exerciseId) {
    const src = this.formUrl(exerciseId);
    if (!src) return `<div class="ex-thumb placeholder"></div>`;
    return `<div class="ex-thumb"><img src="${src}" alt="" loading="lazy" decoding="async" /></div>`;
  },

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

  musclesOnlyHtml(exerciseId) {
    const muscles = this.musclesUrl(exerciseId);
    if (!muscles) return "";
    return `<div class="muscle-wrap"><img src="${muscles}" alt="Рабочие мышцы" loading="lazy" decoding="async" /></div>
      <div class="legend"><span><i class="dot primary"></i>Основные</span><span><i class="dot secondary"></i>Вспомогательные</span></div>`;
  },
};
