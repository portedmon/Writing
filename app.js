/**
 * IB Daily Command Terms Writing — Core Application Logic
 */

// Global State
let appData = null;
let currentDayIndex = 0; // index in appData.days array
let currentTemplate = 'worksheet'; // 'worksheet' | 'notebook' | 'matrix'
let currentSubjectFilter = 'all';

// Timer State
let timerDurationSeconds = 15 * 60; // 15 mins default
let timerRemainingSeconds = timerDurationSeconds;
let timerInterval = null;
let isTimerRunning = false;

// Fallback Data in case of offline file:// protocol restriction
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
          commandTerm: "Analyze",
          commandTermDefinition: "Break down in order to bring out the essential elements or structure. (Identify parts and relationships, interpret patterns, and extract meaningful conclusions).",
          targetTimeMinutes: 15,
          targetWordCount: "120-150 words",
          mypCriterion: "Criterion D: Critical Thinking",
          title: "Urban Transit Accessibility vs. Household Income",
          prompt: "Analyze the relationship between median household income, transit access frequency, and car ownership rates across the four city zones. In your analysis, identify key correlations, note any anomalies, and discuss the broader socio-economic implications.",
          stimulusType: "table",
          stimulus: {
            title: "Public Transit Frequency vs. Household Socio-Economic Indicators (Metro Region)",
            headers: ["Zone Classification", "Median Household Income", "Avg. Walk to Transit Hub", "Transit Departures / hr (Peak)", "Car Ownership Rate"],
            rows: [
              ["Zone A (Urban Core)", "$78,500", "4 minutes", "24 departures", "38%"],
              ["Zone B (Inner Ring)", "$61,200", "7 minutes", "14 departures", "64%"],
              ["Zone C (Outer Ring)", "$39,400", "18 minutes", "3 departures", "81%"],
              ["Zone D (Suburban East)", "$96,000", "22 minutes", "2 departures", "95%"]
            ],
            notes: "Context: Zone C accommodates 46% of the city's essential shift-workers who commute into the Urban Core daily."
          },
          scaffolding: {
            recommendedStructure: [
              "1. Identification of the primary correlation (transit frequency vs. income / car dependency)",
              "2. Contrast and anomaly analysis (examine Zone C vs. Zone D: forced vs. voluntary car ownership)",
              "3. Analytical conclusion on structural inequality and economic mobility"
            ],
            sentenceStarters: [
              "The data demonstrates a distinct correlation between...",
              "A significant divergence is evident when contrasting Zone C and Zone D, as...",
              "This disparity suggests that for lower-income households, car ownership is not an asset but a...",
              "Consequently, the inadequate transit provision in Zone C exacerbates..."
            ],
            targetAcademicVocabulary: [
              "correlation", "disparity", "attributable to", "divergence", "disproportionately", "structural barrier", "infrastructure deficiency"
            ],
            wordsToAvoid: [
              "I think / In my opinion (Use: 'The data indicates' or 'It is apparent that')",
              "bad or poor (Use: 'deficient', 'suboptimal', 'insufficient')",
              "so (Use: 'consequently', 'thereby', 'hence')"
            ],
            rubricChecklist: [
              "Synthesized multiple data columns rather than reciting raw numbers isolated from context",
              "Distinguished between correlation and underlying socio-economic causation",
              "Critically evaluated the disparity between Zone C and Zone D",
              "Maintained objective, evidence-based academic register throughout"
            ]
          }
        },
        {
          id: "day1-task2",
          subject: "Sciences",
          subCategory: "Environmental Science & Chemistry",
          commandTerm: "Justify",
          commandTermDefinition: "Give valid reasons or evidence to support an answer or conclusion.",
          targetTimeMinutes: 15,
          targetWordCount: "120-150 words",
          mypCriterion: "Criterion C: Processing and Evaluating / Criterion D: Reflecting on Science Impacts",
          title: "Selection of Groundwater Nitrate Remediation Technology",
          prompt: "Justify the selection of Method B (Subsurface Permeable Bio-Barriers) over Method A and Method C as the optimal municipal intervention for agricultural runoff contamination, taking into account efficacy, environmental footprint, and municipal constraints.",
          stimulusType: "table",
          stimulus: {
            title: "Performance and Resource Trial Data: Nitrate Remediation Technologies",
            headers: ["Evaluation Parameter", "Method A (Chemical Precipitation)", "Method B (Subsurface Bio-Barriers)", "Method C (Constructed Wetlands)"],
            rows: [
              ["Nitrate Removal Efficiency", "94%", "89%", "76%"],
              ["Annual Operating Cost", "$165,000 / yr", "$38,000 / yr", "$52,000 / yr"],
              ["Land Footprint Required", "< 0.2 hectares", "< 0.5 hectares (underground)", "14.5 hectares"],
              ["Secondary Environmental Risk", "Chemical sludge disposal required", "Zero hazardous byproduct", "Mosquito vector breeding"],
              ["Long-term Maintenance", "High (daily chemical dosing)", "Low (self-sustaining >6 yrs)", "Moderate (vegetation harvesting)"]
            ],
            notes: "Constraints: Municipal annual budget cap is $60,000. Land available adjacent to watershed is restricted to 2.0 hectares."
          },
          scaffolding: {
            recommendedStructure: [
              "1. Direct stance & thesis: explicit selection of Method B framed by feasibility parameters",
              "2. Multi-criteria justification: balance of high efficiency (89%) with budgetary compliance ($38k vs $60k cap)",
              "3. Systematic refutation: demonstrate why Method A (budgetary overage) and Method C (spatial overage) fail"
            ],
            sentenceStarters: [
              "Method B is conclusively the most viable remediation strategy because...",
              "Although Method A achieves a marginally superior removal efficiency of 94%, it is rendered unfeasible by...",
              "Furthermore, Method C violates the spatial constraint of 2.0 hectares, requiring...",
              "By eliminating secondary hazardous byproducts while operating well below the $60,000 threshold, Method B balances..."
            ],
            targetAcademicVocabulary: [
              "viable", "unfeasible", "spatial constraint", "budgetary threshold", "byproduct", "remediation", "trade-off"
            ],
            wordsToAvoid: [
              "I like Method B because...",
              "It is the best (Replace with: 'presents the optimal balance of efficiency and feasibility')",
              "cheap (Replace with: 'cost-effective' or 'economically viable')"
            ],
            "rubricChecklist": [
              "Explicitly stated choice in the initial sentence without ambiguity",
              "Directly referenced and compared quantitative metrics across all three methods",
              "Addressed external constraints (budget cap & land availability) as core justification",
              "Refuted competing alternatives using concrete scientific/operational reasoning"
            ]
          }
        }
      ]
    }
  ]
};

