// Expense & Budget Visualizer — js/script.js
// All application logic in a single Vanilla JavaScript file.

// =============================================================================
// STATE & CONSTANTS (Task 2.1)
// =============================================================================

let transactions = [];
let spendingChart = null;

const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56"
};

const STORAGE_KEY = "expense_transactions";

// Feature 1: Sort
let currentSort = "date-desc";
const SORT_STORAGE_KEY = "expense_sort";

// Feature 2: Theme
const THEME_STORAGE_KEY = "expense_theme";

// Feature 3: Spending limit
const LIMIT_STORAGE_KEY = "expense_limit";
let spendingLimit = 0;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * generateId — returns a unique string ID. (Task 2.2)
 * Prefers crypto.randomUUID(); falls back to timestamp+random string.
 */
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * formatAmount — formats a number as a currency string. (Task 2.3)
 * Returns e.g. "$1,234.56"
 * @param {number} amount
 * @returns {string}
 */
function formatAmount(amount) {
  return "$" + Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// =============================================================================
// BROWSER SUPPORT CHECK (Task 3.1)
// =============================================================================

/**
 * checkBrowserSupport — detects required Web APIs.
 * Returns { supported: boolean, missing: string[] }.
 * If unsupported, injects a full-page error banner and returns { supported: false }.
 */
function checkBrowserSupport() {
  const missing = [];

  // Check localStorage availability
  try {
    const testKey = "__support_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
  } catch (e) {
    missing.push("localStorage");
  }

  // Check basic DOM APIs
  if (typeof document === "undefined" || typeof document.getElementById !== "function") {
    missing.push("DOM API");
  }

  if (missing.length > 0) {
    const banner = document.createElement("div");
    banner.id = "browser-unsupported-banner";
    banner.setAttribute("role", "alert");
    banner.style.cssText = [
      "position:fixed", "top:0", "left:0", "right:0", "z-index:9999",
      "background:#c0392b", "color:#fff", "padding:2rem", "text-align:center",
      "font-family:sans-serif", "font-size:1rem"
    ].join(";");
    banner.innerHTML =
      "<strong>Unsupported Browser</strong><br>" +
      "The following required feature(s) are unavailable in your browser: " +
      "<strong>" + missing.join(", ") + "</strong>.<br>" +
      "Please upgrade to a modern browser (Chrome, Firefox, Edge, or Safari).";
    document.body.prepend(banner);
    return { supported: false, missing: missing };
  }

  return { supported: true, missing: [] };
}

// =============================================================================
// STORAGE ERROR HANDLER (Task 4.1)
// =============================================================================

/**
 * handleStorageError — injects a dismissible error banner for storage failures.
 * @param {'read'|'write'} operation
 * @param {Error} error
 */
function handleStorageError(operation, error) {
  console.error("Storage error (" + operation + "):", error);

  // Remove any existing banner before injecting a new one
  const existing = document.getElementById("error-banner");
  if (existing) {
    existing.remove();
  }

  const message = operation === "read"
    ? "Your transactions could not be retrieved from storage. The app will start with an empty list."
    : "Your transactions could not be saved. Changes may be lost if you close the browser.";

  const banner = document.createElement("div");
  banner.id = "error-banner";
  banner.className = "error-banner";
  banner.setAttribute("role", "alert");
  banner.setAttribute("aria-live", "assertive");

  const msgEl = document.createElement("p");
  msgEl.id = "error-banner-message";
  msgEl.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.id = "error-banner-close";
  closeBtn.setAttribute("aria-label", "Dismiss error");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", function () {
    banner.remove();
  });

  banner.appendChild(msgEl);
  banner.appendChild(closeBtn);

  // Prepend to body so it appears at the very top
  document.body.prepend(banner);
}

// =============================================================================
// LOCAL STORAGE PERSISTENCE LAYER (Tasks 4.2, 4.4)
// =============================================================================

