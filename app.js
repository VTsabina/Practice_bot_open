// ============ ДАННЫЕ ============
// Формат: correct — массив индексов (для multi — несколько, для single — один).
// type: один из 9 типов (пока условные названия). topic: одна из 9 тем.
// sr: массив СР, к которым относится. level: basic | advanced.

// Справочники для UI (пока условные)
const TYPES = [
  { id: "true-false", name: "Верно-неверно" }, { id: "mistakes-one", name: "Поиск ошибки (один ответ)" },
  { id: "mistakes-mult", name: "Поиск ошибок в коде" }, { id: "theory-one", name: "Теория (один ответ)" },
  { id: "theory-mult", name: "Теория (несколько ответов)" }, { id: "iter-count", name: "Счетчик итераций" },
  { id: "code-add", name: "Дополнить программу" }, { id: "code-choice", name: "Выбор кода" },
  { id: "code-read", name: "Чтение кода" }
];
const SRS = [
  { id: "sr1", name: "СР 1" }, { id: "sr2", name: "СР 2" },
  { id: "sr3", name: "СР 3" }, { id: "sr4", name: "СР 4" }
];
const TOPICS = [
  { id: "vars", name: "Переменные и арифметика", short: "Переменные" },
  { id: "logic", name: "Логика и условия", short: "Логика" },
  { id: "while", name: "Цикл while", short: "While" },
  { id: "for", name: "Структуры данных и for", short: "For и структуры" },
  { id: "methods", name: "Методы", short: "Методы" },
  { id: "sets", name: "Неупорядоченные типы", short: "Множества" },
  { id: "nested", name: "Вложенные структуры и сортировки", short: "Вложенность и сортировки" },
  { id: "funcs", name: "Функции", short: "Функции" },
  { id: "files", name: "Текстовые файлы и таблицы", short: "Файлы и таблицы" }
];

// ============ СОСТОЯНИЕ ============
const state = {
  level: null,          // "start" | "basic" | "advanced"
  mode: null,           // "bank" | "sr" | "topic" | "random"
  questions: [],        // массив вопросов текущего теста
  answers: {},          // { qid: [индексы выбранных] }
  current: 0,            // индекс текущего вопроса
  returnTo: "menu",      // куда вернуться с экрана теста/результатов
  pendingPool: [],      // пул, из которого будем брать задания
  pendingReturnTo: null
};

// ============ УТИЛИТЫ ============
const $ = (sel) => document.querySelector(sel);

// ============ СТАРТ ============
const isDark = tg?.colorScheme === 'dark';
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = isDark
  ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
  : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
document.head.appendChild(link);

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if (user) $("#username").textContent = user.first_name;
}

function show(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("#screen-" + screenId).classList.add("active");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Фильтр по уровню + предикат, перемешать, взять до 10
function pickQuestions(predicate) {
  const pool = QUESTIONS.filter(q => q.level === state.level && predicate(q));
  return shuffle(pool).slice(0, 10);
}

// ============ ГЛАВНАЯ ============
document.querySelectorAll("#screen-home .btn").forEach(btn => {
  btn.addEventListener("click", () => {
    state.level = btn.dataset.level;
    show("menu");
  });
});

// ============ МЕНЮ ============
document.querySelectorAll("#screen-menu .btn").forEach(btn => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    if (state.mode === "random") {
      state.returnTo = "menu";
      const qs = pickQuestions(() => true);
      if (qs.length === 0) {
        alert("Для этого уровня пока нет заданий.");
        return;
      }
      startTest(qs);
    } else {
      state.returnTo = "menu";
      renderPicker();
    }
  });
});

// ============ ВЫБОР ПАРАМЕТРА ============
function renderPicker() {
  const title = $("#picker-title");
  const list = $("#picker-list");
  list.innerHTML = "";

  let items = [];
  if (state.mode === "bank") { title.textContent = "Тип задания"; items = TYPES; }
  if (state.mode === "sr") { title.textContent = "К какой СР готовишься?"; items = SRS; }
  if (state.mode === "topic") { title.textContent = "Тема"; items = TOPICS; }

  items.forEach(item => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = item.short || item.name;
    b.addEventListener("click", () => {
      let pred;
      if (state.mode === "bank") pred = q => q.type === item.id;
      if (state.mode === "sr") pred = q => q.sr.includes(item.id);
      if (state.mode === "topic") pred = q => q.topic === item.id;

      // только фильтр по уровню и категории, без перемешивания и обрезки
      const pool = QUESTIONS.filter(q => q.level === state.level && pred(q));

      if (pool.length === 0) {
        alert("По этому фильтру пока нет заданий для выбранного уровня.");
        return;
      }

      state.pendingPool = pool;
      state.returnTo = "picker";   // с экрана количества «назад» — в пикер
      renderCountPicker();
    });
    list.appendChild(b);
  });

  show("picker");
}

function renderCountPicker() {
  const max = Math.min(15, state.pendingPool.length);
  const select = $("#count-select");
  select.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    if (i === max) opt.selected = true;   // по умолчанию — максимум
    select.appendChild(opt);
  }
  $("#count-hint").textContent =
    `Доступно заданий: ${state.pendingPool.length}`;
  show("count");
}

$("#btn-start-count").addEventListener("click", () => {
  const n = parseInt($("#count-select").value, 10);
  const qs = shuffle(state.pendingPool).slice(0, n);
  startTest(qs);
});