// Document Elements
const mainContent = document.getElementById('mainContent');
const printContainer = document.getElementById('printContainer');
const currentDayLabel = document.getElementById('currentDayLabel');
const currentDateLabel = document.getElementById('currentDateLabel');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const todayJumpBtn = document.getElementById('todayJumpBtn');
const subjectFilter = document.getElementById('subjectFilter');
const templatePills = document.getElementById('templatePills');
const printBothBtn = document.getElementById('printBothBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toastEl = document.getElementById('toast');

// Timer Elements
const timerDisplay = document.getElementById('timerDisplay');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const playIcon = timerToggleBtn.querySelector('.play-icon');
const pauseIcon = timerToggleBtn.querySelector('.pause-icon');

// Theme Elements
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
    console.warn('Could not fetch data/prompts.json, using local fallback:', err);
    appData = FALLBACK_DATA;
  }

  if (!appData.days || appData.days.length === 0) {
    appData = FALLBACK_DATA;
  }

  // Set to latest day by default
  currentDayIndex = appData.days.length - 1;
  renderCurrentDay();
}

// Render the selected day's tasks
function renderCurrentDay() {
  const dayObj = appData.days[currentDayIndex];
  if (!dayObj) return;

  // Update Navigation UI
  currentDayLabel.textContent = `Day ${dayObj.day}`;
  currentDateLabel.textContent = dayObj.date;

  prevDayBtn.disabled = currentDayIndex <= 0;
  nextDayBtn.disabled = currentDayIndex >= appData.days.length - 1;

  // Filter tasks based on selected subject
  let tasksToRender = dayObj.tasks || [];
  if (currentSubjectFilter !== 'all') {
    tasksToRender = tasksToRender.filter(t => t.subject === currentSubjectFilter);
  }

  if (tasksToRender.length === 0) {
    mainContent.innerHTML = `
      <div class="empty-state">
        <p>No tasks match the filter "<strong>${escapeHtml(currentSubjectFilter)}</strong>" for Day ${dayObj.day}.</p>
        <button class="pill-btn" onclick="document.getElementById('subjectFilter').value='all'; document.getElementById('subjectFilter').dispatchEvent(new Event('change'));">Show All Subjects</button>
      </div>
    `;
    return;
  }

  // Render Grid of Tasks
  let html = `<div class="tasks-grid">`;
  tasksToRender.forEach((task, idx) => {
    html += renderTaskCard(task, dayObj, idx);
  });
  html += `</div>`;

  mainContent.innerHTML = html;
  attachTaskInteractiveListeners();
}

