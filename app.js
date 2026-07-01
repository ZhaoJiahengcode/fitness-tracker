const STORAGE_KEY = "fitness-tracker-v1";
const HISTORY_KEY = "fitness-tracker-history-v1";

const benchStages = [
  { name: "当前", reps: [4, 4, 3, 3], note: "把 4、4、3、3 做稳" },
  { name: "第一阶段", reps: [5, 4, 4, 3], note: "第一组推进到 5" },
  { name: "第二阶段", reps: [5, 5, 4, 4], note: "前两组都做到 5" },
  { name: "第三阶段", reps: [6, 5, 5, 4], note: "第一组推进到 6" },
  { name: "第四阶段", reps: [6, 6, 5, 5], note: "为测试做准备" },
  { name: "测试阶段", reps: [10], note: "状态好时冲 50kg x 10" },
];

const plan = [
  {
    id: "day1",
    label: "第一天",
    title: "推 + 轻有氧",
    exercises: [
      {
        id: "bench-heavy",
        type: "strength",
        name: "卧推",
        weight: "50kg",
        targetSets: 4,
        targetReps: "4 / 4 / 3 / 3",
        setTargets: [4, 4, 3, 3],
        restSeconds: 180,
        note: "热身：空杆x10、30kgx8、40kgx5、45kgx3。正式组 50kg x 4 组。",
        isBench: true,
      },
      strength("pushup", "标准俯卧撑", "自重", 3, "8-15", 90),
      strength("close-pushup", "窄距俯卧撑", "自重", 2, "6-12", 90),
      strength("lateral-raise", "哑铃侧平举", "按当天状态", 4, "12-20", 75, "可做 3-4 组，动作控制优先。"),
      cardio("light-cardio", "轻有氧", "15-20分钟", "轻到中等", "跑步机、椭圆机、动感单车都可以。"),
    ],
  },
  {
    id: "day2",
    label: "第二天",
    title: "拉",
    exercises: [
      strength("pullup", "引体向上", "自重", 4, "保留1-2个余力", 120),
      strength("lat-pulldown", "高位下拉", "按当天状态", 3, "8-12", 90),
      strength("incline-row", "上斜凳哑铃划船", "按当天状态", 4, "8-12", 90),
      strength("face-pull", "面拉", "按当天状态", 3, "12-20", 75),
    ],
  },
  {
    id: "day3",
    label: "第三天",
    title: "腿 + 核心",
    exercises: [
      strength("squat", "杠铃深蹲", "按当天状态", 4, "5-8", 150),
      strength("goblet-squat", "高脚杯深蹲", "按当天状态", 3, "10-15", 90),
      strength("rdl", "罗马尼亚硬拉", "按当天状态", 3, "8-12", 120),
      strength("leg-raise", "仰卧收腹举腿", "自重", 3, "8-12", 60),
      strength("plank", "可选平板支撑", "自重", 2, "30-60秒", 60),
    ],
  },
  {
    id: "day4",
    label: "第四天",
    title: "基础心肺",
    exercises: [cardio("base-cardio", "基础心肺", "20-40分钟", "轻到中等", "慢跑 / 椭圆机 / 动感单车 / 跑走结合。")],
  },
  {
    id: "day5",
    label: "第五天",
    title: "卧推容量日",
    exercises: [
      {
        id: "bench-volume",
        type: "strength",
        name: "轻重量卧推",
        weight: "42.5-45kg",
        targetSets: 4,
        targetReps: "6-8",
        setTargets: [8, 8, 8, 8],
        restSeconds: 150,
        note: "热身：空杆x10、30kgx8、40kgx5。不做到力竭。",
        isBench: true,
      },
      strength("pushup-volume", "标准俯卧撑", "自重", 3, "8-15", 90),
      strength("lateral-raise-volume", "哑铃侧平举", "按当天状态", 4, "12-20", 75),
      strength("close-pushup-optional", "可选窄距俯卧撑", "自重", 2, "6-12", 90),
    ],
  },
  {
    id: "day6",
    label: "第六天",
    title: "间歇跑",
    exercises: [
      cardio("interval-warmup", "热身慢跑", "8-10分钟", "轻松", ""),
      cardio("intervals", "快跑30秒 + 慢走/慢跑90秒", "6-8组", "高强度间歇", ""),
      cardio("interval-cooldown", "放松慢走", "5-10分钟", "轻松", ""),
    ],
  },
  {
    id: "day7",
    label: "第七天",
    title: "休息 / 恢复",
    exercises: [
      cardio("walk", "散步", "20-30分钟", "轻松", ""),
      cardio("stretch", "拉伸", "10分钟", "轻松", ""),
      strength("light-core", "可选轻核心", "自重", 2, "轻松完成", 45),
    ],
  },
];