$("#btn-count-back").addEventListener("click", () => {
  show("picker");
});

// ============ ТЕСТ ============
function startTest(questions) {
  state.questions = questions;
  state.answers = {};
  state.current = 0;
  renderTest();
  show("test");
  if (tg) tg.enableClosingConfirmation();
}

function renderTest() {
  const q = state.questions[state.current];
  $("#test-progress").textContent = `Вопрос ${state.current + 1} из ${state.questions.length}`;

  // Карта вопросов
  const map = $("#question-map");
  map.innerHTML = "";
  state.questions.forEach((qq, i) => {
    const d = document.createElement("div");
    d.className = "map-item";
    if (state.answers[qq.id]) d.classList.add("answered");
    if (i === state.current) d.classList.add("current");
    d.textContent = i + 1;
    d.addEventListener("click", () => { state.current = i; renderTest(); });
    map.appendChild(d);
  });

  // Сам вопрос
  const area = $("#question-area");
  area.innerHTML = "";

  const text = document.createElement("div");
  text.className = "question-text";
  text.textContent = q.text;
  area.appendChild(text);

  if (q.code) {
    const pre = document.createElement("pre");
    pre.className = "question-code";
    const codeEl = document.createElement("code");
    codeEl.className = "language-python";
    codeEl.textContent = q.code;
    pre.appendChild(codeEl);
    area.appendChild(pre);
    if (window.hljs) hljs.highlightElement(codeEl);
  }

  const selected = state.answers[q.id] || [];
  q.options.forEach((opt, idx) => {
    const label = document.createElement("label");
    label.className = "option";
    const input = document.createElement("input");
    input.type = q.multi ? "checkbox" : "radio";
    input.name = "q_" + q.id;
    input.checked = selected.includes(idx);
    input.addEventListener("change", () => {
      if (q.multi) {
        const cur = new Set(state.answers[q.id] || []);
        input.checked ? cur.add(idx) : cur.delete(idx);
        state.answers[q.id] = [...cur].sort((a, b) => a - b);
      } else {
        state.answers[q.id] = [idx];
      }
      renderTest(); // обновить карту
    });
    label.appendChild(input);
    const optText = document.createElement("span");
    optText.className = "option-text";
    optText.textContent = opt;   // textContent безопасен, \n сохранятся
    label.appendChild(optText);
    area.appendChild(label);
  });

  $("#btn-prev").disabled = state.current === 0;
  $("#btn-next").disabled = state.current === state.questions.length - 1;
}

$("#btn-prev").addEventListener("click", () => { state.current--; renderTest(); });
$("#btn-next").addEventListener("click", () => { state.current++; renderTest(); });
$("#btn-test-back").addEventListener("click", () => {
  show(state.returnTo);   // "picker" или "menu"
  if (tg) tg.disableClosingConfirmation();
});

// Проверка
$("#btn-check").addEventListener("click", () => {
  const total = state.questions.length;
  const answered = state.questions.filter(q => {
    const a = state.answers[q.id];
    return a && a.length > 0;
  }).length;

  if (answered < total) {
    const ok = confirm(`Отвечено ${answered} из ${total}. Всё равно проверить?`);
    if (!ok) return;
  }

  renderResults();
  show("results");
  if (tg) tg.disableClosingConfirmation();
});

// ============ РЕЗУЛЬТАТЫ ============
function renderResults() {
  let ok = 0;
  const list = $("#results-list");
  list.innerHTML = "";

  state.questions.forEach((q, i) => {
    const chosen = state.answers[q.id] || [];
    const isCorrect =
      chosen.length === q.correct.length &&
      chosen.every(v => q.correct.includes(v));
    if (isCorrect) ok++;

    const item = document.createElement("div");
    item.className = "result-item";

    const mark = document.createElement("span");
    mark.className = "mark " + (isCorrect ? "ok" : "fail");
    mark.textContent = isCorrect ? "✔ " : "✘ ";
    item.appendChild(mark);
    item.appendChild(document.createTextNode(`Вопрос ${i + 1}: ${q.text}`));

    const detail = document.createElement("div");
    detail.className = "result-detail";

    const yourAns = chosen.length
      ? chosen.map(idx => q.options[idx]).join(", ")
      : "— (нет ответа)";
    const correctAns = q.correct.map(idx => q.options[idx]).join(", ");

    detail.innerHTML =
      `<div><b>Твой ответ:</b> ${yourAns}</div>` +
      `<div><b>Правильно:</b> ${correctAns}</div>` +
      `<div><b>Комментарий:</b> ${q.comment || "—"}</div>`;

    item.appendChild(detail);
    item.addEventListener("click", () => item.classList.toggle("open"));
    list.appendChild(item);
  });

  $("#results-summary").textContent = `Правильно: ${ok} из ${state.questions.length}`;
}

// Повторно те же задания
$("#btn-retry").addEventListener("click", () => {
  state.answers = {};
  state.current = 0;
  renderTest();
  show("test");
  if (tg) tg.enableClosingConfirmation();
});

// Кнопки «назад»
document.querySelectorAll("[data-back]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.back;
    if (target === "home") show("home");
    if (target === "menu") show("menu");
  });
});

$("#btn-results-back").addEventListener("click", () => {
  show(state.returnTo);
});

