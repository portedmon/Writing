/**
 * IB Daily Command Terms Writing — Minimalist High-Density Engine
 */

// Global State
let appData = null;
let currentDayIndex = 0;

// Timer State
let timerDurationSeconds = 15 * 60;
let timerRemainingSeconds = timerDurationSeconds;
let timerInterval = null;
let isTimerRunning = false;

// Fallback Data
const FALLBACK_DATA = {
  lastUpdated: new Date().toISOString(),
  totalDays: 1,
  days: [
    {
      day: 1,
      date: "2026-10-31",
      tasks: [
        {
          id: "day1-task1",
          subject: "Humanities",
          subCategory: "Geography & Urban Economics",
          commandTerm: "ANALYZE",
          targetWordCount: "120-150 words",
          prompt: "Analyze the relationship between median household income, transit access frequency, and car ownership rates across the four city zones. In your analysis, identify key correlations, note anomalies, and discuss the broader socio-economic implications.",
          stimulus: {
            title: "Public Transit Frequency vs. Household Socio-Economic Indicators (Metro Region)",
            headers: ["Zone Classification", "Median Household Income", "Avg. Walk to Transit", "Transit Departures / hr", "Car Ownership Rate"],
            rows: [
              ["Zone A (Urban Core)", "$78,500", "4 minutes", "24 departures", "38%"],
              ["Zone B (Inner Ring)", "$61,200", "7 minutes", "14 departures", "64%"],
              ["Zone C (Outer Ring)", "$39,400", "18 minutes", "3 departures", "81%"],
              ["Zone D (Suburban East)", "$96,000", "22 minutes", "2 departures", "95%"]
            ],
            notes: "Context: Zone C accommodates 46% of the city's essential shift-workers who commute into the Urban Core daily."
          },
          requiredVocab: [
            "The data clearly demonstrates an inverse correlation between...",
            "A notable divergence occurs when contrasting Zone C and Zone D, where...",
            "Consequently, the inadequate transit provision in Zone C disproportionately exacerbates structural inequality..."
          ],
          structureRule: "Avoid 'I think' or personal opinions. Construct a 3-step analytical framework: 1. Identify primary correlations across variables; 2. Contrast anomalies (Zone C forced car dependence vs. Zone D affluent suburban choice); 3. Deduce structural socio-economic implications.",
          bannedWords: ["I think", "In my opinion", "because", "bad", "poor", "so"]
        },
        {
          id: "day1-task2",
          subject: "Sciences",
          subCategory: "Environmental Science & Chemistry",
          commandTerm: "JUSTIFY",
          targetWordCount: "120-150 words",
          prompt: "Justify the selection of Method B (Subsurface Permeable Bio-Barriers) over Method A and Method C as the optimal municipal intervention for agricultural runoff contamination, taking into account efficacy, environmental footprint, and municipal constraints.",
          stimulus: {
            title: "Performance and Resource Trial Data: Nitrate Remediation Technologies",
            headers: ["Evaluation Parameter", "Method A (Chemical)", "Method B (Bio-Barriers)", "Method C (Wetlands)"],
            rows: [
              ["Nitrate Removal Efficiency", "94%", "89%", "76%"],
              ["Annual Operating Cost", "$165,000 / yr", "$38,000 / yr", "$52,000 / yr"],
              ["Land Footprint Required", "< 0.2 ha", "< 0.5 ha (subsurface)", "14.5 hectares"],
              ["Secondary Risk", "Chemical sludge disposal", "Zero hazardous byproduct", "Mosquito vector breeding"],
              ["Long-term Maintenance", "High (daily chemical dosing)", "Low (self-sustaining >6 yrs)", "Moderate (harvesting)"]
            ],
            notes: "Constraints: Municipal annual budget cap is $60,000. Land available adjacent to watershed is restricted to 2.0 hectares."
          },
          requiredVocab: [
            "Method B is conclusively the most viable remediation strategy because...",
            "Although Method A achieves marginally higher removal efficiency, it is rendered unfeasible by...",
            "Furthermore, Method C violates the spatial constraint of 2.0 hectares, requiring..."
          ],
          structureRule: "Avoid 'I think' or personal opinions. Construct a 3-step validation framework: State clear selection of Method B, provide quantitative trade-off metrics (efficiency vs. cost/land caps), and systematically refute Method A (cost overrun) and Method C (spatial violation).",
          bannedWords: ["I like", "I think", "best", "cheap", "because", "bad"]
        }
      ]
    }
  ]
};