function strength(id, name, weight, targetSets, targetReps, restSeconds, note = "") {
  return {
    id,
    type: "strength",
    name,
    weight,
    targetSets,
    targetReps,
    setTargets: Array.from({ length: targetSets }, () => targetReps),
    restSeconds,
    note,
  };
}

function cardio(id, name, targetTime, intensity, note) {
  return { id, type: "cardio", name, targetTime, intensity, note };
}

let state = loadState();
let selectedDayId = state.selectedDayId || plan[0].id;
let timer = {
  intervalId: null,
  exerciseId: null,
  endsAt: 0,
  remaining: 0,
};

const dayStrip = document.querySelector("#dayStrip");
const activePanel = document.querySelector("#activePanel");
const exerciseList = document.querySelector("#exerciseList");
const completionSummary = document.querySelector("#completionSummary");
const benchProgress = document.querySelector("#benchProgress");
const benchStageBadge = document.querySelector("#benchStageBadge");
const historyList = document.querySelector("#historyList");
const toast = document.querySelector("#toast");

document.querySelector("#resetTodayButton").addEventListener("click", resetSelectedDay);
document.querySelector("#clearHistoryButton").addEventListener("click", clearHistory);

render();

function defaultDayState(day) {
  const exercises = {};
  day.exercises.forEach((exercise) => {
    if (exercise.type === "strength") {
      exercises[exercise.id] = {
        actualReps: Array.from({ length: exercise.targetSets }, () => ""),
        currentSet: 1,
        startedSet: null,
        completedSets: [],
        done: false,
      };
    } else {
      exercises[exercise.id] = {
        method: exercise.name,
        minutes: "",
        intensity: exercise.intensity || "",
        note: "",
        done: false,
      };
    }
  });

  return { exercises, completedAt: null };
}

function loadState() {
  const saved = readJson(STORAGE_KEY, null);
  const base = { selectedDayId: plan[0].id, days: {}, benchStage: 0 };
  plan.forEach((day) => {
    base.days[day.id] = defaultDayState(day);
  });

  if (!saved) return base;

  plan.forEach((day) => {
    const savedDay = saved.days?.[day.id];
    if (!savedDay) return;
    Object.keys(base.days[day.id].exercises).forEach((exerciseId) => {
      base.days[day.id].exercises[exerciseId] = {
        ...base.days[day.id].exercises[exerciseId],
        ...savedDay.exercises?.[exerciseId],
      };
    });
    base.days[day.id].completedAt = savedDay.completedAt || null;
  });

  base.selectedDayId = saved.selectedDayId || base.selectedDayId;
  base.benchStage = Number.isInteger(saved.benchStage) ? saved.benchStage : 0;
  return base;
}

