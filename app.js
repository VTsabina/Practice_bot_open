// ============ ДАННЫЕ ============
// Формат: correct — массив индексов (для multi — несколько, для single — один).
// type: один из 10 типов (пока условные названия). topic: одна из 9 тем.
// sr: массив СР, к которым относится. level: basic | advanced.
const QUESTIONS = [
  {
    id: "q1", level: "basic", type: "loops", topic: "basics", sr: ["sr1"],
    text: "Что выведет код?",
    code: "for (let i = 0; i < 3; i++) console.log(i);",
    options: ["0 1 2", "1 2 3", "0 1 2 3", "Ошибка"],
    correct: [0], multi: false,
    comment: "Цикл идёт от 0 до 2 включительно."
  },
  {
    id: "q2", level: "basic", type: "types", topic: "basics", sr: ["sr1", "sr2"],
    text: "Какие из типов являются примитивами в JS? (выбери все)",
    options: ["number", "object", "string", "boolean"],
    correct: [0, 2, 3], multi: true,
    comment: "object — не примитив. Примитивы: number, string, boolean, null, undefined, symbol, bigint."
  },
  {
    id: "q3", level: "basic", type: "arrays", topic: "collections", sr: ["sr2"],
    text: "Что вернёт [1,2,3].map(x => x * 2)?",
    options: ["[2,4,6]", "[1,2,3]", "[3,6,9]", "Ошибка"],
    correct: [0], multi: false,
    comment: "map возвращает новый массив с результатом применения функции к каждому элементу."
  },
  {
    id: "q4", level: "advanced", type: "loops", topic: "basics", sr: ["sr3"],
    text: "Что выведет код?",
    code: "for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }",
    options: ["0 1 2", "3 3 3", "0 0 0", "Ошибка"],
    correct: [1], multi: false,
    comment: "var — функциональная область видимости, к моменту вызова setTimeout i уже равно 3."
  },
  {
    id: "q5", level: "advanced", type: "async", topic: "async", sr: ["sr3", "sr4"],
    text: "Что вернёт fetch(...)?",
    options: ["Promise", "JSON-объект", "Строку", "Response синхронно"],
    correct: [0], multi: false,
    comment: "fetch возвращает Promise, который резолвится в Response."
  },
  {
    id: "q6", level: "advanced", type: "this", topic: "functions", sr: ["sr4"],
    text: "Чему равно this в стрелочной функции? (выбери все верные)",
    options: ["Берётся из внешнего контекста", "Зависит от вызова", "Нельзя переопределить через call", "Всегда undefined"],
    correct: [0, 2], multi: true,
    comment: "Стрелочные функции не имеют своего this — он лексический и не переопределяется."
  },
  {
    id: "q7", level: "basic", type: "strings", topic: "basics", sr: ["sr1"],
    text: "Что вернёт 'abc'.toUpperCase()?",
    options: ["'ABC'", "'abc'", "undefined", "Ошибка"],
    correct: [0], multi: false,
    comment: "toUpperCase возвращает новую строку в верхнем регистре."
  },
  {
    id: "q8", level: "advanced", type: "closures", topic: "functions", sr: ["sr3"],
    text: "Что такое замыкание?",
    options: [
      "Функция, запоминающая своё лексическое окружение",
      "Способ вызвать функцию без аргументов",
      "Глобальная переменная",
      "Тип данных"
    ],
    correct: [0], multi: false,
    comment: "Замыкание — функция вместе с её лексическим окружением."
  }
];

// Справочники для UI (пока условные)
const TYPES = [
  { id: "loops", name: "Циклы" }, { id: "types", name: "Типы данных" },
  { id: "arrays", name: "Массивы" }, { id: "async", name: "Асинхронность" },
  { id: "this", name: "this" }, { id: "strings", name: "Строки" },
  { id: "closures", name: "Замыкания" }, { id: "objects", name: "Объекты" },
  { id: "functions", name: "Функции" }, { id: "errors", name: "Ошибки" }
];
const SRS = [
  { id: "sr1", name: "СР 1" }, { id: "sr2", name: "СР 2" },
  { id: "sr3", name: "СР 3" }, { id: "sr4", name: "СР 4" }
];
const TOPICS = [
  { id: "basics", name: "Основы" }, { id: "collections", name: "Коллекции" },
  { id: "async", name: "Асинхронность" }, { id: "functions", name: "Функции" },
  { id: "oop", name: "ООП" }, { id: "dom", name: "DOM" },
  { id: "errors", name: "Ошибки" }, { id: "modules", name: "Модули" },
  { id: "algo", name: "Алгоритмы" }
];

// ============ СОСТОЯНИЕ ============
const state = {
  level: null,          // "basic" | "advanced"
  mode: null,           // "bank" | "sr" | "topic" | "random"
  questions: [],        // массив вопросов текущего теста
  answers: {},          // { qid: [индексы выбранных] }
  current: 0            // индекс текущего вопроса
};

// ============ УТИЛИТЫ ============
const $ = (sel) => document.querySelector(sel);

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
      startTest(pickQuestions(() => true));
    } else {
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
    b.textContent = item.name;
    b.addEventListener("click", () => {
      let pred;
      if (state.mode === "bank") pred = q => q.type === item.id;
      if (state.mode === "sr") pred = q => q.sr.includes(item.id);
      if (state.mode === "topic") pred = q => q.topic === item.id;
      const qs = pickQuestions(pred);
      if (qs.length === 0) {
        alert("По этому фильтру пока нет заданий для выбранного уровня.");
        return;
      }
      startTest(qs);
    });
    list.appendChild(b);
  });

  show("picker");
}

// ============ ТЕСТ ============
function startTest(questions) {
  state.questions = questions;
  state.answers = {};
  state.current = 0;
  renderTest();
  show("test");
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
    const code = document.createElement("div");
    code.className = "question-code";
    code.textContent = q.code;
    area.appendChild(code);
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
    label.appendChild(document.createTextNode(opt));
    area.appendChild(label);
  });

  $("#btn-prev").disabled = state.current === 0;
  $("#btn-next").disabled = state.current === state.questions.length - 1;
}

$("#btn-prev").addEventListener("click", () => { state.current--; renderTest(); });
$("#btn-next").addEventListener("click", () => { state.current++; renderTest(); });

// Проверка
$("#btn-check").addEventListener("click", () => {
  renderResults();
  show("results");
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
});

// Кнопки «назад»
document.querySelectorAll("[data-back]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.back;
    if (target === "home") show("home");
    if (target === "menu") show("menu");
  });
});

// ============ СТАРТ ============
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if (user) $("#username").textContent = user.first_name;
}