/**
 * loadTransactions — reads and parses the transaction list from localStorage.
 * Returns empty array on miss or any error.
 * @returns {Array}
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    handleStorageError("read", err);
    return [];
  }
}

/**
 * saveTransactions — serializes and writes the transactions array to localStorage.
 * Does not rethrow on failure; in-memory state remains usable.
 */
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    handleStorageError("write", err);
  }
}

// =============================================================================
// VALIDATION LAYER (Tasks 6.1, 6.4)
// =============================================================================

/**
 * validateItemName — validates the item name field.
 * @param {string} value
 * @returns {string|null} error message or null if valid
 */
function validateItemName(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "Item name is required.";
  }
  if (value.length > 100) {
    return "Item name must not exceed 100 characters.";
  }
  return null;
}

/**
 * validateAmount — validates the amount field.
 * @param {string|number} value
 * @returns {string|null} error message or null if valid
 */
function validateAmount(value) {
  // Guard empty / missing values first
  if (value === "" || value === null || value === undefined) {
    return "Amount is required.";
  }
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) {
    return "Amount must be a valid number.";
  }
  if (num < 0.01) {
    return "Amount must be at least $0.01.";
  }
  if (num > 999999999.99) {
    return "Amount must not exceed $999,999,999.99.";
  }
  return null;
}

/**
 * validateCategory — validates the category field.
 * @param {string} value
 * @returns {string|null} error message or null if valid
 */
function validateCategory(value) {
  const validCategories = ["Food", "Transport", "Fun"];
  if (!value || value === "") {
    return "Please select a category.";
  }
  if (!validCategories.includes(value)) {
    return "Category must be Food, Transport, or Fun.";
  }
  return null;
}

/**
 * validateForm — runs all field validators and aggregates results.
 * @param {{ itemName: string, amount: string, category: string }} formData
 * @returns {{ valid: boolean, errors: Array<{ field: string, message: string }> }}
 */
function validateForm(formData) {
  const errors = [];

  const itemNameError = validateItemName(formData.itemName);
  if (itemNameError) errors.push({ field: "itemName", message: itemNameError });

  const amountError = validateAmount(formData.amount);
  if (amountError) errors.push({ field: "amount", message: amountError });

  const categoryError = validateCategory(formData.category);
  if (categoryError) errors.push({ field: "category", message: categoryError });

  return { valid: errors.length === 0, errors: errors };
}

/**
 * displayValidationErrors — writes error messages into inline error spans.
 * Moves focus to the first invalid field.
 * @param {Array<{ field: string, message: string }>} errors
 */
function displayValidationErrors(errors) {
  const fieldMap = {
    itemName: { errorId: "item-name-error", inputId: "item-name" },
    amount:   { errorId: "amount-error",    inputId: "amount" },
    category: { errorId: "category-error",  inputId: "category" }
  };

  let firstInvalidInput = null;

  errors.forEach(function (error) {
    const mapping = fieldMap[error.field];
    if (mapping) {
      const span = document.getElementById(mapping.errorId);
      if (span) span.textContent = error.message;
      if (!firstInvalidInput) {
        firstInvalidInput = document.getElementById(mapping.inputId);
      }
    }
  });

  if (firstInvalidInput) {
    firstInvalidInput.focus();
  }
}

/**
 * clearValidationErrors — clears all inline error spans.
 */
