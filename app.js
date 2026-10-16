const STORAGE_KEY = 'study-again-v1';
const SOURCE = 'https://openstax.org/books/prealgebra-2e/pages/4-5-add-and-subtract-fractions-with-different-denominators';
const SAMPLE = {
  id: 'fractions-unlike', title: 'Adding fractions with different denominators',
  source: SOURCE, sourceName: 'OpenStax · Prealgebra 2e, section 4.5',
  note: 'To add fractions with different denominators, first rewrite them using a common denominator. Then add the numerators and keep that denominator. For example, 1/2 + 1/3 becomes 3/6 + 2/6 = 5/6.',
  kind: 'quiz', createdAt: 'sample', lastStudied: null, dueAt: null, attempts: 0, bestScore: null,
  questions: [
    { prompt: 'What is the first step when adding 1/2 and 1/3?', options: ['Add 2 and 3', 'Find a common denominator', 'Multiply the numerators'], answer: 1, explanation: 'The pieces need to be the same size before you add them. Six works as a common denominator.' },
    { prompt: 'What is 1/2 + 1/3?', options: ['2/5', '5/6', '2/6'], answer: 1, explanation: '1/2 = 3/6 and 1/3 = 2/6, so the sum is 5/6.' },
    { prompt: 'What is 1/4 + 1/2?', options: ['2/6', '3/4', '1/8'], answer: 1, explanation: 'Rewrite 1/2 as 2/4. Then 1/4 + 2/4 = 3/4.' },
  ]
};
const SAMPLES = [
  {
    id: 'fractions-common', title: 'Adding fractions with the same denominator',
    source: 'https://openstax.org/books/prealgebra-2e/pages/4-4-add-and-subtract-fractions-with-common-denominators',
    sourceName: 'OpenStax · Prealgebra 2e, section 4.4',
    note: 'When fractions have the same denominator, add the numerators and keep the denominator. For example, 1/8 + 4/8 = 5/8. Simplify the result when possible.',
    kind: 'quiz', createdAt: 'sample', lastStudied: null, dueAt: null, attempts: 0, bestScore: null,
    questions: [
      { prompt: 'What stays the same when you add 1/8 + 4/8?', options: ['The denominator', 'The numerator', 'Both numbers'], answer: 0, explanation: 'The eighths are the same size, so keep 8 as the denominator.' },
      { prompt: 'What is 2/7 + 3/7?', options: ['5/14', '5/7', '6/7'], answer: 1, explanation: 'Add the numerators: 2 + 3 = 5. Keep the denominator 7.' },
      { prompt: 'What is 3/10 + 2/10?', options: ['1/2', '5/20', '6/10'], answer: 0, explanation: 'The sum is 5/10, which simplifies to 1/2.' },
    ]
  },
  SAMPLE,
  {
    id: 'fractions-multiply', title: 'Multiplying fractions',
    source: 'https://openstax.org/books/prealgebra-2e/pages/4-2-multiply-and-divide-fractions',
    sourceName: 'OpenStax · Prealgebra 2e, section 4.2',
    note: 'To multiply two fractions, multiply the numerators and multiply the denominators, then simplify. For example, 1/2 × 3/4 = 3/8.',
    kind: 'quiz', createdAt: 'sample', lastStudied: null, dueAt: null, attempts: 0, bestScore: null,
    questions: [
      { prompt: 'How do you multiply 1/2 × 3/4?', options: ['Add the denominators', 'Multiply the numerators and denominators', 'Find a common denominator'], answer: 1, explanation: 'Multiply across the top and across the bottom: 1 × 3 over 2 × 4.' },
      { prompt: 'What is 1/2 × 3/4?', options: ['3/8', '4/6', '3/6'], answer: 0, explanation: '1 × 3 = 3 and 2 × 4 = 8, so the product is 3/8.' },
      { prompt: 'What is 2/3 × 3/4 in simplest form?', options: ['6/12', '5/7', '1/2'], answer: 2, explanation: 'The product is 6/12, which simplifies to 1/2.' },
    ]
  }
];
const main = document.querySelector('#main');
const dialog = document.querySelector('#add-dialog');
const toast = document.querySelector('#toast');
let state = loadState();
let view = 'home';
let currentId = null;
let session = null;
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.lessons) && saved.lessons.every(validLesson)) {
      const existing = new Set(saved.lessons.map(item => item.id));
      for (const sample of SAMPLES) if (!existing.has(sample.id)) saved.lessons.push({ ...sample });
      return saved;
    }
  } catch { /* Start fresh if local data is damaged. */ }
  return { lessons: SAMPLES.map(item => ({ ...item })), sessions: [] };
}
function validLesson(item) {
  return item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.source === 'string' && typeof item.note === 'string' && (item.kind === 'quiz' || item.kind === 'recall');
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function safeUrl(value) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : '#'; } catch { return '#'; } }
function lesson(id) { return state.lessons.find(item => item.id === id); }
function dateLabel(date) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(date)); }
function isDue(item) { return !item.dueAt || new Date(item.dueAt).getTime() <= Date.now(); }
function dueText(item) { return !item.attempts ? 'Ready to start' : isDue(item) ? 'Ready to review' : `Review ${dateLabel(item.dueAt)}`; }
function sourceHost(item) { try { return new URL(item.source).hostname.replace(/^www\./, ''); } catch { return 'Your source'; } }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200); }
function setView(next, id) { view = next; currentId = id ?? null; render(); window.scrollTo({ top: 0 }); }
function row(item) { return `<article class="lesson-row"><div class="lesson-symbol" aria-hidden="true">${item.kind === 'quiz' ? '⅟' : '▤'}</div><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(sourceHost(item))} &nbsp; <span class="pill ${isDue(item) ? 'due' : ''}">${escapeHtml(dueText(item))}</span></p></div><button class="lesson-action" data-open="${escapeHtml(item.id)}">Open lesson</button></article>`; }
function header(eyebrow, title, subtitle) { return `<p class="page-eyebrow">${eyebrow}</p><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p>`; }
function renderHome() {
  const due = state.lessons.filter(isDue);
  const featured = due.find(item => item.id === 'fractions-common') ?? due[0] ?? state.lessons[0];
  const reviewLabel = featured.attempts ? (isDue(featured) ? 'Due for review' : `Next review ${dateLabel(featured.dueAt)}`) : 'Start here';
  main.innerHTML = `<div class="home-heading"><div><p class="page-eyebrow">Your study desk</p><h1 class="page-title">Today</h1><p class="page-subtitle">One lesson at a time. Your notes and progress stay on this device.</p></div><p class="home-date">${new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p></div>
  <div class="desk-layout"><section class="desk-primary"><div class="desk-overline"><span class="desk-dot" aria-hidden="true"></span>${escapeHtml(reviewLabel)}</div><h2>${escapeHtml(featured.title)}</h2><p class="desk-summary">${escapeHtml(featured.note)}</p><div class="desk-footer"><span>Source: ${escapeHtml(featured.sourceName ?? sourceHost(featured))}</span><button class="button-primary" data-open="${escapeHtml(featured.id)}">Open lesson</button></div></section>
  <aside class="desk-aside"><p class="aside-label">Your library</p><strong>${state.lessons.length}</strong><p>saved ${state.lessons.length === 1 ? 'lesson' : 'lessons'}</p><div class="aside-rule"></div><p class="aside-help">Have something new to study?</p><button class="text-button" data-action="add">Save a lesson</button></aside></div>
  <div class="section-head"><h2>Fractions practice set</h2><button class="text-button" data-view="library">View library</button></div><div class="lesson-list">${SAMPLES.map(sample => row(lesson(sample.id) ?? sample)).join('')}</div><p class="path-note">Three short lessons from OpenStax. Start anywhere and return to a topic when it is due.</p>`;
}
function renderLibrary() {
  main.innerHTML = `${header('Your library', 'Saved lessons', 'Your sources, notes, and review dates in one place.')}
  <div class="library-tools"><span class="library-count">${state.lessons.length} saved ${state.lessons.length === 1 ? 'lesson' : 'lessons'}</span><button class="button-primary" data-action="add">+ Save a lesson</button></div><div class="lesson-list">${state.lessons.length ? state.lessons.map(row).join('') : '<div class="empty-state"><h3>No lessons yet</h3><p>Save a source and a note to begin.</p></div>'}</div>`;
}
function renderDetail() {
  const item = lesson(currentId); if (!item) return setView('library');
  main.innerHTML = `<button class="back-button" data-view="library">← My library</button><div class="detail-head"><div>${header(item.kind === 'quiz' ? 'GUIDED LESSON' : 'YOUR SAVED LESSON', escapeHtml(item.title), dueText(item))}</div></div>
  <div class="detail-grid"><section class="paper-card"><h2>The idea to remember</h2><p class="lesson-note">${escapeHtml(item.note)}</p><div class="source-label">ORIGINAL SOURCE</div><a class="source-link" href="${escapeHtml(safeUrl(item.source))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.sourceName ?? sourceHost(item))} ↗</a>${item.kind === 'quiz' ? '<p class="attribution">Adapted from OpenStax, <em>Prealgebra 2e</em>, © Rice University. <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a>.</p>' : '<p class="attribution">This note was added by you. Check its original source for accuracy.</p>'}</section><aside class="side-note"><span class="pill ${isDue(item) ? 'due' : ''}">${escapeHtml(dueText(item))}</span><h2>Ready to practise?</h2><p>${item.kind === 'quiz' ? 'Three quick questions will check what you remember.' : 'Answer three recall prompts, then check against your note.'}</p><button class="button-primary" data-study="${escapeHtml(item.id)}">Start practice</button></aside></div>`;
}
function startStudy(id) { const item = lesson(id); if (!item) return; currentId = id; const sequence = item.kind === 'quiz' ? [...(item.missed ?? []), ...[0, 1, 2].filter(index => !(item.missed ?? []).includes(index))] : [0, 1, 2]; session = { index: 0, sequence, answers: [], selected: null, checked: false, reflection: '' }; view = 'study'; render(); }
function renderStudy() {
  const item = lesson(currentId); if (!item || !session) return setView('library');
  const i = session.index, total = 3;
  const question = item.kind === 'quiz' ? item.questions[session.sequence[i]] : [
    'Without looking, what is the main idea of this lesson?',
    'Where could you use this idea in a question or real situation?',
    'What part do you need to revisit next time?'
  ][i];
  const answers = item.kind === 'quiz' ? `<div class="answer-list" role="group" aria-label="Answer choices">${question.options.map((option, index) => `<button class="answer-option ${session.selected === index ? 'selected' : ''} ${session.checked && index === question.answer ? 'correct' : ''} ${session.checked && session.selected === index && index !== question.answer ? 'incorrect' : ''}" data-answer="${index}" aria-pressed="${session.selected === index}" ${session.checked ? 'disabled' : ''}><span class="answer-letter">${'ABC'[index]}</span>${escapeHtml(option)}</button>`).join('')}</div>${session.checked ? `<div class="feedback ${session.selected === question.answer ? '' : 'wrong'}" role="status"><strong>${session.selected === question.answer ? 'That’s right.' : 'Not quite yet.'}</strong> ${escapeHtml(question.explanation)}</div>` : ''}` : `<textarea class="recall-input" id="recall-answer" aria-label="Your answer" placeholder="Write what you remember…" ${session.checked ? 'disabled' : ''}>${escapeHtml(session.reflection)}</textarea>${session.checked ? `<div class="feedback" role="status"><strong>Compare with your note:</strong><p class="reflection">${escapeHtml(item.note)}</p><label class="checkline"><input type="checkbox" id="recall-check" ${session.selected ? 'checked' : ''}> My answer covered the main idea</label></div>` : ''}`;
  main.innerHTML = `<div class="study-layout"><button class="back-button" data-open="${escapeHtml(item.id)}">← Leave session</button><p class="page-eyebrow">${escapeHtml(item.title)}</p><div class="progress-track" role="progressbar" aria-label="Session progress" aria-valuenow="${i}" aria-valuemin="0" aria-valuemax="${total}"><div class="progress-fill" style="width:${(i / total) * 100}%"></div></div><section class="question-card"><span class="pill">Question ${i + 1} of ${total}</span><h2 id="question-heading" tabindex="-1">${escapeHtml(item.kind === 'quiz' ? question.prompt : question)}</h2>${answers}<div class="question-actions"><button class="button-primary" data-action="${session.checked ? 'next' : 'check'}" ${!session.checked && item.kind === 'quiz' && session.selected === null ? 'disabled' : ''}>${session.checked ? i === 2 ? 'Finish session' : 'Next question' : item.kind === 'quiz' ? 'Check answer' : 'Show my note'}</button></div></section></div>`;
  if (item.kind === 'recall' && !session.checked) document.querySelector('#recall-answer').addEventListener('input', event => { session.reflection = event.target.value; });
}
function checkAnswer() {
  const item = lesson(currentId);
  if (item.kind === 'recall') { if (!session.reflection.trim()) { showToast('Write a thought before checking your note.'); return; } }
  else if (session.selected === null) return;
  session.checked = true; render(); document.querySelector('[data-action="next"]')?.focus();
}
function nextQuestion() {
  const item = lesson(currentId);
  const correct = item.kind === 'quiz' ? session.selected === item.questions[session.sequence[session.index]].answer : !!session.selected;
  session.answers.push({ correct, questionIndex: session.sequence[session.index], prompt: item.kind === 'quiz' ? item.questions[session.sequence[session.index]].prompt : `Recall prompt ${session.index + 1}` });
  if (session.index < 2) { session.index++; session.selected = null; session.checked = false; session.reflection = ''; render(); document.querySelector('#question-heading')?.focus(); return; }
  const score = session.answers.filter(answer => answer.correct).length;
  const days = score === 3 ? 3 : 1;
  item.attempts = (item.attempts || 0) + 1;
  item.bestScore = Math.max(item.bestScore ?? 0, score);
  if (item.kind === 'quiz') item.missed = session.answers.filter(answer => !answer.correct).map(answer => answer.questionIndex);
  item.lastStudied = new Date().toISOString();
  item.dueAt = new Date(Date.now() + days * 86400000).toISOString();
  state.sessions.push({ lessonId: item.id, at: item.lastStudied, score, total: 3 });
  saveState(); view = 'result'; render();
}
function renderResult() {
  const item = lesson(currentId); if (!item || !session) return setView('home');
  const score = session.answers.filter(answer => answer.correct).length;
  main.innerHTML = `<div class="study-layout"><p class="page-eyebrow">Practice finished</p><h1 class="page-title">Session complete</h1><p class="page-subtitle">Here’s what to review next.</p><div class="question-card" style="margin-top:28px"><div class="result-score">${score}<span style="font-size:30px">/3</span></div><p>${item.kind === 'quiz' ? 'questions correct' : 'ideas you felt confident about'}</p><div class="result-summary">${session.answers.map(answer => `<div class="result-item"><span>${escapeHtml(answer.prompt)}</span><strong>${answer.correct ? 'Got it' : 'Review'}</strong></div>`).join('')}</div><p class="progress-note">Next suggested review: ${dateLabel(item.dueAt)}. ${item.kind === 'quiz' && score < 3 ? 'The questions you missed will appear first next time.' : 'You can practise sooner from your library.'}</p><button class="button-primary" data-view="home">Back to Today</button></div></div>`;
}
function renderProgress() {
  const sessions = state.sessions.slice().reverse();
  const reviewed = new Set(sessions.map(item => item.lessonId)).size;
  const totalCorrect = sessions.reduce((sum, item) => sum + item.score, 0);
  main.innerHTML = `${header('Practice history', 'Progress', 'Completed sessions and suggested review dates.')}
  <div class="stats-grid"><div class="stat"><strong>${sessions.length}</strong><span>sessions completed</span></div><div class="stat"><strong>${reviewed}</strong><span>lessons practised</span></div><div class="stat"><strong>${totalCorrect}</strong><span>answers you felt sure of</span></div></div>
  <div class="section-head"><h2>Recent sessions</h2></div>${sessions.length ? `<div class="lesson-list">${sessions.slice(0, 8).map(entry => `<div class="lesson-row"><div class="lesson-symbol" aria-hidden="true">✓</div><div><h3>${escapeHtml(lesson(entry.lessonId)?.title ?? 'Saved lesson')}</h3><p>${dateLabel(entry.at)} · ${entry.score} of ${entry.total} confident or correct</p></div></div>`).join('')}</div>` : '<div class="empty-state"><h3>Your first session starts here</h3><p>Practise a saved lesson and your progress will appear here.</p><button class="button-primary" data-view="library">Open library</button></div>'}
  <p class="progress-note">Your data is stored only in this browser. Clearing browser data removes it.</p><button class="reset-button" data-action="reset">Reset demo data</button>`;
}
function render() {
  document.querySelectorAll('.nav-item, .mobile-nav button').forEach(button => button.classList.toggle('active', button.dataset.view === (['study', 'result', 'detail'].includes(view) ? 'library' : view)));
  ({ home: renderHome, library: renderLibrary, detail: renderDetail, study: renderStudy, result: renderResult, progress: renderProgress })[view]();
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.view) setView(button.dataset.view);
  else if (button.dataset.open) setView('detail', button.dataset.open);
  else if (button.dataset.study) startStudy(button.dataset.study);
  else if (button.dataset.answer !== undefined) { session.selected = Number(button.dataset.answer); render(); document.querySelector(`[data-answer="${session.selected}"]`)?.focus(); }
  else if (button.dataset.action === 'add') dialog.showModal();
  else if (button.dataset.action === 'check') checkAnswer();
  else if (button.dataset.action === 'next') nextQuestion();
  else if (button.dataset.action === 'reset') { if (confirm('Reset all saved lessons and progress in this browser?')) { state = { lessons: SAMPLES.map(item => ({ ...item })), sessions: [] }; saveState(); setView('home'); showToast('Demo data reset.'); } }
});
document.addEventListener('change', event => { if (event.target.id === 'recall-check' && session) session.selected = event.target.checked; });
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); setView('home'); });
document.querySelector('#add-top').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#lesson-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const title = form.elements.namedItem('title').value.trim(), note = form.elements.namedItem('note').value.trim();
  const url = safeUrl(form.elements.namedItem('url').value.trim());
  const error = document.querySelector('#form-error');
  if (!title || !note || url === '#') { error.textContent = 'Add a title, a note, and an http or https source link.'; error.hidden = false; return; }
  const item = { id: crypto.randomUUID(), title, note, source: url, kind: 'recall', createdAt: new Date().toISOString(), lastStudied: null, dueAt: null, attempts: 0, bestScore: null };
  state.lessons.unshift(item); saveState(); form.reset(); error.hidden = true; dialog.close(); setView('detail', item.id); showToast('Lesson saved for offline study.');
});
function updateConnection() { document.querySelector('#connection-label').textContent = navigator.onLine ? 'Ready to study offline' : 'Offline — saved lessons work'; }
window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection); updateConnection();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
render();
