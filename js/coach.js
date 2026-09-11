/**
 * Rule-based coach: турник + брусья + блины + пресс.
 */
window.Coach = {
  goals: {
    strength: "Сила (турник / брусья / блины)",
    hypertrophy: "Объём и мышцы",
    skill: "Техника и база",
  },

  defaultProfile() {
    return {
      name: "",
      bodyweight: 75,
      pullupMax: 8,
      weightedMax: 0,
      daysPerWeek: 3,
      goal: "strength",
      hasBelt: true,
      hasDips: true,
      hasPlates: true,
      onboarded: false,
      createdAt: null,
    };
  },

  startPullWeight(profile) {
    const bwReps = Number(profile.pullupMax) || 0;
    const known = Number(profile.weightedMax) || 0;
    if (known > 0) return Math.max(0, Math.round((known * 0.7) / 2.5) * 2.5);
    if (bwReps >= 12) return 10;
    if (bwReps >= 8) return 5;
    if (bwReps >= 5) return 0;
    return 0;
  },

  startDipWeight(profile) {
    return Math.max(0, this.startPullWeight(profile));
  },

  /** Starting plate load for accessory work */
  startPlateWeight(profile) {
    const bw = Number(profile.bodyweight) || 75;
    if (bw >= 90) return 15;
    if (bw >= 75) return 10;
    return 5;
  },

  buildProgram(profile, loads) {
    const days = Number(profile.daysPerWeek) || 3;
    const pullW = loads?.weighted_pullup?.weight ?? this.startPullWeight(profile);
    const dipW = loads?.weighted_dip?.weight ?? loads?.dip?.weight ?? this.startDipWeight(profile);
    const plateW = loads?.plate_press?.weight ?? this.startPlateWeight(profile);
    const useWeighted = (profile.pullupMax >= 5 || profile.weightedMax > 0) && profile.hasBelt;
    const plates = profile.hasPlates !== false;
    const dips = profile.hasDips !== false;

    const mainPull = useWeighted
      ? { exerciseId: "weighted_pullup", sets: 4, reps: [4, 6], weight: pullW, note: "Сила тяги" }
      : profile.pullupMax >= 3
        ? { exerciseId: "pullup", sets: 4, reps: [5, 8], weight: 0, note: "Строгие подтягивания" }
        : { exerciseId: "australian_row", sets: 4, reps: [8, 12], weight: 0, note: "Горизонтальная тяга" };

    const mainDip = dips
      ? useWeighted && profile.hasBelt
        ? { exerciseId: "weighted_dip", sets: 3, reps: [5, 8], weight: dipW, note: "Сила на брусьях" }
        : { exerciseId: "dip", sets: 3, reps: [6, 10], weight: 0, note: "Брусья" }
      : { exerciseId: "diamond_pushup", sets: 3, reps: [8, 12], weight: 0, note: "Трицепс / грудь" };

    const lightDip = dips
      ? { exerciseId: "dip", sets: 3, reps: [8, 12], weight: 0, note: "Брусья — объём" }
      : { exerciseId: "pushup", sets: 3, reps: [12, 20], weight: 0, note: "Отжимания объём" };

    const platePress = plates
      ? { exerciseId: "plate_press", sets: 3, reps: [8, 12], weight: plateW, note: "Плечи с блином" }
      : { exerciseId: "pike_pushup", sets: 3, reps: [6, 10], weight: 0, note: "Плечи" };

    const plateRaise = plates
      ? { exerciseId: "plate_raise", sets: 3, reps: [10, 15], weight: Math.max(5, plateW - 5), note: "Передние дельты" }
      : { exerciseId: "pike_pushup", sets: 3, reps: [8, 12], weight: 0, note: "Плечи" };

    const plateSquat = plates
      ? { exerciseId: "plate_squat", sets: 3, reps: [10, 15], weight: plateW, note: "Ноги с блином" }
      : { exerciseId: "plank", sets: 3, reps: [30, 45], weight: 0, note: "Корпус", timed: true };

    const plateTwist = plates
      ? { exerciseId: "plate_twist", sets: 3, reps: [16, 24], weight: Math.max(5, plateW - 5), note: "Пресс ротация" }
      : { exerciseId: "crunch", sets: 3, reps: [12, 20], weight: 0, note: "Пресс" };

    const plateRow = plates
      ? { exerciseId: "plate_row", sets: 3, reps: [10, 15], weight: plateW, note: "Тяга блина" }
      : { exerciseId: "australian_row", sets: 3, reps: [10, 15], weight: 0, note: "Горизонтальная тяга" };

    const templates = {
      2: [
        {
          id: "a",
          name: "День A · Тяга + брусья + пресс",
          focus: "pull",
          items: [
            mainPull,
            lightDip,
            plateRow,
            { exerciseId: "hanging_knee", sets: 3, reps: [10, 15], weight: 0, note: "Пресс в висе" },
            { exerciseId: "plank", sets: 3, reps: [30, 45], weight: 0, note: "Планка, сек", timed: true },
          ],
        },
        {
          id: "b",
          name: "День B · Жим + блины + пресс",
          focus: "push",
          items: [
            mainDip,
            { exerciseId: "pushup", sets: 3, reps: [10, 15], weight: 0, note: "Отжимания" },
            platePress,
            plateSquat,
            plateTwist,
            { exerciseId: "hollow_hold", sets: 3, reps: [20, 35], weight: 0, note: "Hollow, сек", timed: true },
          ],
        },
      ],
      3: [
        {
          id: "a",
          name: "День A · Турник + тяга",
          focus: "pull",
          items: [
            mainPull,
            { exerciseId: "chinup", sets: 3, reps: [5, 8], weight: 0, note: "Обратный хват" },
            plateRow,
            { exerciseId: "scap_pull", sets: 3, reps: [8, 10], weight: 0, note: "Лопатки" },
            { exerciseId: "hanging_knee", sets: 3, reps: [10, 15], weight: 0, note: "Пресс" },
          ],
        },
        {
          id: "b",
          name: "День B · Брусья + жим",
          focus: "push",
          items: [
            mainDip,
            { exerciseId: "diamond_pushup", sets: 3, reps: [8, 12], weight: 0, note: "Трицепс" },
            platePress,
            plateRaise,
            { exerciseId: "plank", sets: 3, reps: [35, 50], weight: 0, note: "Планка, сек", timed: true },
          ],
        },
        {
          id: "c",
          name: "День C · Блины + пресс + ноги",
          focus: "core",
          items: [
            plateSquat,
            lightDip,
            { exerciseId: "hanging_leg", sets: 3, reps: [6, 10], weight: 0, note: "Пресс сложнее" },
            plateTwist,
            { exerciseId: "crunch", sets: 3, reps: [15, 20], weight: 0, note: "Скручивания" },
            { exerciseId: "hollow_hold", sets: 3, reps: [20, 40], weight: 0, note: "Hollow, сек", timed: true },
          ],
        },
      ],
      4: null,
    };

    templates[4] = [
      templates[3][0],
      templates[3][1],
      templates[3][2],
      {
        id: "d",
        name: "День D · Сила микс",
        focus: "mix",
        items: [
          mainPull,
          mainDip,
          platePress,
          plateSquat,
          { exerciseId: "hanging_leg", sets: 3, reps: [6, 10], weight: 0, note: "Пресс" },
          { exerciseId: "dead_hang", sets: 2, reps: [25, 45], weight: 0, note: "Хват, сек", timed: true },
        ],
      },
    ];

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
    if (plates) parts.push(`блины от ${plateW} кг`);
    parts.push("пресс");
    if (profile.goal === "hypertrophy") {
      return `Разнообразие: ${parts.join(", ")}. Держи полный ход и контроль — объём важнее эго.`;
    }
    if (profile.goal === "skill") {
      return `Фокус на технике: ${parts.join(", ")}. Лучше идеальная форма, чем лишний вес.`;
    }
    return `Программа на неделю: ${parts.join(" · ")}. Добавляй нагрузку только при чистых повторах.`;
  },

  nextLoad(prescription, performed) {
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
    const step = prescription.weight >= 20 ? 2.5 : prescription.weight > 0 ? 2.5 : 0;

    if (ugly || failed) {
      const down = Math.max(0, Math.round((prescription.weight - (step || 2.5)) * 2) / 2);
      return {
        weight: down,
        reps: prescription.reps,
        message: "Техника или объём просели. На следующей сессии чуть снижаем нагрузку.",
        action: "deload",
      };
    }

    if (ok.length >= targetSets && performed.length >= targetSets) {
      const up = Math.round((prescription.weight + (step || 2.5)) * 2) / 2;
      return {
        weight: up,
        reps: prescription.reps,
        message: `Все ${targetSets} подхода на ${rmax}+ — можно добавить нагрузку (+${step || 2.5} кг, если есть вес).`,
        action: "increase",
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
