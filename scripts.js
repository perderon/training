const QUESTIONS = [
  { image: 'Зелень.png', answer: 'ЗЕЛЕНЬ', prompt: 'Напечатай: ЗЕЛЕНЬ' },
  { image: 'Ашан.png', answer: 'АШАН', prompt: 'Напечатай: АШАН' },
  { image: 'Тюмень.png', answer: 'ТЮМЕНЬ', prompt: 'Напечатай: ТЮМЕНЬ' },
  { image: 'Каток2.png', answer: 'КАТОК', prompt: 'Напечатай: КАТОК' },
  { image: 'Каток.png', answer: 'КАТОК', prompt: 'Напечатай: КАТОК' }
];
const STORAGE_KEY = 'pictureTrainerRun';
const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const isResultsPage = location.pathname.endsWith('answers.html');

let trainerState = loadTrainerState();
document.querySelector('.close-button').addEventListener('click', restartTrainer);

if (isResultsPage && !trainerState) {
  location.replace('index.html');
} else {
  trainerState ||= createTrainerState();
  isResultsPage ? renderResults() : renderQuiz();
}

function loadTrainerState() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function createTrainerState() {
  const questionOrder = QUESTIONS.map((_, index) => index);

  for (let index = questionOrder.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [questionOrder[index], questionOrder[randomIndex]] = [questionOrder[randomIndex], questionOrder[index]];
  }

  const newTrainerState = { questionOrder, answers: {}, lastUnlockedPage: 0, currentPage: 0 };
  saveTrainerState(newTrainerState);
  return newTrainerState;
}

function saveTrainerState(currentTrainerState = trainerState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentTrainerState));
}

function getImagePath(fileName) {
  return `photo/${fileName}`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, character => HTML_ENTITIES[character]);
}

function restartTrainer() {
  sessionStorage.removeItem(STORAGE_KEY);
  location.href = 'index.html';
}

function renderQuiz() {
  renderPageNavigation();

  const questionId = trainerState.questionOrder[trainerState.currentPage];
  const question = QUESTIONS[questionId];
  const savedAnswer = escapeHtml(trainerState.answers[questionId] || '');
  const quizContent = document.querySelector('#quiz-content');

  quizContent.innerHTML = `
    <img class="question-image" src="${getImagePath(question.image)}" alt="Задание ${trainerState.currentPage + 1}">
    <form class="answer-form" autocomplete="off">
      <label class="answer-label" for="answer-input">${question.prompt}</label>
      <div class="answer-row">
        <input class="answer-input" id="answer-input" name="answer" type="text" value="${savedAnswer}" required>
        <button class="submit-button" type="submit" aria-label="Подтвердить ответ">✔</button>
      </div>
    </form>
    <div class="progress"><span style="width:${getProgressPercent()}%"></span></div>
  `;

  quizContent.querySelector('.answer-form').addEventListener('submit', submitAnswer);
}

function renderPageNavigation() {
  const pageNavigation = document.querySelector('#question-nav');

  pageNavigation.innerHTML = trainerState.questionOrder.map((_, index) => `
    <button class="page-button ${index === trainerState.currentPage ? 'is-current' : ''}"
      data-page="${index}" ${index > trainerState.lastUnlockedPage ? 'disabled' : ''}>${index + 1}</button>
  `).join('');

  pageNavigation.querySelectorAll('button:not(:disabled)').forEach(button => {
    button.addEventListener('click', () => {
      trainerState.currentPage = Number(button.dataset.page);
      saveTrainerState();
      renderQuiz();
    });
  });
}

function getProgressPercent() {
  return ((trainerState.currentPage + 1) / QUESTIONS.length) * 100;
}

function submitAnswer(event) {
  event.preventDefault();

  const answer = document.querySelector('.answer-input').value.trim();
  if (!answer) return;

  const questionId = trainerState.questionOrder[trainerState.currentPage];
  trainerState.answers[questionId] = answer;
  trainerState.lastUnlockedPage = Math.max(trainerState.lastUnlockedPage, trainerState.currentPage + 1);

  if (trainerState.currentPage === QUESTIONS.length - 1) {
    saveTrainerState();
    location.href = 'answers.html';
    return;
  }

  trainerState.currentPage++;
  saveTrainerState();
  renderQuiz();
}

function renderResults() {
  const answersBody = document.querySelector('#answers-body');
  answersBody.innerHTML = trainerState.questionOrder.map(renderResultRow).join('');

  const correctCount = trainerState.questionOrder.filter(questionId =>
    trainerState.answers[questionId]?.trim() === QUESTIONS[questionId].answer
  ).length;

  document.querySelector('#results-summary').textContent =
    `Правильных ответов: ${correctCount} из ${QUESTIONS.length}`;
}

function renderResultRow(questionId, index) {
  const question = QUESTIONS[questionId];
  const userAnswer = trainerState.answers[questionId] || '';
  const isCorrect = userAnswer.trim() === question.answer;
  const resultIcon = isCorrect ? '✔' : '✖';

  return `
    <tr>
      <td>${index + 1}</td>
      <td><img class="table-image" src="${getImagePath(question.image)}" alt=""></td>
      <td>${question.answer}</td>
      <td>${escapeHtml(userAnswer)}</td>
      <td class="result-icon ${isCorrect ? 'is-correct' : 'is-incorrect'}">${resultIcon}</td>
    </tr>
  `;
}