// DOM Elements
const drillsContainer = document.getElementById('drillsContainer');
const currentDayBadge = document.getElementById('currentDayBadge');
const currentDateLabel = document.getElementById('currentDateLabel');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const todayJumpBtn = document.getElementById('todayJumpBtn');
const printDayBtn = document.getElementById('printDayBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toastEl = document.getElementById('toast');

// Timer DOM Elements
const timerDisplay = document.getElementById('timerDisplay');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const playIcon = timerToggleBtn.querySelector('.play-icon');
const pauseIcon = timerToggleBtn.querySelector('.pause-icon');

// Theme DOM Elements
const sunIcon = themeToggleBtn.querySelector('.sun-icon');
const moonIcon = themeToggleBtn.querySelector('.moon-icon');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initTimer();
  setupEventListeners();
  await loadData();
});

// Load Prompts Data
async function loadData() {
  try {
    const response = await fetch('data/prompts.json?nocache=' + Date.now());
    if (!response.ok) throw new Error('Network response was not ok');
    appData = await response.json();
  } catch (err) {
    console.warn('Could not fetch data/prompts.json, using fallback data:', err);
    appData = FALLBACK_DATA;
  }

  if (!appData.days || appData.days.length === 0) {
    appData = FALLBACK_DATA;
  }

  // Set to latest day by default
  currentDayIndex = appData.days.length - 1;
  renderCurrentDay();
}

// Render the selected day's drills
function renderCurrentDay() {
  const dayObj = appData.days[currentDayIndex];
  if (!dayObj) return;

  // Update Navigation UI
  currentDayBadge.textContent = `Day ${dayObj.day}`;
  currentDateLabel.textContent = dayObj.date;

  prevDayBtn.disabled = currentDayIndex <= 0;
  nextDayBtn.disabled = currentDayIndex >= appData.days.length - 1;

  const tasks = dayObj.tasks || [];
  let html = '';

  tasks.forEach((task, idx) => {
    html += renderDrillHtml(task, dayObj.day, idx + 1);
    if (idx < tasks.length - 1) {
      // Cut line separator between Task 1 and Task 2
      html += `
        <div class="cut-separator">
          <span>✂️ CUT ALONG DOTTED LINE TO PASTE INTO NOTEBOOK ✂️</span>
        </div>
      `;
    }
  });

  drillsContainer.innerHTML = html;
  attachVocabClickListeners();
}