// Generate Screen HTML for a Task Card
function renderTaskCard(task, dayObj, index) {
  const subjectClass = `badge-subject-${task.subject.replace(/\s+/g, '-')}`;
  
  // Table Rows HTML
  let tableRowsHtml = '';
  if (task.stimulus && task.stimulus.rows) {
    tableRowsHtml = task.stimulus.rows.map(row => `
      <tr>
        ${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}
      </tr>
    `).join('');
  }

  // Table Headers HTML
  let tableHeadersHtml = '';
  if (task.stimulus && task.stimulus.headers) {
    tableHeadersHtml = `
      <tr>
        ${task.stimulus.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    `;
  }

  // Recommended Structure
  const structureHtml = (task.scaffolding?.recommendedStructure || []).map((step, i) => `
    <li>
      <span class="structure-num">Step ${i + 1}:</span>
      <span>${escapeHtml(step.replace(/^\d+\.\s*/, ''))}</span>
    </li>
  `).join('');

  // Sentence Starters
  const startersHtml = (task.scaffolding?.sentenceStarters || []).map(starter => `
    <div class="starter-item" data-text="${escapeHtml(starter)}" title="Click to copy">
      <span>${escapeHtml(starter)}</span>
      <svg class="icon starter-copy-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    </div>
  `).join('');

  // Vocab Chips
  const vocabHtml = (task.scaffolding?.targetAcademicVocabulary || []).map(v => `
    <span class="vocab-chip">${escapeHtml(v)}</span>
  `).join('');

  // Words to Avoid
  const avoidHtml = (task.scaffolding?.wordsToAvoid || []).map(item => `
    <li>❌ ${escapeHtml(item)}</li>
  `).join('');

  // Checklist
  const checklistHtml = (task.scaffolding?.rubricChecklist || []).map(item => `
    <label class="check-item">
      <input type="checkbox">
      <span>${escapeHtml(item)}</span>
    </label>
  `).join('');

  return `
    <article class="task-card" id="${escapeHtml(task.id)}">
      <div class="card-header">
        <div>
          <div class="card-meta-tags">
            <span class="badge ${subjectClass}">${escapeHtml(task.subject)}</span>
            <span class="badge badge-sub">${escapeHtml(task.subCategory || '')}</span>
            <span class="badge badge-command">Command: ${escapeHtml(task.commandTerm)}</span>
            <span class="badge badge-sub">⏱️ ${task.targetTimeMinutes || 15} mins</span>
          </div>
          <h2 class="card-title">${escapeHtml(task.title)}</h2>
        </div>
        <div class="card-print-action">
          <button class="task-print-btn" data-task-id="${escapeHtml(task.id)}" title="Print this specific worksheet as clean A4 PDF">
            <svg class="icon" viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span>Print Task</span>
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Prompt Box -->
        <div class="prompt-box">
          <div class="prompt-label">
            <span>Writing Prompt</span>
            <span>${escapeHtml(task.targetWordCount || '120-150 words')}</span>
          </div>
          <p class="prompt-text">${escapeHtml(task.prompt)}</p>
        </div>

        <!-- Stimulus Data / Table -->
        <div class="stimulus-section">
          <div class="stimulus-header">
            <span>📊 Stimulus: ${escapeHtml(task.stimulus?.title || 'Data Source')}</span>
            <span>Criterion: ${escapeHtml(task.mypCriterion || '')}</span>
          </div>
          <div class="stimulus-table-wrapper">
            <table class="stimulus-table">
              <thead>${tableHeadersHtml}</thead>
              <tbody>${tableRowsHtml}</tbody>
            </table>
          </div>
          ${task.stimulus?.notes ? `<div class="stimulus-notes">📌 ${escapeHtml(task.stimulus.notes)}</div>` : ''}
        </div>

        <!-- Command Term Strategy -->
        <div class="command-strategy-box">
          <div class="strategy-title">
            <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>IB Command Term: <strong>${escapeHtml(task.commandTerm)}</strong></span>
          </div>
          <p class="strategy-def">${escapeHtml(task.commandTermDefinition || '')}</p>
          <ul class="structure-list">
            ${structureHtml}
          </ul>
        </div>

        <!-- Scaffolding: Sentence Starters & Vocab -->
        <div class="scaffolding-section">
          <div class="section-subhead">High-Register Academic Starters (Click to copy)</div>
          <div class="starters-list">${startersHtml}</div>

          <div class="section-subhead">Target Academic Vocabulary</div>
          <div class="vocab-chips">${vocabHtml}</div>
        </div>

        <!-- Words to Avoid -->
        <div class="avoid-box">
          <div class="avoid-title">Avoid Japanese-English Habits & Casual Phrases</div>
          <ul class="avoid-list">${avoidHtml}</ul>
        </div>

        <!-- Self-Evaluation Checklist -->
        <div class="scaffolding-section">
          <div class="section-subhead">Rubric Alignment Checklist</div>
          <div class="checklist">${checklistHtml}</div>
        </div>
      </div>
    </article>
  `;
}

