/**
 * Rule-based coach for weighted calisthenics / bar training.
 */
window.Coach = {
  goals: {
    strength: "Сила на турнике (weighted)",
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
      onboarded: false,
      createdAt: null,
    };
  },

  /** Estimate starting working weight for weighted pull-ups (kg on belt). */
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
    const pull = this.startPullWeight(profile);
    return Math.max(0, pull);
  },

  /**
   * Build a weekly template of sessions.
   * @param {ReturnType<typeof Coach.defaultProfile>} profile
   * @param {Record<string, { weight: number, repsTarget: [number, number], sets: number }>} loads
   */
  buildProgram(profile, loads) {
    const days = Number(profile.daysPerWeek) || 3;
    const pullW = loads?.weighted_pullup?.weight ?? this.startPullWeight(profile);
    const dipW = loads?.dip?.weight ?? this.startDipWeight(profile);
    const useWeighted = (profile.pullupMax >= 5 || profile.weightedMax > 0) && profile.hasBelt;

    const mainPull = useWeighted
      ? { exerciseId: "weighted_pullup", sets: 4, reps: [4, 6], weight: pullW, note: "Силовая работа" }
      : profile.pullupMax >= 3
        ? { exerciseId: "pullup", sets: 4, reps: [5, 8], weight: 0, note: "Строгие подтягивания" }
        : { exerciseId: "australian_row", sets: 4, reps: [8, 12], weight: 0, note: "Горизонтальная тяга до базы" };

    const pushMain = profile.hasDips
      ? { exerciseId: "dip", sets: 3, reps: [6, 10], weight: profile.hasBelt ? dipW : 0, note: "Жим на брусьях" }
      : { exerciseId: "pushup", sets: 3, reps: [10, 15], weight: 0, note: "Жимовая база" };

    const templates = {
      2: [
        {
          id: "a",
          name: "День A · Тяга + корпус",
          focus: "pull",
          items: [
            mainPull,
            { exerciseId: "scap_pull", sets: 3, reps: [8, 10], weight: 0, note: "Активация лопаток" },
            { exerciseId: "hanging_knee", sets: 3, reps: [8, 12], weight: 0, note: "Корпус" },
            { exerciseId: "dead_hang", sets: 2, reps: [20, 40], weight: 0, note: "Секунды виса", timed: true },
          ],
        },
        {
          id: "b",
          name: "День B · Жим + тяга",
          focus: "push",
          items: [
            pushMain,
            { exerciseId: "chinup", sets: 3, reps: [5, 8], weight: 0, note: "Бицепс + широчайшие" },
            { exerciseId: "pike_pushup", sets: 3, reps: [6, 10], weight: 0, note: "Плечи" },
            { exerciseId: "hanging_leg", sets: 3, reps: [5, 8], weight: 0, note: "Пресс сложнее" },
          ],
        },
      ],
      3: [
        {
          id: "a",
          name: "День A · Сила тяги",
          focus: "pull",
          items: [
            mainPull,
            { exerciseId: "australian_row", sets: 3, reps: [8, 12], weight: 0, note: "Горизонтальный объём" },
            { exerciseId: "scap_pull", sets: 3, reps: [8, 10], weight: 0, note: "Техника лопаток" },
            { exerciseId: "hanging_knee", sets: 3, reps: [10, 15], weight: 0, note: "Корпус" },
          ],
        },
        {
          id: "b",
          name: "День B · Жим",
          focus: "push",
          items: [
            pushMain,
            { exerciseId: "pushup", sets: 3, reps: [10, 15], weight: 0, note: "Объём груди/трицепса" },
            { exerciseId: "pike_pushup", sets: 3, reps: [6, 10], weight: 0, note: "Плечи" },
            { exerciseId: "dead_hang", sets: 3, reps: [20, 40], weight: 0, note: "Хват, сек", timed: true },
          ],
        },
        {
          id: "c",
          name: "День C · Объём + пресс",
          focus: "mix",
          items: [
            { exerciseId: "chinup", sets: 3, reps: [6, 10], weight: 0, note: "Обратный хват" },
            { exerciseId: "dip", sets: 3, reps: [6, 10], weight: profile.hasBelt ? Math.max(0, dipW - 5) : 0, note: "Лёгче, чем день B" },
            { exerciseId: "hanging_leg", sets: 3, reps: [6, 10], weight: 0, note: "Пресс" },
            { exerciseId: "australian_row", sets: 3, reps: [10, 15], weight: 0, note: "Спина объём" },
          ],
        },
      ],
      4: null,
    };

    templates[4] = [
      templates[3][0],
      templates[3][1],
      {
        id: "c",
        name: "День C · Техника",
        focus: "tech",
        items: [
          { exerciseId: "scap_pull", sets: 4, reps: [8, 12], weight: 0, note: "Качество" },
          { exerciseId: "australian_row", sets: 4, reps: [10, 15], weight: 0, note: "Объём тяги" },
          { exerciseId: "pushup", sets: 3, reps: [12, 20], weight: 0, note: "Лёгкий жим" },
          { exerciseId: "hanging_knee", sets: 3, reps: [12, 15], weight: 0, note: "Корпус" },
        ],
      },
      {
        id: "d",
        name: "День D · Сила / повтор A",
        focus: "pull",
        items: [
          mainPull,
          pushMain,
          { exerciseId: "hanging_leg", sets: 3, reps: [6, 10], weight: 0, note: "Пресс" },
          { exerciseId: "dead_hang", sets: 2, reps: [25, 45], weight: 0, note: "Хват", timed: true },
        ],
      },
    ];

    const key = days >= 4 ? 4 : days <= 2 ? 2 : 3;
    return {
      daysPerWeek: key,
      sessions: templates[key],
      tip: this.programTip(profile, useWeighted, pullW),
    };
  },

  programTip(profile, useWeighted, pullW) {
    if (!useWeighted) {
      return "Сейчас приоритет — строгие подтягивания без веса. Когда стабильно сделаешь 5–8 чистых повторов, добавим блины.";
    }
    if (profile.goal === "strength") {
      return `Силовой акцент: рабочие подтягивания около ${pullW} кг. Добавляй вес только когда все подходы попали в верх диапазона с хорошей техникой.`;
    }
    if (profile.goal === "hypertrophy") {
      return "Больше контролируемых негативов и чуть выше повторы. Вес растет медленнее — важнее полный ход и жжение в широчайших.";
    }
    return "Держи идеальную амплитуду. Лучше меньше вес и идеальная форма, чем цифра ценой рывков.";
  },

  /**
   * Double progression suggestion after a logged exercise.
   * @param {{ sets: number, reps: [number, number], weight: number }} prescription
   * @param {{ weight: number, reps: number, rir: number }[]} performed
   */
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

    if (ugly || failed) {
      const down = Math.max(0, Math.round((prescription.weight - 2.5) * 2) / 2);
      return {
        weight: down,
        reps: prescription.reps,
        message: "Техника или объём просели. На следующей сессии чуть снижаем вес и возвращаем чистые повторы.",
        action: "deload",
      };
    }

    if (ok.length >= targetSets && performed.length >= targetSets) {
      const up = Math.round((prescription.weight + 2.5) * 2) / 2;
      return {
        weight: up,
        reps: prescription.reps,
        message: `Все ${targetSets} подхода на ${rmax}+ — зарабатываешь +2.5 кг. Не прыгай больше, пока новый вес не станет снова «лёгким» в диапазоне.`,
        action: "increase",
      };
    }

    return {
      weight: prescription.weight,
      reps: prescription.reps,
      message: `Держим ${prescription.weight} кг. Цель — добить все подходы до ${rmax} чистых повторов, затем добавлять вес.`,
      action: "hold",
    };
  },

  tipForExercise(exercise, prescription) {
    const w = prescription?.weight || 0;
    const [a, b] = prescription?.reps || [0, 0];
    if (exercise.id === "weighted_pullup") {
      return `Работай в диапазоне ${a}–${b}. Вес на поясе: ${w} кг. Если повтор «ломается» — подход закончен, не добивай читерством.`;
    }
    if (exercise.timed) {
      return "Здесь счёт в секундах. Дыши ровно, плечи упакованы.";
    }
    return exercise.standard;
  },

  safetyNote() {
    return "При острой боли в плече, локте или пояснице — стоп. Это коуч по нагрузке и технике, а не замена врачу.";
  },
};