function saveState() {
  state.selectedDayId = selectedDayId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function render() {
  renderDays();
  renderActivePanel();
  renderExercises();
  renderBenchProgress();
  renderHistory();
}

function selectedDay() {
  return plan.find((day) => day.id === selectedDayId);
}

function selectedDayState() {
  return state.days[selectedDayId];
}

function renderDays() {
  dayStrip.innerHTML = "";
  plan.forEach((day) => {
    const button = document.createElement("button");
    button.className = `day-button ${day.id === selectedDayId ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `<strong>${day.label}</strong><span>${day.title}</span>`;
    button.addEventListener("click", () => {
      selectedDayId = day.id;
      saveState();
      render();
    });
    dayStrip.appendChild(button);
  });
}

function renderActivePanel() {
  const day = selectedDay();
  const current = getCurrentExercise(day);

  if (!current) {
    activePanel.innerHTML = `
      <div>
        <div class="current-title">
          <h2>${day.title} 已完成</h2>
          <span class="pill">${day.label}</span>
        </div>
        <p class="exercise-subtitle">今天的训练都记录好了。</p>
        <button class="primary-button" type="button" id="saveHistoryNow">保存到历史</button>
      </div>
      <div class="timer-box">
        <div>
          <div class="timer-label">当前状态</div>
          <div class="timer-time">OK</div>
          <div class="timer-hint">可以收工，也可以重置当天重新记录。</div>
        </div>
      </div>
    `;
    document.querySelector("#saveHistoryNow").addEventListener("click", () => saveDayToHistory(day));
    return;
  }

  const currentState = selectedDayState().exercises[current.id];
  const isStrength = current.type === "strength";
  const isResting = timer.exerciseId === current.id && timer.remaining > 0;
  const isSetStarted = isStrength && currentState.startedSet === currentState.currentSet;
  const timerText = timer.exerciseId === current.id && timer.remaining > 0 ? formatTime(timer.remaining) : formatTime(current.restSeconds || 0);
  const timerLabel = isResting ? "休息倒计时" : isStrength && isSetStarted ? "本组进行中" : isStrength ? "组间休息" : "无需倒计时";
  const timerHint = isResting ? "倒计时结束后会提示开始下一组。" : isStrength && isSetStarted ? "做完后点完成本组。" : isStrength ? "准备好后点开始本组。" : "有氧完成后在动作卡片里勾选即可。";

  activePanel.innerHTML = `
    <div>
      <div class="current-title">
        <h2>${current.name}</h2>
        <span class="pill">${day.label} · ${day.title}</span>
      </div>
      <div class="metric-row">
        <div class="metric"><span>重量</span><strong>${isStrength ? current.weight : "方式"}</strong></div>
        <div class="metric"><span>${isStrength ? "目标组数" : "目标时间"}</span><strong>${isStrength ? `${current.targetSets}组` : current.targetTime}</strong></div>
        <div class="metric"><span>${isStrength ? "目标次数" : "强度"}</span><strong>${isStrength ? current.targetReps : current.intensity}</strong></div>
        <div class="metric"><span>当前</span><strong>${isStrength ? `第${currentState.currentSet}组` : currentState.done ? "已完成" : "待完成"}</strong></div>
      </div>
      ${current.note ? `<p class="exercise-subtitle" style="margin-top:12px">${current.note}</p>` : ""}
      <div class="action-row">
        <button class="primary-button" type="button" id="startSetButton" ${!isStrength || currentState.done || isResting || isSetStarted ? "disabled" : ""}>开始本组</button>
        <button class="primary-button complete-button" type="button" id="completeSetButton" ${!isStrength || currentState.done || !isSetStarted ? "disabled" : ""}>完成本组</button>
        <button class="secondary-button" type="button" id="skipRestButton" ${timer.exerciseId === current.id && timer.remaining > 0 ? "" : "disabled"}>跳过休息</button>
      </div>
    </div>
    <div class="timer-box">
      <div>
        <div class="timer-label">${timerLabel}</div>
        <div class="timer-time">${timerText}</div>
        <div class="timer-hint">${timerHint}</div>
      </div>
    </div>
  `;

  document.querySelector("#startSetButton").addEventListener("click", () => startSet(current));
  document.querySelector("#completeSetButton").addEventListener("click", () => completeSet(current));
  document.querySelector("#skipRestButton").addEventListener("click", stopTimer);
}

function renderExercises() {
  const day = selectedDay();
  const dayState = selectedDayState();
  const current = getCurrentExercise(day);
  const completedCount = day.exercises.filter((exercise) => dayState.exercises[exercise.id].done).length;
  completionSummary.textContent = `${completedCount}/${day.exercises.length} 完成`;
  exerciseList.innerHTML = "";

  day.exercises.forEach((exercise) => {
    const exerciseState = dayState.exercises[exercise.id];
    const card = document.createElement("article");
    card.className = `exercise-card ${current?.id === exercise.id ? "active" : ""} ${exerciseState.done ? "done" : ""}`;

    if (exercise.type === "strength") {
      card.innerHTML = strengthCardHtml(exercise, exerciseState);
      exerciseList.appendChild(card);
      bindStrengthInputs(card, exercise, exerciseState);
    } else {
      card.innerHTML = cardioCardHtml(exercise, exerciseState);
      exerciseList.appendChild(card);
      bindCardioInputs(card, exercise);
    }
  });
}

function strengthCardHtml(exercise, exerciseState) {
  const sets = Array.from({ length: exercise.targetSets }, (_, index) => {
    const setNumber = index + 1;
    const isDone = exerciseState.completedSets.includes(setNumber);
    const isCurrent = exerciseState.currentSet === setNumber && !exerciseState.done;
    const isStarted = exerciseState.startedSet === setNumber && isCurrent;
    const target = exercise.setTargets[index] ?? exercise.targetReps;
    const actual = exerciseState.actualReps[index] || "";
    return `
      <div class="set-chip ${isDone ? "done" : ""} ${isCurrent ? "current" : ""} ${isStarted ? "started" : ""}">
        第${setNumber}组 · 目标${target}<br />
        ${isStarted ? "进行中" : `实际：${actual || "未填"}`}
      </div>
    `;
  }).join("");

  const inputs = Array.from({ length: exercise.targetSets }, (_, index) => `
    <label>
      第${index + 1}组实际次数
      <input data-rep-input="${index}" inputmode="numeric" value="${escapeHtml(exerciseState.actualReps[index] || "")}" placeholder="如 8" />
    </label>
  `).join("");

  return `
    <div class="exercise-header">
      <div>
        <h3>${exercise.name}</h3>
        <div class="exercise-subtitle">重量：${exercise.weight} · ${exercise.targetSets}组 · ${exercise.targetReps} · 休息${Math.round(exercise.restSeconds / 60)}分钟</div>
      </div>
      <span class="pill">${exerciseState.done ? "完成" : `第${exerciseState.currentSet}组`}</span>
    </div>
    ${exercise.note ? `<div class="exercise-subtitle">${exercise.note}</div>` : ""}
    <div class="set-grid">${sets}</div>
    <div class="inline-form">${inputs}</div>
  `;
}

function cardioCardHtml(exercise, exerciseState) {
  return `
    <div class="exercise-header">
      <div>
        <h3>${exercise.name}</h3>
        <div class="exercise-subtitle">目标：${exercise.targetTime} · 强度：${exercise.intensity}</div>
      </div>
      <span class="pill">${exerciseState.done ? "完成" : "待完成"}</span>
    </div>
    ${exercise.note ? `<div class="exercise-subtitle">${exercise.note}</div>` : ""}
    <div class="inline-form">
      <label>
        训练方式
        <input data-cardio-field="method" value="${escapeHtml(exerciseState.method || "")}" />
      </label>
      <label>
        时间
        <input data-cardio-field="minutes" value="${escapeHtml(exerciseState.minutes || "")}" placeholder="如 20分钟" />
      </label>
      <label>
        强度
        <input data-cardio-field="intensity" value="${escapeHtml(exerciseState.intensity || "")}" />
      </label>
      <label>
        是否完成
        <select data-cardio-field="done">
          <option value="false" ${exerciseState.done ? "" : "selected"}>未完成</option>
          <option value="true" ${exerciseState.done ? "selected" : ""}>已完成</option>
        </select>
      </label>
      <label class="full-field">
        备注
        <textarea data-cardio-field="note" placeholder="状态、心率、跑步机速度等">${escapeHtml(exerciseState.note || "")}</textarea>
      </label>
    </div>
  `;
}

function bindStrengthInputs(card, exercise, exerciseState) {
  card.querySelectorAll("[data-rep-input]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const index = Number(event.target.dataset.repInput);
      exerciseState.actualReps[index] = event.target.value.trim();
      saveState();
      renderActivePanel();
    });
  });
}

function startSet(exercise) {
  const exerciseState = selectedDayState().exercises[exercise.id];
  exerciseState.startedSet = exerciseState.currentSet;
  saveState();
  render();
  showToast(`${exercise.name} 第${exerciseState.currentSet}组开始`);
}

function bindCardioInputs(card, exercise) {
  card.querySelectorAll("[data-cardio-field]").forEach((input) => {
    input.addEventListener("input", () => updateCardio(exercise.id, input, false));
    input.addEventListener("change", () => updateCardio(exercise.id, input, true));
  });
}

function updateCardio(exerciseId, input, shouldRender) {
  const exerciseState = selectedDayState().exercises[exerciseId];
  const field = input.dataset.cardioField;
  exerciseState[field] = field === "done" ? input.value === "true" : input.value.trim();
  saveState();
  maybeAutoSaveDay();
  if (shouldRender) render();
}

function completeSet(exercise) {
  const exerciseState = selectedDayState().exercises[exercise.id];
  const setNumber = exerciseState.currentSet;

  if (exerciseState.startedSet !== setNumber) {
    showToast("先点开始本组");
    return;
  }

  if (!exerciseState.actualReps[setNumber - 1]) {
    const target = exercise.setTargets[setNumber - 1] ?? exercise.targetReps;
    exerciseState.actualReps[setNumber - 1] = String(target).split("-")[0].trim();
  }

  if (!exerciseState.completedSets.includes(setNumber)) {
    exerciseState.completedSets.push(setNumber);
  }

  if (setNumber >= exercise.targetSets) {
    exerciseState.done = true;
    exerciseState.startedSet = null;
    stopTimer(false);
    maybeAdvanceBenchStage(exercise, exerciseState);
    showToast(`${exercise.name} 已完成`);
  } else {
    exerciseState.currentSet += 1;
    exerciseState.startedSet = null;
    startTimer(exercise.id, exercise.restSeconds);
    showToast(`第${setNumber}组已记录，开始休息`);
  }

  saveState();
  maybeAutoSaveDay();
  render();
}

function getCurrentExercise(day) {
  return day.exercises.find((exercise) => !selectedDayState().exercises[exercise.id].done) || null;
}

function startTimer(exerciseId, seconds) {
  stopTimer(false);
  timer.exerciseId = exerciseId;
  timer.remaining = seconds;
  timer.endsAt = Date.now() + seconds * 1000;
  timer.intervalId = window.setInterval(tickTimer, 250);
}

function tickTimer() {
  timer.remaining = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  renderActivePanel();
  if (timer.remaining <= 0) {
    const exercise = selectedDay().exercises.find((item) => item.id === timer.exerciseId);
    stopTimer(false);
    showToast(exercise ? `${exercise.name} 休息结束，可以开始下一组` : "休息结束");
    render();
  }
}

function stopTimer(show = true) {
  if (timer.intervalId) window.clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.exerciseId = null;
  timer.endsAt = 0;
  timer.remaining = 0;
  if (show) {
    showToast("休息已跳过");
    renderActivePanel();
  }
}

function renderBenchProgress() {
  benchStageBadge.textContent = benchStages[state.benchStage]?.name || benchStages[0].name;
  benchProgress.innerHTML = benchStages.map((stage, index) => {
    const status = index < state.benchStage ? "done" : index === state.benchStage ? "current" : "";
    return `
      <div class="progress-step ${status}">
        <div class="progress-dot">${index < state.benchStage ? "✓" : index + 1}</div>
        <div>
          <strong>${stage.name}：${stage.reps.join("、")}</strong>
          <span>${stage.note}</span>
        </div>
      </div>
    `;
  }).join("");
}

function maybeAdvanceBenchStage(exercise, exerciseState) {
  if (!exercise.isBench || exercise.id !== "bench-heavy") return;
  const stage = benchStages[state.benchStage];
  if (!stage || stage.reps.length !== exerciseState.actualReps.length) return;

  const passed = stage.reps.every((target, index) => Number(exerciseState.actualReps[index]) >= target);
  if (passed && state.benchStage < benchStages.length - 1) {
    state.benchStage += 1;
    showToast(`卧推进步路线已进入：${benchStages[state.benchStage].name}`);
  }
}

function saveDayToHistory(day) {
  const history = readJson(HISTORY_KEY, []);
  const dayState = selectedDayState();
  const finished = day.exercises.filter((exercise) => dayState.exercises[exercise.id].done).length;
  if (dayState.completedAt) {
    showToast("今天已经保存过了");
    return;
  }
  history.unshift({
    id: createId(),
    date: new Date().toLocaleString("zh-CN"),
    day: day.label,
    title: day.title,
    summary: `${finished}/${day.exercises.length} 动作完成`,
    data: dayState,
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  dayState.completedAt = new Date().toISOString();
  saveState();
  renderHistory();
  showToast("已保存到训练历史");
}

function maybeAutoSaveDay() {
  const day = selectedDay();
  const dayState = selectedDayState();
  const allDone = day.exercises.every((exercise) => dayState.exercises[exercise.id].done);
  if (allDone && !dayState.completedAt) {
    saveDayToHistory(day);
  }
}

function renderHistory() {
  const history = readJson(HISTORY_KEY, []);
  if (!history.length) {
    historyList.innerHTML = `<div class="exercise-subtitle">还没有保存过训练。当天动作全完成后可以保存到这里。</div>`;
    return;
  }

  historyList.innerHTML = history.slice(0, 8).map((item) => `
    <div class="history-item">
      <div>
        <strong>${item.day} · ${item.title}</strong>
        <span>${item.date}</span>
      </div>
      <span>${item.summary}</span>
    </div>
  `).join("");
}

function resetSelectedDay() {
  const day = selectedDay();
  state.days[day.id] = defaultDayState(day);
  stopTimer(false);
  saveState();
  render();
  showToast(`${day.label} 已重置`);
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast("训练历史已清空");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