// Attach event listeners for dynamically rendered cards
function attachTaskInteractiveListeners() {
  // Print single task button
  document.querySelectorAll('.task-print-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = btn.getAttribute('data-task-id');
      printSingleTask(taskId);
    });
  });

  // Clickable sentence starters to copy
  document.querySelectorAll('.starter-item').forEach(item => {
    item.addEventListener('click', () => {
      const text = item.getAttribute('data-text');
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(`Copied: "${text.substring(0, 35)}..."`);
        }).catch(err => {
          console.error('Failed to copy: ', err);
        });
      }
    });
  });
}

// --------------------------------------------------------------------------
// PRINT ENGINE (Generates Clean Black & White A4 Sheets)
// --------------------------------------------------------------------------

function printSingleTask(taskId) {
  const dayObj = appData.days[currentDayIndex];
  if (!dayObj) return;

  const task = dayObj.tasks.find(t => t.id === taskId);
  if (!task) return;

  // Build print container with exactly 1 page
  printContainer.innerHTML = buildPrintPageHtml(task, dayObj, 1, 1);
  window.print();
}

function printBothTasks() {
  const dayObj = appData.days[currentDayIndex];
  if (!dayObj || !dayObj.tasks) return;

  let pagesHtml = '';
  const total = dayObj.tasks.length;
  dayObj.tasks.forEach((task, idx) => {
    pagesHtml += buildPrintPageHtml(task, dayObj, idx + 1, total);
  });

  printContainer.innerHTML = pagesHtml;
  window.print();
}

