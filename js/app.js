(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $("#app");
  const shell = $("#shell");
  const nav = $("#bottom-nav");
  const topTitle = $("#top-title");
  const installBtn = $("#install-btn");

  let state = window.Store.load();
  let tab = "today";
  let view = "tab"; // tab | onboarding | exercise | workout
  let exerciseId = null;
  let workoutDraft = null;
  let deferredPrompt = null;

  function persist() {
    window.Store.save(state);
  }

  function program() {
    state = window.Store.ensureLoads(state);
    return window.Coach.buildProgram(state.profile, state.loads);
  }

  function activeSession() {
    const p = program();
    return p.sessions.find((s) => s.id === state.activeSessionId) || p.sessions[0];
  }

  function loadFor(item) {
    const saved = state.loads[item.exerciseId];
    return {
      sets: saved?.sets ?? item.sets,
      reps: saved?.reps ?? item.reps,
      weight: saved?.weight ?? item.weight,
      timed: !!item.timed,
      note: item.note,
    };
  }

  function escapeHtml(str) {
    return String(str)
      .split("&").join("&amp;")
      .split("<").join("&lt;")
      .split(">").join("&gt;")
      .split('"').join("&quot;");
  }

  function setNavVisible(on) {
    nav.hidden = !on;
  }

  function render() {
    if (!state.profile.onboarded || view === "onboarding") {
      setNavVisible(false);
      topTitle.textContent = "IRON COACH";
      app.innerHTML = renderOnboarding();
      bindOnboarding();
      return;
    }

    if (view === "exercise") {
      setNavVisible(false);
      renderExercise();
      return;
    }

    if (view === "workout") {
      setNavVisible(false);
      renderWorkout();
      return;
    }

    setNavVisible(true);
    nav.querySelectorAll(".nav-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });

    if (tab === "today") renderToday();
    else if (tab === "program") renderProgram();
    else if (tab === "log") renderLog();
    else renderProfile();
  }

  /* ---------- Onboarding ---------- */
  function renderOnboarding() {
    const p = state.profile;
    return `
    <section class="hero-block anim-in">
      <h2>Твой<br>личный<br><span style="color:var(--red)">тренер</span></h2>
      <p>Анкету заполни честно — от неё зависит программа, веса блинов и объём.</p>
    </section>
    <form id="onboard-form" class="stack anim-in">
      <div class="panel stack">
        <p class="eyebrow">О тебе</p>
        <label class="field">Имя
          <input name="name" required maxlength="40" value="${escapeHtml(p.name)}" placeholder="Как к тебе обращаться" />
        </label>
        <div class="grid-2">
          <label class="field">Вес тела, кг
            <input name="bodyweight" type="number" min="40" max="200" step="0.5" required value="${p.bodyweight}" />
          </label>
          <label class="field">Опыт
            <select name="experience">
              ${Object.entries(window.Coach.experienceLabels)
                .map(([k, v]) => `<option value="${k}" ${(p.experience || "intermediate") === k ? "selected" : ""}>${v}</option>`)
                .join("")}
            </select>
          </label>
        </div>
      </div>

      <div class="panel stack">
        <p class="eyebrow">Сила сейчас</p>
        <div class="grid-2">
          <label class="field">Макс. подтягивания
            <input name="pullupMax" type="number" min="0" max="50" step="1" required value="${p.pullupMax}" />
          </label>
          <label class="field">Макс. брусья (повт)
            <input name="dipMax" type="number" min="0" max="50" step="1" value="${p.dipMax ?? 10}" />
          </label>
        </div>
        <label class="field">Макс. вес на поясе, кг
          <input name="weightedMax" type="number" min="0" max="100" step="0.5" value="${p.weightedMax}" />
        </label>
      </div>

      <div class="panel stack">
        <p class="eyebrow">Как тренируешься</p>
        <div class="grid-2">
          <label class="field">Дней в неделю
            <select name="daysPerWeek">
              ${[2, 3, 4].map((d) => `<option value="${d}" ${Number(p.daysPerWeek) === d ? "selected" : ""}>${d}</option>`).join("")}
            </select>
          </label>
          <label class="field">Минут на тренировку
            <select name="sessionMinutes">
              ${[30, 45, 60].map((m) => `<option value="${m}" ${Number(p.sessionMinutes || 45) === m ? "selected" : ""}>${m}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="grid-2">
          <label class="field">Цель
            <select name="goal">
              ${Object.entries(window.Coach.goals)
                .map(([k, v]) => `<option value="${k}" ${p.goal === k ? "selected" : ""}>${v}</option>`)
                .join("")}
            </select>
          </label>
          <label class="field">Акцент
            <select name="focus">
              ${Object.entries(window.Coach.focusLabels)
                .map(([k, v]) => `<option value="${k}" ${(p.focus || "balanced") === k ? "selected" : ""}>${v}</option>`)
                .join("")}
            </select>
          </label>
        </div>
      </div>

      <div class="panel stack">
        <p class="eyebrow">Инвентарь</p>
        <label class="field check-row">
          <input type="checkbox" name="hasBelt" ${p.hasBelt ? "checked" : ""} />
          Есть пояс / отягощение
        </label>
        <label class="field check-row">
          <input type="checkbox" name="hasDips" ${p.hasDips !== false ? "checked" : ""} />
          Есть брусья
        </label>
        <label class="field check-row">
          <input type="checkbox" name="hasPlates" id="has-plates" ${p.hasPlates !== false ? "checked" : ""} />
          Есть блины / диск
        </label>
        <div id="plates-block" class="stack" ${p.hasPlates === false ? "hidden" : ""}>
          <p class="muted small">Отметь только те веса, которые реально есть. Программа не будет просить 5 или 10 кг, если их нет.</p>
          <div class="plate-picks">
            ${window.Coach.plateOptions
              .map((w) => {
                const selected = (p.availablePlates || [15, 20, 25]).map(Number).includes(w);
                return `<label class="plate-chip"><input type="checkbox" name="plates" value="${w}" ${selected ? "checked" : ""} /><span>${w} кг</span></label>`;
              })
              .join("")}
          </div>
        </div>
      </div>

      <div class="panel stack">
        <p class="eyebrow">Ограничения (если есть)</p>
        ${[
          ["shoulder", "Плечо"],
          ["elbow", "Локоть"],
          ["lower_back", "Поясница"],
          ["knee", "Колено"],
        ]
          .map(([id, label]) => {
            const on = (p.injuries || []).includes(id);
            return `<label class="field check-row"><input type="checkbox" name="injury" value="${id}" ${on ? "checked" : ""} /> ${label}</label>`;
          })
          .join("")}
      </div>

      <button class="btn block pulse" type="submit">Собрать программу</button>
      <p class="danger-note">${escapeHtml(window.Coach.safetyNote())}</p>
    </form>`;
  }

  function bindOnboarding() {
    const platesBlock = $("#plates-block");
    $("#has-plates")?.addEventListener("change", (e) => {
      if (platesBlock) platesBlock.hidden = !e.target.checked;
    });

    $("#onboard-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const hasPlates = fd.get("hasPlates") === "on";
      const availablePlates = hasPlates
        ? fd.getAll("plates").map(Number).filter((n) => n > 0).sort((a, b) => a - b)
        : [];
      if (hasPlates && !availablePlates.length) {
        alert("Отметь хотя бы один вес блина, который у тебя есть.");
        return;
      }
      state.profile = {
        ...state.profile,
        name: String(fd.get("name") || "").trim(),
        bodyweight: Number(fd.get("bodyweight")),
        pullupMax: Number(fd.get("pullupMax")),
        dipMax: Number(fd.get("dipMax") || 0),
        weightedMax: Number(fd.get("weightedMax") || 0),
        daysPerWeek: Number(fd.get("daysPerWeek")),
        sessionMinutes: Number(fd.get("sessionMinutes") || 45),
        goal: String(fd.get("goal")),
        experience: String(fd.get("experience") || "intermediate"),
        focus: String(fd.get("focus") || "balanced"),
        injuries: fd.getAll("injury").map(String),
        hasBelt: fd.get("hasBelt") === "on",
        hasDips: fd.get("hasDips") === "on",
        hasPlates,
        availablePlates,
        onboarded: true,
        createdAt: state.profile.createdAt || new Date().toISOString(),
      };
      state.loads = {};
      state = window.Store.ensureLoads(state);
      const prog = program();
      state.activeSessionId = prog.sessions[0].id;
      view = "tab";
      tab = "today";
      persist();
      render();
    });
  }

  /* ---------- Today ---------- */
  function renderToday() {
    const p = state.profile;
    const prog = program();
    const session = activeSession();
    topTitle.textContent = `Привет, ${p.name || "атлет"}`;

    app.innerHTML = `
    <section class="hero-block anim-in">
      <h2>${escapeHtml(session.name).replace(" · ", "<br>")}</h2>
      <p>${escapeHtml(prog.tip)}</p>
    </section>
    <div class="row wrap" style="margin-bottom:12px">
      ${prog.sessions
        .map(
          (s) =>
            `<button type="button" class="day-chip ${s.id === session.id ? "active" : ""}" data-day="${s.id}">${escapeHtml(
              s.name.split("·")[0].trim()
            )}</button>`
        )
        .join("")}
    </div>
    <div class="stack anim-in">
      ${session.items
        .map((item) => {
          const ex = window.EXERCISE_BY_ID[item.exerciseId];
          const load = loadFor(item);
          const unit = item.timed ? "сек" : "повт";
          return `
          <button type="button" class="ex-card" data-ex="${ex.id}">
            ${window.MuscleMap.thumbHtml(ex.id)}
            <div class="ex-meta">
              <h3>${escapeHtml(ex.name)}</h3>
              <p>${escapeHtml(item.note)}</p>
              <div class="prescription">
                <div class="stat-box"><strong>${load.sets}</strong><span>подх</span></div>
                <div class="stat-box"><strong>${load.reps[0]}–${load.reps[1]}</strong><span>${unit}</span></div>
                <div class="stat-box"><strong>${load.weight}</strong><span>кг</span></div>
              </div>
            </div>
          </button>`;
        })
        .join("")}
    </div>
    <div style="margin-top:16px" class="stack">
      <button type="button" class="btn block" id="start-workout">Начать тренировку</button>
      <div class="coach-tip"><strong>Коуч:</strong> ${escapeHtml(window.Coach.tipForExercise(window.EXERCISE_BY_ID[session.items[0].exerciseId], loadFor(session.items[0])))}</div>
    </div>`;

    app.querySelectorAll("[data-day]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeSessionId = btn.dataset.day;
        persist();
        render();
      });
    });
    app.querySelectorAll("[data-ex]").forEach((btn) => {
      btn.addEventListener("click", () => {
        exerciseId = btn.dataset.ex;
        view = "exercise";
        render();
      });
    });
    $("#start-workout")?.addEventListener("click", () => {
      const items = session.items.map((item) => {
        const load = loadFor(item);
        return {
          exerciseId: item.exerciseId,
          prescription: load,
          sets: Array.from({ length: load.sets }, () => ({
            weight: load.weight,
            reps: load.reps[0],
            rir: 2,
          })),
        };
      });
      workoutDraft = { sessionId: session.id, sessionName: session.name, startedAt: new Date().toISOString(), items, index: 0 };
      view = "workout";
      render();
    });
  }

  /* ---------- Exercise detail ---------- */
  function renderExercise() {
    const ex = window.EXERCISE_BY_ID[exerciseId];
    if (!ex) {
      view = "tab";
      render();
      return;
    }
    topTitle.textContent = "Техника";
    const primary = ex.primary.map((m) => window.MUSCLE_LABELS[m] || m).join(", ");
    const secondary = ex.secondary.map((m) => window.MUSCLE_LABELS[m] || m).join(", ");

    app.innerHTML = `
    <button type="button" class="btn ghost" id="back-btn" style="margin-bottom:12px">← Назад</button>
    <section class="hero-block anim-in" style="padding-top:0">
      <h2 style="font-size:34px">${escapeHtml(ex.name)}</h2>
      <p>${escapeHtml(ex.standard)}</p>
    </section>
    <div class="panel anim-in">
      ${window.MuscleMap.detailHtml(
        ex.id,
        escapeHtml(primary),
        escapeHtml(secondary)
      )}
    </div>
    <div class="panel anim-in">
      <h3 style="margin:0 0 10px;font-size:15px">Как делать</h3>
      <ol class="steps">${ex.cues.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ol>
    </div>
    <div class="panel anim-in">
      <h3 style="margin:0 0 10px;font-size:15px">Частые ошибки</h3>
      <ol class="steps">${ex.mistakes.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ol>
      <p class="coach-tip" style="margin-bottom:0"><strong>Дыхание:</strong> ${escapeHtml(ex.breathing)}</p>
    </div>
    <p class="danger-note">${escapeHtml(window.Coach.safetyNote())}</p>`;

    $("#back-btn")?.addEventListener("click", () => {
      view = "tab";
      render();
    });
  }

  /* ---------- Workout logger ---------- */
  function renderWorkout() {
    if (!workoutDraft) {
      view = "tab";
      render();
      return;
    }
    const item = workoutDraft.items[workoutDraft.index];
    const ex = window.EXERCISE_BY_ID[item.exerciseId];
    const load = item.prescription;
    const unit = load.timed ? "сек" : "повт";
    topTitle.textContent = `Подход ${workoutDraft.index + 1}/${workoutDraft.items.length}`;

    app.innerHTML = `
    <button type="button" class="btn ghost" id="cancel-workout" style="margin-bottom:12px">Отменить</button>
    <section class="hero-block anim-in" style="padding-top:0">
      <h2 style="font-size:32px">${escapeHtml(ex.name)}</h2>
      <p>${escapeHtml(load.note || ex.standard)}</p>
    </section>
    <div class="prescription anim-in">
      <div class="stat-box"><strong>${load.sets}</strong><span>подх</span></div>
      <div class="stat-box"><strong>${load.reps[0]}–${load.reps[1]}</strong><span>${unit}</span></div>
      <div class="stat-box"><strong>${load.weight}</strong><span>кг</span></div>
    </div>
    <div class="panel anim-in" style="margin-top:12px;padding:0;overflow:hidden">
      ${window.MuscleMap.formUrl(ex.id) ? `<img class="workout-hero" src="${window.MuscleMap.formUrl(ex.id)}" alt="" />` : ""}
    </div>
    <div class="panel anim-in" style="margin-top:12px">
      ${window.MuscleMap.musclesOnlyHtml(ex.id)}
    </div>
    <div class="panel stack anim-in" style="margin-top:12px">
      <div class="row between small muted"><span>Вес</span><span>${unit}</span><span>RIR</span><span></span></div>
      ${item.sets
        .map(
          (s, i) => `
        <div class="set-row" data-set="${i}">
          <div class="set-idx">${i + 1}</div>
          <input type="number" step="0.5" min="0" data-k="weight" value="${s.weight}" />
          <input type="number" step="1" min="0" data-k="reps" value="${s.reps}" />
          <input type="number" step="1" min="0" max="5" data-k="rir" value="${s.rir}" title="Повторы в запасе" />
          <button type="button" class="btn secondary" data-fill="${i}" style="padding:10px">OK</button>
        </div>`
        )
        .join("")}
      <p class="small muted">RIR — сколько чистых повторов ещё мог бы сделать. 0 = отказ.</p>
    </div>
    <div class="coach-tip anim-in">${escapeHtml(window.Coach.tipForExercise(ex, load))}</div>
    <div class="stack" style="margin-top:14px">
      <button type="button" class="btn ghost" id="open-tech">Техника упражнения</button>
      <button type="button" class="btn block" id="next-ex">${
        workoutDraft.index < workoutDraft.items.length - 1 ? "Следующее упражнение" : "Завершить тренировку"
      }</button>
    </div>`;

    app.querySelectorAll(".set-row").forEach((row) => {
      const idx = Number(row.dataset.set);
      row.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", () => {
          item.sets[idx][input.dataset.k] = Number(input.value);
        });
      });
      row.querySelector("[data-fill]")?.addEventListener("click", () => {
        row.querySelectorAll("input").forEach((input) => {
          item.sets[idx][input.dataset.k] = Number(input.value);
        });
        row.style.outline = "1px solid var(--red)";
        setTimeout(() => (row.style.outline = ""), 400);
      });
    });

    $("#cancel-workout")?.addEventListener("click", () => {
      workoutDraft = null;
      view = "tab";
      tab = "today";
      render();
    });
    $("#open-tech")?.addEventListener("click", () => {
      exerciseId = ex.id;
      view = "exercise";
      render();
    });
    $("#next-ex")?.addEventListener("click", () => {
      // sync inputs
      app.querySelectorAll(".set-row").forEach((row) => {
        const idx = Number(row.dataset.set);
        row.querySelectorAll("input").forEach((input) => {
          item.sets[idx][input.dataset.k] = Number(input.value);
        });
      });

      const advice = window.Coach.nextLoad(load, item.sets, state.profile);
      state.loads[item.exerciseId] = {
        weight: advice.weight,
        reps: advice.reps,
        sets: load.sets,
      };
      state.lastCoachMessages[item.exerciseId] = advice.message;

      if (workoutDraft.index < workoutDraft.items.length - 1) {
        workoutDraft.index += 1;
        render();
        return;
      }

      state.logs.unshift({
        id: (crypto.randomUUID && crypto.randomUUID()) || `log-${Date.now()}`,
        date: new Date().toISOString(),
        sessionId: workoutDraft.sessionId,
        sessionName: workoutDraft.sessionName,
        items: workoutDraft.items.map((it) => ({
          exerciseId: it.exerciseId,
          prescription: it.prescription,
          sets: it.sets,
          coach: state.lastCoachMessages[it.exerciseId] || "",
        })),
      });
      persist();
      const summary = workoutDraft.items
        .map((it) => {
          const name = window.EXERCISE_BY_ID[it.exerciseId].name;
          return `<div class="log-item"><strong>${escapeHtml(name)}</strong><p class="small muted">${escapeHtml(
            state.lastCoachMessages[it.exerciseId] || ""
          )}</p></div>`;
        })
        .join("");
      workoutDraft = null;
      topTitle.textContent = "Готово";
      setNavVisible(true);
      app.innerHTML = `
        <section class="hero-block anim-in"><h2>Тренировка<br>закрыта</h2><p>Прогрессия обновлена. Коуч уже заложил веса на следующий раз.</p></section>
        <div class="panel anim-in">${summary}</div>
        <button type="button" class="btn block" id="to-today" style="margin-top:14px">На сегодня</button>`;
      $("#to-today")?.addEventListener("click", () => {
        view = "tab";
        tab = "today";
        render();
      });
      tab = "log";
    });
  }

  /* ---------- Program ---------- */
  function renderProgram() {
    const prog = program();
    topTitle.textContent = "Программа";
    app.innerHTML = `
    <section class="hero-block anim-in">
      <h2>${prog.daysPerWeek} дня<br>в неделю</h2>
      <p>${escapeHtml(prog.tip)}</p>
    </section>
    <div class="stack anim-in">
      ${prog.sessions
        .map(
          (s) => `
        <div class="panel">
          <div class="row between"><h3 style="margin:0;font-size:16px">${escapeHtml(s.name)}</h3><span class="tag">${escapeHtml(
            s.focus
          )}</span></div>
          <div class="stack" style="margin-top:12px">
            ${s.items
              .map((item) => {
                const ex = window.EXERCISE_BY_ID[item.exerciseId];
                const load = loadFor(item);
                return `<button type="button" class="ex-card" data-ex="${ex.id}">
                  ${window.MuscleMap.thumbHtml(ex.id)}
                  <div class="ex-meta">
                    <h3>${escapeHtml(ex.name)}</h3>
                    <p>${load.sets}×${load.reps[0]}–${load.reps[1]} · ${load.weight} кг</p>
                  </div>
                </button>`;
              })
              .join("")}
          </div>
        </div>`
        )
        .join("")}
    </div>`;
    app.querySelectorAll("[data-ex]").forEach((btn) => {
      btn.addEventListener("click", () => {
        exerciseId = btn.dataset.ex;
        view = "exercise";
        render();
      });
    });
  }

  /* ---------- Log ---------- */
  function renderLog() {
    topTitle.textContent = "Журнал";
    if (!state.logs.length) {
      app.innerHTML = `<section class="hero-block anim-in"><h2>Пока<br>пусто</h2><p>Закрой первую тренировку — здесь появится история и советы коуча.</p></section>`;
      return;
    }
    app.innerHTML = `
    <section class="hero-block anim-in"><h2>${state.logs.length}<br>сессий</h2><p>Последние тренировки на этом устройстве.</p></section>
    <div class="stack anim-in">
      ${state.logs
        .slice(0, 20)
        .map((log) => {
          const d = new Date(log.date);
          const dateStr = d.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
          return `<div class="panel">
            <div class="row between"><strong>${escapeHtml(log.sessionName)}</strong><span class="small muted">${escapeHtml(
              dateStr
            )}</span></div>
            ${log.items
              .map((it) => {
                const ex = window.EXERCISE_BY_ID[it.exerciseId];
                const reps = it.sets.map((s) => s.reps).join("/");
                return `<div class="log-item">
                  <div class="row between"><span>${escapeHtml(ex?.name || it.exerciseId)}</span><span class="tag">${it.sets[0]?.weight ?? 0} кг · ${reps}</span></div>
                  ${it.coach ? `<p class="small muted" style="margin:6px 0 0">${escapeHtml(it.coach)}</p>` : ""}
                </div>`;
              })
              .join("")}
          </div>`;
        })
        .join("")}
    </div>`;
  }

  /* ---------- Profile ---------- */
  function renderProfile() {
    const p = state.profile;
    topTitle.textContent = "Профиль";
    app.innerHTML = `
    <section class="hero-block anim-in">
      <h2>${escapeHtml(p.name || "Атлет")}</h2>
      <p>${escapeHtml(window.Coach.goals[p.goal] || "")} · ${p.bodyweight} кг · ${p.daysPerWeek} дн/нед</p>
    </section>
    <div class="panel stack anim-in">
      <div class="row between"><span class="muted">Опыт</span><strong>${escapeHtml(window.Coach.experienceLabels[p.experience] || "—")}</strong></div>
      <div class="row between"><span class="muted">Акцент</span><strong>${escapeHtml(window.Coach.focusLabels[p.focus] || "—")}</strong></div>
      <div class="row between"><span class="muted">Сессия</span><strong>${p.sessionMinutes || 45} мин</strong></div>
      <div class="row between"><span class="muted">Подтягивания макс</span><strong>${p.pullupMax}</strong></div>
      <div class="row between"><span class="muted">Брусья макс</span><strong>${p.dipMax ?? "—"}</strong></div>
      <div class="row between"><span class="muted">Weighted макс</span><strong>${p.weightedMax} кг</strong></div>
      <div class="row between"><span class="muted">Пояс</span><strong>${p.hasBelt ? "да" : "нет"}</strong></div>
      <div class="row between"><span class="muted">Брусья</span><strong>${p.hasDips !== false ? "да" : "нет"}</strong></div>
      <div class="row between"><span class="muted">Блины</span><strong>${
        p.hasPlates === false
          ? "нет"
          : (p.availablePlates || []).length
            ? (p.availablePlates || []).join(" / ") + " кг"
            : "да"
      }</strong></div>
      ${(p.injuries || []).length ? `<div class="row between"><span class="muted">Ограничения</span><strong>${(p.injuries || []).join(", ")}</strong></div>` : ""}
    </div>
    <div class="stack" style="margin-top:12px">
      <button type="button" class="btn secondary block" id="edit-profile">Изменить анкету</button>
      <button type="button" class="btn ghost block" id="rebuild">Пересобрать веса с нуля</button>
      <button type="button" class="btn ghost block" id="reset-all" style="color:#ff8a80">Сбросить все данные</button>
    </div>
    <p class="danger-note">${escapeHtml(window.Coach.safetyNote())}</p>
    <p class="danger-note">PWA: Android — «Установить приложение». iPhone Safari — Поделиться → На экран «Домой».</p>`;

    $("#edit-profile")?.addEventListener("click", () => {
      view = "onboarding";
      render();
    });
    $("#rebuild")?.addEventListener("click", () => {
      state.loads = {};
      state = window.Store.ensureLoads(state);
      persist();
      tab = "today";
      render();
    });
    $("#reset-all")?.addEventListener("click", () => {
      if (!confirm("Точно стереть профиль, программу и журнал?")) return;
      window.Store.reset();
      state = window.Store.load();
      view = "onboarding";
      render();
    });
  }

  /* ---------- Nav / install / SW ---------- */
  try {
    render();
  } catch (err) {
    console.error(err);
    if (app) {
      app.innerHTML = `<div class="panel"><p>Ошибка запуска: ${escapeHtml(err && err.message ? err.message : String(err))}</p><button type="button" class="btn block" onclick="location.reload()">Обновить</button></div>`;
    }
  }

  nav?.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (!btn) return;
    tab = btn.dataset.tab;
    view = "tab";
    render();
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (installBtn) installBtn.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js?v=8").catch(() => {});
    });
  }
})();
