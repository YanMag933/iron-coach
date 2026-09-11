window.Store = {
  KEY: "iron-coach-v1",

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.blank();
      return { ...this.blank(), ...JSON.parse(raw) };
    } catch {
      return this.blank();
    }
  },

  blank() {
    return {
      profile: window.Coach.defaultProfile(),
      loads: {},
      activeSessionId: "a",
      logs: [],
      lastCoachMessages: {},
    };
  },

  save(state) {
    localStorage.setItem(this.KEY, JSON.stringify(state));
  },

  reset() {
    localStorage.removeItem(this.KEY);
  },

  ensureLoads(state) {
    const program = window.Coach.buildProgram(state.profile, state.loads);
    const loads = { ...state.loads };
    for (const session of program.sessions) {
      for (const item of session.items) {
        if (!loads[item.exerciseId]) {
          loads[item.exerciseId] = {
            weight: item.weight,
            reps: item.reps,
            sets: item.sets,
          };
        }
      }
    }
    state.loads = loads;
    return state;
  },
};