function buildPrintPageHtml(task, dayObj, pageNum, totalPages) {
  // Table Rows HTML
  let tableRowsHtml = '';
  if (task.stimulus && task.stimulus.rows) {
    tableRowsHtml = task.stimulus.rows.map(row => `
      <tr>
        ${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}
      </tr>
    `).join('');
  }

  // Table Headers HTML
  let tableHeadersHtml = '';
  if (task.stimulus && task.stimulus.headers) {
    tableHeadersHtml = `
      <tr>
        ${task.stimulus.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    `;
  }

  // Scaffolding elements
  const starters = (task.scaffolding?.sentenceStarters || []).slice(0, 3).map(s => `<li>• "${escapeHtml(s)}"</li>`).join('');
  const vocab = (task.scaffolding?.targetAcademicVocabulary || []).slice(0, 6).join('  |  ');
  const avoid = (task.scaffolding?.wordsToAvoid || []).slice(0, 2).map(a => `<li>❌ ${escapeHtml(a)}</li>`).join('');
  const checklist = (task.scaffolding?.rubricChecklist || []).map(c => `
    <div class="p-check-row">
      <span class="p-check-box"></span>
      <span>${escapeHtml(c)}</span>
    </div>
  `).join('');

  // Template Body Selection
  let templateBody = '';

  if (currentTemplate === 'worksheet') {
    // 15 Ruled lines for writing directly
    let lines = '';
    for (let i = 1; i <= 14; i++) {
      lines += `<div class="p-line"><span class="p-line-num">${i * 10}w</span></div>`;
    }
    templateBody = `
      <div class="p-ruled-container">
        <div class="p-ruled-header">
          <span>HANDWRITTEN RESPONSE AREA (${task.targetWordCount || '120-150 words'} / 15 MINS)</span>
          <span>Target Command Term: [ ${escapeHtml(task.commandTerm)} ]</span>
        </div>
        <div class="p-ruled-lines">
          ${lines}
        </div>
      </div>
    `;
  } else if (currentTemplate === 'notebook') {
    // Compact slip with cut line for notebook paste
    templateBody = `
      <div class="p-notebook-cut-zone">
        <div class="p-cut-badge">✂️ CUT ALONG THIS LINE & GLUE INTO NOTEBOOK ✂️</div>
        <div class="p-notebook-guide-box">
          <div style="font-weight: 800; font-size: 9pt; margin-bottom: 4pt;">NOTEBOOK GLUE INSTRUCTIONS:</div>
          <p style="font-size: 8.5pt; line-height: 1.4; margin-bottom: 6pt;">
            Glue this upper stimulus slip onto the top half of your notebook page. Time yourself for <strong>15 minutes</strong> on the lines below it.
            Adhere strictly to the command term <strong>${escapeHtml(task.commandTerm)}</strong>. Underline the transitional phrases used.
          </p>
          <div style="display: flex; gap: 20pt; font-size: 8pt; font-weight: 700;">
            <span>Date Pasted: ____ / ____ / ________</span>
            <span>Actual Time Taken: _____ mins</span>
            <span>Actual Word Count: _____ words</span>
          </div>
        </div>
      </div>
    `;
  } else {
    // Matrix / Detailed Analytical Checklist
    templateBody = `
      <div class="p-matrix-checklist">
        <div style="font-weight: 800; font-size: 8.5pt; text-transform: uppercase; margin-bottom: 4pt;">Detailed Evaluation & Rubric Verification Checklist</div>
        ${checklist}
        <div style="margin-top: 8pt; border-top: 0.5pt dashed #999; padding-top: 6pt; font-size: 8pt;">
          <strong>Self-Correction Notes / Word Choice Upgrades:</strong>
          <div style="height: 45pt; border-bottom: 0.5pt dotted #999; margin-top: 4pt;"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="print-page">
      <!-- Header -->
      <header class="p-header">
        <div class="p-header-left">
          <div class="p-meta-top">
            IB MYP 5 &rarr; DP Bridge  •  Day ${dayObj.day}  •  ${dayObj.date}  •  ${escapeHtml(task.subject)} (${escapeHtml(task.subCategory || '')})
          </div>
          <div class="p-title">${escapeHtml(task.title)}</div>
        </div>
        <div class="p-header-right">
          <div class="p-score-box">
            <div class="p-score-item">
              <span>Time Target</span>
              <span>15:00</span>
            </div>
            <div class="p-score-item">
              <span>Actual Time</span>
              <div class="p-score-val"></div>
            </div>
            <div class="p-score-item">
              <span>Criterion</span>
              <span>${escapeHtml(task.mypCriterion?.split(':')[0] || 'Crit D')}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Prompt Box -->
      <div class="p-prompt-box">
        <div class="p-prompt-label">Writing Prompt  •  Command Term: [ ${escapeHtml(task.commandTerm)} ]</div>
        <div class="p-prompt-text">${escapeHtml(task.prompt)}</div>
      </div>

      <!-- Stimulus Table -->
      <div class="p-section">
        <div class="p-table-container">
          <div class="p-table-caption">STIMULUS DATA: ${escapeHtml(task.stimulus?.title || 'Data Source')}</div>
          <table class="p-table">
            <thead>${tableHeadersHtml}</thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
          ${task.stimulus?.notes ? `<div class="p-table-notes">Notes / Constraints: ${escapeHtml(task.stimulus.notes)}</div>` : ''}
        </div>
      </div>

      <!-- Guidance & Scaffolding Grid -->
      <div class="p-guidance-grid">
        <div class="p-guide-col">
          <h4>Command Term [ ${escapeHtml(task.commandTerm)} ] Strategy & Structure</h4>
          <div style="font-size: 7.5pt; font-style: italic; margin-bottom: 3pt;">${escapeHtml(task.commandTermDefinition || '')}</div>
          <ul class="p-guide-list">
            ${(task.scaffolding?.recommendedStructure || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="p-guide-col">
          <h4>Academic Register & Connectors</h4>
          <ul class="p-guide-list">${starters}</ul>
          <div style="margin-top: 4pt; font-weight: 700; font-size: 7.5pt;">TARGET VOCABULARY:</div>
          <div class="p-vocab-block">${escapeHtml(vocab)}</div>
          <ul class="p-guide-list" style="margin-top: 3pt;">${avoid}</ul>
        </div>
      </div>

      <!-- Dynamic Template Content (Ruled lines or Cut zone or Checklist) -->
      ${templateBody}

      <!-- Footer -->
      <footer class="p-footer">
        <span>Daily IB Writing  •  Page ${pageNum} of ${totalPages}  •  Model: gemini-3.8-flash  •  Keep writing daily to master IB Command Terms</span>
        <span>Student Name: ___________________________    Date: ______________</span>
      </footer>
    </div>
  `;
}

// --------------------------------------------------------------------------
// EVENT LISTENERS & UI CONTROLS
// --------------------------------------------------------------------------

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

  // Subject Filter
  subjectFilter.addEventListener('change', (e) => {
    currentSubjectFilter = e.target.value;
    renderCurrentDay();
  });

  // Template Selector Pills
  templatePills.querySelectorAll('.tpl-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      templatePills.querySelectorAll('.tpl-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentTemplate = pill.getAttribute('data-template');
      showToast(`Print template set to: ${pill.textContent}`);
    });
  });

  // Print Both Tasks
  printBothBtn.addEventListener('click', () => {
    printBothTasks();
  });

  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// --------------------------------------------------------------------------
// TIMER WIDGET (15:00 Practice Countdown)
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
      showToast('⏱️ 15 Minutes Complete! Review your writing against the rubric.');
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
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    // AudioContext might be blocked until user gesture, safe to ignore
  }
}

// --------------------------------------------------------------------------
// THEME SWITCHER
// --------------------------------------------------------------------------

function initTheme() {
  const savedTheme = localStorage.getItem('ib_writing_theme') || 'light';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const current = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('ib_writing_theme', newTheme);
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

// --------------------------------------------------------------------------
// UTILITIES
// --------------------------------------------------------------------------

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 2500);
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