// Render a single drill in the exact style of the user-provided sample PDF
function renderDrillHtml(task, dayNum, taskNum) {
  const cmd = escapeHtml(task.commandTerm || 'ANALYZE').toUpperCase();
  const subjectText = escapeHtml(task.subject) + (task.subCategory ? ` / ${escapeHtml(task.subCategory)}` : '') + ' focus';

  // Stimulus Table (if present)
  let stimulusHtml = '';
  if (task.stimulus && task.stimulus.headers && task.stimulus.rows) {
    const headers = task.stimulus.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
    const rows = task.stimulus.rows.map(r => `
      <tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>
    `).join('');

    stimulusHtml = `
      <div class="drill-row row-stimulus">
        <div class="stimulus-caption">Data Source: ${escapeHtml(task.stimulus.title || 'Trial Data')}</div>
        <div class="table-wrapper">
          <table class="dense-table">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${task.stimulus.notes ? `<div class="stimulus-note">Context/Constraints: ${escapeHtml(task.stimulus.notes)}</div>` : ''}
      </div>
    `;
  }

  // Required Vocab (List)
  let vocabItems = [];
  if (task.requiredVocab && Array.isArray(task.requiredVocab)) {
    vocabItems = task.requiredVocab;
  } else if (task.scaffolding?.sentenceStarters) {
    vocabItems = task.scaffolding.sentenceStarters;
  }

  const vocabListHtml = vocabItems.map(item => `
    <li data-text="${escapeHtml(item)}" title="Click to copy">• ${escapeHtml(item)}</li>
  `).join('');

  // Structure Rule
  let structureRule = task.structureRule || '';
  if (!structureRule && task.scaffolding?.recommendedStructure) {
    structureRule = task.scaffolding.recommendedStructure.join(' -> ');
  }

  // Banned Words
  let bannedWordsStr = '';
  if (task.bannedWords && Array.isArray(task.bannedWords)) {
    bannedWordsStr = task.bannedWords.join(', ');
  } else if (task.scaffolding?.wordsToAvoid) {
    bannedWordsStr = task.scaffolding.wordsToAvoid.join(', ');
  }

  return `
    <section class="drill-wrapper" id="${escapeHtml(task.id || `drill-${taskNum}`)}">
      <div class="drill-heading">
        Day ${dayNum}: ${cmd} (${subjectText})
      </div>

      <div class="drill-box">
        <!-- Prompt Row -->
        <div class="drill-row row-prompt">
          <strong>Prompt:</strong>
          <span class="prompt-content">${escapeHtml(task.prompt)}</span>
        </div>

        <!-- Stimulus Table Row (if applicable) -->
        ${stimulusHtml}

        <!-- Required Vocab Row -->
        <div class="drill-row row-vocab">
          <strong>Required Vocab (Use at least 1):</strong>
          <ul class="vocab-list">
            ${vocabListHtml}
          </ul>
        </div>

        <!-- Structure Rule Row -->
        <div class="drill-row row-structure">
          <strong>Structure Rule:</strong>
          <div class="structure-text">${escapeHtml(structureRule)}</div>
        </div>

        <!-- Banned Words Row -->
        <div class="drill-row row-banned">
          <strong>Banned Words:</strong>
          <span class="banned-text">${escapeHtml(bannedWordsStr)}</span>
        </div>

        <!-- Execution Record Row -->
        <div class="drill-row row-record">
          <span class="record-item">Execution Record: Date: ____ / ____</span>
          <span>|</span>
          <span class="record-item">Time Elapsed: _____ min</span>
          <span>|</span>
          <span class="record-item">Word Count: _____ words</span>
        </div>
      </div>
    </section>
  `;
}

// Attach click-to-copy listeners on vocabulary items
function attachVocabClickListeners() {
  document.querySelectorAll('.vocab-list li').forEach(item => {
    item.addEventListener('click', () => {
      const text = item.getAttribute('data-text');
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(`Copied: "${text.substring(0, 32)}..."`);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });
}

// Event Listeners
function setupEventListeners() {
  // Day Navigation
  prevDayBtn.addEventListener('click', () => {
    if (currentDayIndex > 0) {
      currentDayIndex--;
      renderCurrentDay();
    }
  });

  nextDayBtn.addEventListener('click', () => {
    if (currentDayIndex < appData.days.length - 1) {
      currentDayIndex++;
      renderCurrentDay();
    }
  });

  todayJumpBtn.addEventListener('click', () => {
    currentDayIndex = appData.days.length - 1;
    renderCurrentDay();
  });

  // Print A4 Button (Instant browser print)
  printDayBtn.addEventListener('click', () => {
    window.print();
  });

  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// --------------------------------------------------------------------------
// 15-MINUTE PRACTICE TIMER
// --------------------------------------------------------------------------

function initTimer() {
  updateTimerDisplay();

  timerToggleBtn.addEventListener('click', () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  timerResetBtn.addEventListener('click', () => {
    resetTimer();
  });
}

function startTimer() {
  if (timerRemainingSeconds <= 0) {
    timerRemainingSeconds = timerDurationSeconds;
  }
  isTimerRunning = true;
  playIcon.classList.add('hidden');
  pauseIcon.classList.remove('hidden');

  timerInterval = setInterval(() => {
    if (timerRemainingSeconds > 0) {
      timerRemainingSeconds--;
      updateTimerDisplay();
    } else {
      pauseTimer();
      playBeepAlert();
      showToast('⏱️ 15 Minutes Complete! Check your response against the rules.');
    }
  }, 1000);
}

function pauseTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
}

function resetTimer() {
  pauseTimer();
  timerRemainingSeconds = timerDurationSeconds;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(timerRemainingSeconds / 60);
  const secs = timerRemainingSeconds % 60;
  timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function playBeepAlert() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {}
}

// --------------------------------------------------------------------------
// THEME SWITCHER
// --------------------------------------------------------------------------

function initTheme() {
  const savedTheme = localStorage.getItem('ib_drill_theme') || 'light';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const current = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('ib_drill_theme', newTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

// Utilities
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 2200);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str ?? '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
