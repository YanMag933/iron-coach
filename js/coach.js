/**
 * Rule-based coach: турник + брусья + блины + пресс.
 */
window.Coach = {
  goals: {
    strength: "Сила (турник / брусья / блины)",
    hypertrophy: "Объём и мышцы",
    skill: "Техника и база",
  },

  experienceLabels: {
    beginner: "Новичок (до 6 мес.)",
    intermediate: "Средний (6–24 мес.)",
    advanced: "Опытный (2+ года)",
  },

  focusLabels: {
    balanced: "Всё равномерно",
    pull: "Больше тяги / спина",
    push: "Больше жима / грудь-плечи",
    core: "Пресс и корпус",
    legs: "Ноги",
  },

  plateOptions: [5, 10, 15, 20, 25, 30],

  defaultProfile() {
    return {
      name: "",
      bodyweight: 75,
      pullupMax: 8,
      dipMax: 10,
      weightedMax: 0,
      daysPerWeek: 3,
      sessionMinutes: 45,
      goal: "strength",
      experience: "intermediate",
      focus: "balanced",
      injuries: [],
      hasBelt: true,
      hasDips: true,
      hasPlates: true,
      availablePlates: [15, 20, 25],
      onboarded: false,
      createdAt: null,
    };
  },

  parsePlates(list) {
    const nums = (Array.isArray(list) ? list : [])
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    return [...new Set(nums)];
  },

  /** Snap to nearest available plate; if none listed — 2.5 kg steps */
  snapWeight(weight, profile) {
    let w = Math.max(0, Number(weight) || 0);
    if (!profile?.hasPlates) return 0;
    const plates = this.parsePlates(profile.availablePlates);
    if (!plates.length) return Math.round(w / 2.5) * 2.5;
    if (w <= 0) return plates[0];
    let best = plates[0];
    let bestDist = Math.abs(plates[0] - w);
    for (const p of plates) {
      const d = Math.abs(p - w);
      if (d < bestDist || (d === bestDist && p >= w)) {
        best = p;
        bestDist = d;
      }
    }
    return best;
  },

  nextPlate(weight, profile, dir) {
    const plates = this.parsePlates(profile?.availablePlates);
    const cur = Number(weight) || 0;
    if (!plates.length) {
      const step = 2.5 * (dir >= 0 ? 1 : -1);
      return Math.max(0, Math.round((cur + step) * 2) / 2);
    }
    if (dir >= 0) {
      const up = plates.find((p) => p > cur + 0.01);
      return up ?? plates[plates.length - 1];
    }
    const downs = plates.filter((p) => p < cur - 0.01);
    return downs.length ? downs[downs.length - 1] : plates[0];
  },

  startPullWeight(profile) {
    const bwReps = Number(profile.pullupMax) || 0;
    const known = Number(profile.weightedMax) || 0;
    let raw = 0;
    if (known > 0) raw = known * 0.7;
    else if (bwReps >= 12) raw = 10;
    else if (bwReps >= 8) raw = 5;
    else raw = 0;
    if (raw <= 0) return 0;
    return this.snapWeight(raw, profile);
  },

  startDipWeight(profile) {
    return this.startPullWeight(profile);
  },

  startPlateWeight(profile) {
    const plates = this.parsePlates(profile.availablePlates);
    if (plates.length) return plates[0];
    const bw = Number(profile.bodyweight) || 75;
    if (bw >= 90) return 15;
    if (bw >= 75) return 10;
    return 5;
  },

  uniqItems(items) {
    const seen = new Set();
    return items.filter((it) => {
      if (!it?.exerciseId || seen.has(it.exerciseId)) return false;
      seen.add(it.exerciseId);
      return true;
    });
  },

  avoidExercise(profile, exerciseId) {
    const inj = new Set(profile.injuries || []);
    if (inj.has("shoulder") && ["pike_pushup", "plate_press", "plate_raise", "weighted_dip", "dip"].includes(exerciseId)) {
      return true;
    }
    if (inj.has("elbow") && ["weighted_pullup", "weighted_dip", "diamond_pushup"].includes(exerciseId)) {
      return true;
    }
    if (inj.has("lower_back") && ["plate_row", "plate_squat", "plate_twist"].includes(exerciseId)) {
      return true;
    }
    if (inj.has("knee") && exerciseId === "plate_squat") return true;
    return false;
  },

  swapSafe(profile, item, fallbackId) {
    if (!this.avoidExercise(profile, item.exerciseId)) return item;
    return { ...item, exerciseId: fallbackId, weight: 0, note: item.note + " (щадящий вариант)" };
  },

  volumeFor(profile) {
    const exp = profile.experience || "intermediate";
    const mins = Number(profile.sessionMinutes) || 45;
    let setsMain = exp === "beginner" ? 3 : exp === "advanced" ? 4 : 3;
    let setsAcc = exp === "beginner" ? 2 : 3;
    if (mins <= 30) {
      setsMain = Math.min(setsMain, 3);
      setsAcc = 2;
    }
    if (mins >= 60 && exp !== "beginner") {
      setsMain = Math.max(setsMain, 4);
      setsAcc = 3;
    }
    return { setsMain, setsAcc, short: mins <= 30 };
  },

  buildProgram(profile, loads) {
    const days = Number(profile.daysPerWeek) || 3;
    const vol = this.volumeFor(profile);
    const pullW = this.snapWeight(
      loads?.weighted_pullup?.weight ?? this.startPullWeight(profile),
      profile
    );
    const dipW = this.snapWeight(
      loads?.weighted_dip?.weight ?? loads?.dip?.weight ?? this.startDipWeight(profile),
      profile
    );
    const plateW = this.snapWeight(
      loads?.plate_press?.weight ?? this.startPlateWeight(profile),
      profile
    );
    const lightPlate = this.snapWeight(
      loads?.plate_raise?.weight ?? Math.max(plateW, this.startPlateWeight(profile)),
      profile
    );

    const useWeighted =
      (profile.pullupMax >= 5 || profile.weightedMax > 0) &&
      profile.hasBelt &&
      profile.hasPlates !== false;
    const plates = profile.hasPlates !== false;
    const dips = profile.hasDips !== false;
    const focus = profile.focus || "balanced";

    let mainPull = useWeighted
      ? { exerciseId: "weighted_pullup", sets: vol.setsMain, reps: [4, 6], weight: pullW, note: "Сила тяги" }
      : profile.pullupMax >= 3
        ? { exerciseId: "pullup", sets: vol.setsMain, reps: [5, 8], weight: 0, note: "Строгие подтягивания" }
        : { exerciseId: "australian_row", sets: vol.setsMain, reps: [8, 12], weight: 0, note: "Горизонтальная тяга" };
    mainPull = this.swapSafe(profile, mainPull, "australian_row");

    let mainDip = dips
      ? useWeighted && profile.hasBelt
        ? { exerciseId: "weighted_dip", sets: vol.setsMain, reps: [5, 8], weight: dipW, note: "Сила на брусьях" }
        : { exerciseId: "dip", sets: vol.setsMain, reps: [6, 10], weight: 0, note: "Брусья" }
      : { exerciseId: "pushup", sets: vol.setsMain, reps: [10, 15], weight: 0, note: "Отжимания" };
    mainDip = this.swapSafe(profile, mainDip, "pushup");

    let lightDip = dips
      ? { exerciseId: "dip", sets: vol.setsAcc, reps: [8, 12], weight: 0, note: "Брусья — объём" }
      : { exerciseId: "pushup", sets: vol.setsAcc, reps: [12, 20], weight: 0, note: "Отжимания объём" };
    if (lightDip.exerciseId === mainDip.exerciseId) {
      lightDip = { exerciseId: "diamond_pushup", sets: vol.setsAcc, reps: [8, 12], weight: 0, note: "Трицепс" };
    }
    lightDip = this.swapSafe(profile, lightDip, "pushup");

    let platePress = plates
      ? { exerciseId: "plate_press", sets: vol.setsAcc, reps: [8, 12], weight: plateW, note: "Плечи с блином" }
      : { exerciseId: "pike_pushup", sets: vol.setsAcc, reps: [6, 10], weight: 0, note: "Плечи" };
    platePress = this.swapSafe(profile, platePress, "pushup");

    let plateRaise = plates
      ? { exerciseId: "plate_raise", sets: vol.setsAcc, reps: [10, 15], weight: lightPlate, note: "Передние дельты" }
      : { exerciseId: "pushup", sets: vol.setsAcc, reps: [10, 15], weight: 0, note: "Отжимания" };
    plateRaise = this.swapSafe(profile, plateRaise, "plank");

    let plateSquat = plates
      ? { exerciseId: "plate_squat", sets: vol.setsAcc, reps: [10, 15], weight: plateW, note: "Ноги с блином" }
      : { exerciseId: "dead_hang", sets: 2, reps: [20, 40], weight: 0, note: "Хват, сек", timed: true };
    plateSquat = this.swapSafe(profile, plateSquat, "plank");

    let plateTwist = plates
      ? { exerciseId: "plate_twist", sets: vol.setsAcc, reps: [16, 24], weight: lightPlate, note: "Пресс ротация" }
      : { exerciseId: "hanging_knee", sets: vol.setsAcc, reps: [10, 15], weight: 0, note: "Пресс в висе" };
    plateTwist = this.swapSafe(profile, plateTwist, "crunch");

    let plateRow = plates
      ? { exerciseId: "plate_row", sets: vol.setsAcc, reps: [10, 15], weight: plateW, note: "Тяга блина" }
      : { exerciseId: "australian_row", sets: vol.setsAcc, reps: [10, 15], weight: 0, note: "Горизонтальная тяга" };
    plateRow = this.swapSafe(profile, plateRow, "scap_pull");

    let tricepAcc =
      mainDip.exerciseId === "diamond_pushup"
        ? { exerciseId: "pushup", sets: vol.setsAcc, reps: [10, 15], weight: 0, note: "Отжимания" }
        : { exerciseId: "diamond_pushup", sets: vol.setsAcc, reps: [8, 12], weight: 0, note: "Трицепс" };
    tricepAcc = this.swapSafe(profile, tricepAcc, "pushup");

    const chin = { exerciseId: "chinup", sets: vol.setsAcc, reps: [5, 8], weight: 0, note: "Обратный хват" };
    const scap = { exerciseId: "scap_pull", sets: vol.setsAcc, reps: [8, 10], weight: 0, note: "Лопатки" };
    const hangKnee = { exerciseId: "hanging_knee", sets: vol.setsAcc, reps: [10, 15], weight: 0, note: "Пресс" };
    const hangLeg = { exerciseId: "hanging_leg", sets: vol.setsAcc, reps: [6, 10], weight: 0, note: "Пресс сложнее" };
    const crunch = { exerciseId: "crunch", sets: vol.setsAcc, reps: [12, 20], weight: 0, note: "Скручивания" };
    const plank = { exerciseId: "plank", sets: 3, reps: [30, 50], weight: 0, note: "Планка, сек", timed: true };
    const hollow = { exerciseId: "hollow_hold", sets: 3, reps: [20, 40], weight: 0, note: "Hollow, сек", timed: true };
    const hang = { exerciseId: "dead_hang", sets: 2, reps: [25, 45], weight: 0, note: "Хват, сек", timed: true };

    const dayA = this.uniqItems([
      mainPull,
      focus === "push" ? mainDip : chin,
      plateRow,
      scap,
      focus === "core" ? hangLeg : hangKnee,
      ...(vol.short ? [] : [plank]),
    ]);

    const dayB = this.uniqItems([
      mainDip,
      tricepAcc,
      platePress,
      focus === "legs" ? plateSquat : plateRaise,
      ...(vol.short ? [plank] : [plank, hollow]),
    ].filter(Boolean));

    const dayC = this.uniqItems([
      focus === "pull" ? mainPull : plateSquat,
      lightDip,
      hangLeg,
      plateTwist,
      crunch,
      hollow,
    ]);

    const dayD = this.uniqItems([mainPull, mainDip, platePress, plateSquat, hangLeg, hang]);

    // Focus inserts: put priority move first if missing
    const boost = (items, ex) => {
      if (items.some((i) => i.exerciseId === ex.exerciseId)) return items;
      return this.uniqItems([ex, ...items]);
    };
    let a = dayA;
    let b = dayB;
    let c = dayC;
    if (focus === "core") {
      a = boost(a, hangLeg);
      c = boost(c, hollow);
    }
    if (focus === "legs") {
      c = boost(c, plateSquat);
      b = boost(b, plateSquat);
    }

    const templates = {
      2: [
        { id: "a", name: "День A · Тяга + брусья + пресс", focus: "pull", items: this.uniqItems([mainPull, lightDip, plateRow, hangKnee, plank]) },
        { id: "b", name: "День B · Жим + блины + пресс", focus: "push", items: this.uniqItems([mainDip, platePress, plateSquat, plateTwist, hollow]) },
      ],
      3: [
        { id: "a", name: "День A · Турник + тяга", focus: "pull", items: a },
        { id: "b", name: "День B · Брусья + жим", focus: "push", items: b },
        { id: "c", name: "День C · Блины + пресс + ноги", focus: "core", items: c },
      ],
      4: [
        { id: "a", name: "День A · Турник + тяга", focus: "pull", items: a },
        { id: "b", name: "День B · Брусья + жим", focus: "push", items: b },
        { id: "c", name: "День C · Блины + пресс + ноги", focus: "core", items: c },
        { id: "d", name: "День D · Сила микс", focus: "mix", items: dayD },
      ],
    };

    const key = days >= 4 ? 4 : days <= 2 ? 2 : 3;
    return {
      daysPerWeek: key,
      sessions: templates[key],
      tip: this.programTip(profile, useWeighted, pullW, plateW, dips, plates),
    };
  },

  programTip(profile, useWeighted, pullW, plateW, dips, plates) {
    const parts = [];
    if (useWeighted) parts.push(`тяга ~${pullW} кг`);
    if (dips) parts.push("брусья");
    if (plates) {
      const list = this.parsePlates(profile.availablePlates);
      parts.push(list.length ? `блины ${list.join("/")} кг` : `блины от ${plateW} кг`);
    }
    if (profile.focus && profile.focus !== "balanced") {
      parts.push(`акцент: ${this.focusLabels[profile.focus] || profile.focus}`);
    }
    parts.push("пресс");
    if (profile.goal === "hypertrophy") {
      return `Индивидуально: ${parts.join(", ")}. Контроль амплитуды важнее веса.`;
    }
    if (profile.goal === "skill") {
      return `Техника: ${parts.join(", ")}. Идеальная форма важнее лишнего кг.`;
    }
    return `Твоя программа: ${parts.join(" · ")}. Веса только из доступных блинов.`;
  },

  nextLoad(prescription, performed, profile) {
    const [rmin, rmax] = prescription.reps;
    const targetSets = prescription.sets;
    if (!performed.length) {
      return {
        weight: prescription.weight,
        reps: prescription.reps,
        message: "Нет данных подхода — оставляем ту же нагрузку.",
        action: "hold",
      };
    }

    const ok = performed.filter((s) => s.reps >= rmax && (s.rir ?? 2) >= 1);
    const failed = performed.some((s) => s.reps < rmin);
    const ugly = performed.some((s) => (s.rir ?? 2) < 0);
    const usesPlates = (prescription.weight || 0) > 0 && profile?.hasPlates !== false;

    if (ugly || failed) {
      const down = usesPlates
        ? this.nextPlate(prescription.weight, profile, -1)
        : Math.max(0, Math.round((prescription.weight - 2.5) * 2) / 2);
      return {
        weight: down,
        reps: prescription.reps,
        message: "Техника или объём просели. На следующей сессии чуть снижаем нагрузку.",
        action: "deload",
      };
    }

    if (ok.length >= targetSets && performed.length >= targetSets) {
      const up = usesPlates
        ? this.nextPlate(prescription.weight, profile, 1)
        : Math.round((prescription.weight + 2.5) * 2) / 2;
      const msg =
        usesPlates && up === prescription.weight
          ? `Все подходы на ${rmax}+. Следующего блина нет — держим ${up} кг и добавляй повторы.`
          : `Все ${targetSets} подхода на ${rmax}+ — можно ${up} кг.`;
      return {
        weight: up,
        reps: prescription.reps,
        message: msg,
        action: up > prescription.weight ? "increase" : "hold",
      };
    }

    return {
      weight: prescription.weight,
      reps: prescription.reps,
      message: `Держим текущую нагрузку. Цель — все подходы до ${rmax} чистых повторов.`,
      action: "hold",
    };
  },

  tipForExercise(exercise, prescription) {
    const w = prescription?.weight || 0;
    const [a, b] = prescription?.reps || [0, 0];
    if (exercise.id === "weighted_pullup" || exercise.id === "weighted_dip") {
      return `Диапазон ${a}–${b}. Вес: ${w} кг. Без читерства амплитуды.`;
    }
    if ((exercise.equipment || []).includes("блины") && w > 0) {
      return `Блин ${w} кг, ${a}–${b} повт. Корпус стабилен, без рывков.`;
    }
    if (prescription?.timed || exercise.id === "plank" || exercise.id === "hollow_hold" || exercise.id === "dead_hang") {
      return "Счёт в секундах. Дыши ровно, не ломай форму ради времени.";
    }
    return exercise.standard;
  },

  safetyNote() {
    return "При острой боли в плече, локте, колене или пояснице — стоп. Это коуч по нагрузке и технике, а не замена врачу.";
  },
};