function clearValidationErrors() {
  ["item-name-error", "amount-error", "category-error"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

// =============================================================================
// TRANSACTION MANAGEMENT (Tasks 7.1, 7.3)
// =============================================================================

/**
 * addTransaction — creates and stores a new transaction.
 * @param {string} itemName
 * @param {number} amount
 * @param {string} category
 */
function addTransaction(itemName, amount, category) {
  const newTransaction = {
    id:        generateId(),
    itemName:  itemName.trim(),
    amount:    parseFloat(amount),
    category:  category,
    createdAt: Date.now()
  };

  transactions.push(newTransaction);
  saveTransactions();
  renderTransactionList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
}

/**
 * deleteTransaction — removes a transaction by id.
 * @param {string} id
 */
function deleteTransaction(id) {
  const index = transactions.findIndex(function (t) { return t.id === id; });
  if (index === -1) return;

  transactions.splice(index, 1);
  saveTransactions();
  renderTransactionList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
}

// =============================================================================
// RENDERING FUNCTIONS (Tasks 8.1, 8.3, 8.4)
// =============================================================================

/**
 * calculateTotal — pure function; sums all transaction amounts.
 * @param {Array} txns
 * @returns {number}
 */
function calculateTotal(txns) {
  if (!txns || txns.length === 0) return 0;
  return txns.reduce(function (sum, t) { return sum + t.amount; }, 0);
}

/**
 * renderBalance — updates the balance display element.
 * Also triggers the spending limit warning check (Feature 3).
 * @param {Array} txns
 */
function renderBalance(txns) {
  const el = document.getElementById("balance-display");
  if (el) {
    el.textContent = "Total Balance: " + formatAmount(calculateTotal(txns));
  }
  renderLimitWarning(txns);
}

/**
 * renderTransactionItem — creates a single <li> for a transaction.
 * @param {Object} transaction
 * @returns {HTMLLIElement}
 */
function renderTransactionItem(transaction) {
  const li = document.createElement("li");
  li.className = "transaction-item";

  const nameSpan = document.createElement("span");
  nameSpan.className = "transaction-name";
  nameSpan.textContent = transaction.itemName;

  const amountSpan = document.createElement("span");
  amountSpan.className = "transaction-amount";
  amountSpan.textContent = formatAmount(transaction.amount);

  const categorySpan = document.createElement("span");
  categorySpan.className = "transaction-category";
  categorySpan.textContent = transaction.category;
  // Apply category-specific color as a data attribute for CSS styling
  categorySpan.setAttribute("data-category", transaction.category);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.setAttribute("data-id", transaction.id);
  deleteBtn.setAttribute("aria-label", "Delete " + transaction.itemName);
  deleteBtn.textContent = "✕";
  deleteBtn.type = "button";

  li.appendChild(nameSpan);
  li.appendChild(amountSpan);
  li.appendChild(categorySpan);
  li.appendChild(deleteBtn);

  return li;
}

/**
 * renderTransactionList — clears and rebuilds the transaction list UI.
 * Sort order is controlled by currentSort (Feature 1), capped at 1000 items.
 * @param {Array} txns
 */
function renderTransactionList(txns) {
  const ul = document.getElementById("transaction-list");
  if (!ul) return;

  const sorted = txns.slice().sort(function (a, b) {
    switch (currentSort) {
      case "date-asc":    return a.createdAt - b.createdAt;
      case "amount-desc": return b.amount - a.amount;
      case "amount-asc":  return a.amount - b.amount;
      case "category-asc":
        return a.category.localeCompare(b.category);
      case "date-desc":
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const capped = sorted.slice(0, 1000);
  ul.innerHTML = "";
  const fragment = document.createDocumentFragment();
  capped.forEach(function (t) {
    fragment.appendChild(renderTransactionItem(t));
  });
  ul.appendChild(fragment);
}

/**
 * aggregateByCategory — pure function; sums amounts per category.
 * @param {Array} txns
 * @returns {Object} e.g. { Food: 12.5, Transport: 30, Fun: 5 }
 */
function aggregateByCategory(txns) {
  return txns.reduce(function (acc, t) {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
}

/**
 * showChartPlaceholder — shows the placeholder text, hides the canvas.
 */
function showChartPlaceholder() {
  const placeholder = document.getElementById("chart-placeholder");
  const canvas = document.getElementById("spending-chart");
  if (placeholder) placeholder.hidden = false;
  if (canvas) canvas.hidden = true;
}

/**
 * hideChartPlaceholder — hides the placeholder text, shows the canvas.
 */
function hideChartPlaceholder() {
  const placeholder = document.getElementById("chart-placeholder");
  const canvas = document.getElementById("spending-chart");
  if (placeholder) placeholder.hidden = true;
  if (canvas) canvas.hidden = false;
}

/**
 * updateChart — creates or updates the Chart.js pie chart instance.
 * @param {Object} categoryTotals e.g. { Food: 12.5, Transport: 30 }
 */
function updateChart(categoryTotals) {
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const colors = labels.map(function (label) {
    return CATEGORY_COLORS[label] || "#AAAAAA";
  });

  if (spendingChart === null) {
    const canvas = document.getElementById("spending-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    spendingChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: document.body.classList.contains("dark") ? "#1e2235" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom"
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce(function (s, v) { return s + v; }, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return context.label + ": " + formatAmount(value) + " (" + pct + "%)";
              }
            }
          }
        }
      }
    });
  } else {
    spendingChart.data.labels = labels;
    spendingChart.data.datasets[0].data = data;
    spendingChart.data.datasets[0].backgroundColor = colors;
    spendingChart.update();
  }
}

/**
 * renderChart — orchestrates chart rendering based on transaction state.
 * @param {Array} txns
 */
function renderChart(txns) {
  if (!txns || txns.length === 0) {
    if (spendingChart !== null) {
      spendingChart.destroy();
      spendingChart = null;
    }
    showChartPlaceholder();
  } else {
    hideChartPlaceholder();
    updateChart(aggregateByCategory(txns));
  }
}

// =============================================================================
// FEATURE 1: SORT TRANSACTIONS
// =============================================================================

/**
 * handleSortChange — updates currentSort and re-renders the list.
 * @param {Event} event
 */
function handleSortChange(event) {
  currentSort = event.target.value;
  try {
    localStorage.setItem(SORT_STORAGE_KEY, currentSort);
  } catch (e) { /* ignore */ }
  renderTransactionList(transactions);
}

// =============================================================================
// FEATURE 2: DARK / LIGHT MODE
// =============================================================================

/**
 * applyTheme — applies 'dark' or 'light' class to <body> and updates the toggle button label.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", "Switch to light mode");
      btn.innerHTML = "&#9728;"; // sun icon
    }
  } else {
    document.body.classList.remove("dark");
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", "Switch to dark mode");
      btn.innerHTML = "&#9790;"; // moon icon
    }
  }
  // Update chart border color to match theme
  if (spendingChart) {
    spendingChart.data.datasets[0].borderColor = theme === "dark" ? "#1e2235" : "#ffffff";
    spendingChart.update();
  }
}

/**
 * handleThemeToggle — toggles between dark and light mode and persists the preference.
 */
function handleThemeToggle() {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  applyTheme(newTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  } catch (e) { /* ignore */ }
}

// =============================================================================
// FEATURE 3: SPENDING LIMIT WARNING
// =============================================================================

/**
 * loadSpendingLimit — reads the saved spending limit from localStorage.
 * @returns {number}
 */
function loadSpendingLimit() {
  try {
    const raw = localStorage.getItem(LIMIT_STORAGE_KEY);
    if (raw === null) return 0;
    const val = parseFloat(raw);
    return isNaN(val) || val < 0 ? 0 : val;
  } catch (e) {
    return 0;
  }
}

/**
 * saveSpendingLimit — persists the spending limit to localStorage.
 * @param {number} limit
 */
function saveSpendingLimit(limit) {
  try {
    localStorage.setItem(LIMIT_STORAGE_KEY, String(limit));
  } catch (e) { /* ignore */ }
}

/**
 * renderLimitDisplay — updates the hint text below the limit input.
 */
function renderLimitDisplay() {
  const el = document.getElementById("limit-display");
  if (!el) return;
  if (spendingLimit > 0) {
    el.textContent = "Current limit: " + formatAmount(spendingLimit);
  } else {
    el.textContent = "No limit set.";
  }
}

/**
 * renderLimitWarning — shows or hides the over-limit warning in the header.
 * @param {Array} txns
 */
function renderLimitWarning(txns) {
  const warningEl = document.getElementById("limit-warning");
  const textEl    = document.getElementById("limit-warning-text");
  const balanceEl = document.getElementById("balance-display");
  if (!warningEl || !textEl || !balanceEl) return;

  const total = calculateTotal(txns);

  if (spendingLimit > 0 && total > spendingLimit) {
    const over = total - spendingLimit;
    textEl.textContent =
      "⚠ Spending limit exceeded by " + formatAmount(over) +
      " (limit: " + formatAmount(spendingLimit) + ")";
    warningEl.hidden = false;
    balanceEl.classList.add("balance-over-limit");
  } else {
    warningEl.hidden = true;
    balanceEl.classList.remove("balance-over-limit");
  }
}

/**
 * handleLimitSet — reads the limit input and saves the new limit.
 */
function handleLimitSet() {
  const input = document.getElementById("limit-input");
  if (!input) return;
  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0) {
    spendingLimit = 0;
  } else {
    spendingLimit = val;
  }
  saveSpendingLimit(spendingLimit);
  renderLimitDisplay();
  renderLimitWarning(transactions);
  input.value = "";
}

// =============================================================================
// EVENT HANDLERS (Tasks 9.1, 9.2)
// =============================================================================

/**
 * handleFormSubmit — processes the add-transaction form submission.
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const itemName = document.getElementById("item-name").value;
  const amount   = document.getElementById("amount").value;
  const category = document.getElementById("category").value;

  clearValidationErrors();

  const result = validateForm({ itemName: itemName, amount: amount, category: category });

  if (!result.valid) {
    displayValidationErrors(result.errors);
    return;
  }

  addTransaction(itemName, parseFloat(amount), category);
  document.getElementById("expense-form").reset();
}

/**
 * handleDeleteClick — event-delegated handler for delete button clicks in the list.
 * @param {Event} event
 */
function handleDeleteClick(event) {
  const btn = event.target.closest("button[data-id]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  if (id) {
    deleteTransaction(id);
  }
}

/**
 * attachEventListeners — wires all DOM event listeners.
 */
function attachEventListeners() {
  const form = document.getElementById("expense-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  const list = document.getElementById("transaction-list");
  if (list) {
    list.addEventListener("click", handleDeleteClick);
  }

  // Feature 1: Sort
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", handleSortChange);
  }

  // Feature 2: Theme toggle
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", handleThemeToggle);
  }

  // Feature 3: Spending limit
  const limitBtn = document.getElementById("limit-set-btn");
  if (limitBtn) {
    limitBtn.addEventListener("click", handleLimitSet);
  }
  // Allow pressing Enter in the limit input to set the limit
  const limitInput = document.getElementById("limit-input");
  if (limitInput) {
    limitInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); handleLimitSet(); }
    });
  }
}

// =============================================================================
// BOOT SEQUENCE (Tasks 3.1, 3.2)
// =============================================================================

/**
 * init — application entry point, called on DOMContentLoaded.
 */
function init() {
  const support = checkBrowserSupport();
  if (!support.supported) {
    return;
  }

  transactions = loadTransactions();

  // Feature 1: Restore sort preference
  const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
  if (savedSort) {
    currentSort = savedSort;
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) sortSelect.value = currentSort;
  }

  // Feature 2: Restore theme preference
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
  applyTheme(savedTheme);

  // Feature 3: Restore spending limit
  spendingLimit = loadSpendingLimit();
  renderLimitDisplay();

  attachEventListeners();
  renderTransactionList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
}

document.addEventListener("DOMContentLoaded", init);
