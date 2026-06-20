/* ========================================
   LEDGER & LEAF — EXPENSE TRACKER
   Easy to understand code with clear comments
   ======================================== */

// ========================================
// 1. DOM ELEMENTS - References to HTML elements
// ========================================

const expenseForm = document.getElementById('expenseForm');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const descriptionInput = document.getElementById('description');
const dateInput = document.getElementById('date');
const categoryFilterSelect = document.getElementById('categoryFilter');
const expensesContainer = document.getElementById('expensesContainer');
const totalSpentElement = document.getElementById('totalSpent');
const expenseCountElement = document.getElementById('expenseCount');
const avgExpenseElement = document.getElementById('avgExpense');
const formStatus = document.getElementById('formStatus');

// Category → emoji lookup, used when rendering the table
const CATEGORY_EMOJI = {
    Food: '🍔',
    Transport: '🚗',
    Entertainment: '🎬',
    Utilities: '💡',
    Health: '🏥',
    Education: '📚',
    Other: '📌'
};

// ========================================
// 2. STATE - Data management
// ========================================

// Array to store all expenses. Each expense is an object:
// { id, amount, category, description, date }
let expenses = [];

// Chart.js instances, kept so we can destroy/recreate on update
let categoryChart = null;
let trendsChart = null;

// ========================================
// 3. INITIALIZATION - Run when page loads
// ========================================

function initializeApp() {
    // Guard: only run on pages that actually have the tracker form
    if (!expenseForm) return;

    // Default the date field to today
    dateInput.valueAsDate = new Date();

    // Load any previously saved expenses
    loadExpenses();

    // Paint the page with whatever data we have
    updateDisplay();
}

// ========================================
// 4. DATA MANAGEMENT - Save and load data
// ========================================

/**
 * Load expenses from localStorage.
 * Wrapped in try/catch in case storage is disabled or the
 * saved data has become corrupted.
 */
function loadExpenses() {
    try {
        const savedData = localStorage.getItem('ledgerLeafExpenses');
        expenses = savedData ? JSON.parse(savedData) : [];
        if (!Array.isArray(expenses)) expenses = [];
    } catch (error) {
        console.error('Could not load saved expenses:', error);
        expenses = [];
    }
}

/**
 * Save the current expenses array to localStorage.
 */
function saveExpenses() {
    try {
        localStorage.setItem('ledgerLeafExpenses', JSON.stringify(expenses));
    } catch (error) {
        console.error('Could not save expenses:', error);
        showFormStatus('Your expense was added, but it could not be saved for next time.', 'error');
    }
}

// ========================================
// 5. VALIDATION
// ========================================

/**
 * Validate the add-expense form.
 * @returns {boolean} true if every field passes
 */
function validateExpenseForm() {
    let isValid = true;

    // Clear previous errors first
    ['amount', 'category', 'date'].forEach(function (field) {
        const errorEl = document.getElementById(field + 'Error');
        if (errorEl) errorEl.textContent = '';
        document.getElementById(field).classList.remove('is-invalid');
    });

    // Amount: required, must be a positive number
    const amountValue = parseFloat(amountInput.value);
    if (!amountInput.value || isNaN(amountValue) || amountValue <= 0) {
        setError('amount', 'Enter an amount greater than ₨0.');
        isValid = false;
    }

    // Category: required
    if (!categoryInput.value) {
        setError('category', 'Please choose a category.');
        isValid = false;
    }

    // Date: required, and shouldn't be in the future
    if (!dateInput.value) {
        setError('date', 'Please choose a date.');
        isValid = false;
    } else {
        const chosenDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (chosenDate > today) {
            setError('date', 'Date cannot be in the future.');
            isValid = false;
        }
    }

    return isValid;
}

function setError(field, message) {
    const errorEl = document.getElementById(field + 'Error');
    const inputEl = document.getElementById(field);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('is-invalid');
}

function showFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form__status is-visible form__status--' + type;
    // Auto-hide success messages after a few seconds
    if (type === 'success') {
        setTimeout(function () {
            formStatus.className = 'form__status';
        }, 4000);
    }
}

// ========================================
// 6. EVENT LISTENERS - Handle user actions
// ========================================

if (expenseForm) {
    expenseForm.addEventListener('submit', function (event) {
        event.preventDefault();

        try {
            if (!validateExpenseForm()) {
                showFormStatus('Please fix the highlighted fields.', 'error');
                return;
            }

            // Create new expense object
            const newExpense = {
                id: Date.now(), // Unique ID using timestamp
                amount: parseFloat(amountInput.value),
                category: categoryInput.value,
                description: descriptionInput.value.trim(),
                date: dateInput.value
            };

            expenses.push(newExpense);
            saveExpenses();

            // Reset the form for the next entry
            expenseForm.reset();
            dateInput.valueAsDate = new Date();

            updateDisplay();
            showFormStatus('Expense added to your ledger.', 'success');

        } catch (error) {
            console.error('Error adding expense:', error);
            showFormStatus('Something went wrong while adding that expense. Please try again.', 'error');
        }
    });
}

if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener('change', updateDisplay);
}

// ========================================
// 7. EXPENSE OPERATIONS - Add, delete, filter
// ========================================

/**
 * Delete an expense by ID, after the user confirms.
 * @param {number} id
 */
function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        expenses = expenses.filter(function (expense) { return expense.id !== id; });
        saveExpenses();
        updateDisplay();
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}

/**
 * Get expenses filtered by the selected category (or all, if none chosen).
 * @returns {Array}
 */
function getFilteredExpenses() {
    const selectedCategory = categoryFilterSelect ? categoryFilterSelect.value : '';
    if (!selectedCategory) return expenses;
    return expenses.filter(function (expense) { return expense.category === selectedCategory; });
}

// ========================================
// 8. DISPLAY UPDATES - Update UI with data
// ========================================

function updateDisplay() {
    updateStatistics();
    updateExpensesTable();
    updateCharts();
}

/**
 * Update the three summary stat boxes.
 */
function updateStatistics() {
    const filtered = getFilteredExpenses();
    const total = filtered.reduce(function (sum, expense) { return sum + expense.amount; }, 0);
    const count = filtered.length;
    const average = count > 0 ? total / count : 0;

    if (totalSpentElement) totalSpentElement.textContent = '\u20A8' + total.toFixed(2);
    if (expenseCountElement) expenseCountElement.textContent = count;
    if (avgExpenseElement) avgExpenseElement.textContent = '\u20A8' + average.toFixed(2);
}

/**
 * Escape a string for safe insertion into innerHTML.
 * Protects against accidental HTML injection from descriptions.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Rebuild the expenses table from the current (filtered) data.
 */
function updateExpensesTable() {
    if (!expensesContainer) return;

    const filtered = getFilteredExpenses();
    const sorted = filtered.slice().sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    if (sorted.length === 0) {
        if (expenses.length === 0) {
            expensesContainer.innerHTML = '<div class="empty-state">No expenses added yet. Start by adding your first expense above.</div>';
        } else {
            expensesContainer.innerHTML = '<div class="no-data">No expenses match this filter.</div>';
        }
        return;
    }

    let html = '<table class="expenses-table">' +
        '<thead><tr>' +
        '<th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Action</th>' +
        '</tr></thead><tbody>';

    sorted.forEach(function (expense) {
        const categoryClass = 'cat-' + expense.category.toLowerCase();
        const formattedDate = new Date(expense.date).toLocaleDateString();
        const emoji = CATEGORY_EMOJI[expense.category] || '📌';
        const description = expense.description ? escapeHtml(expense.description) : '\u2014';

        html += '<tr>' +
            '<td>' + formattedDate + '</td>' +
            '<td><span class="badge ' + categoryClass + '">' + emoji + ' ' + expense.category + '</span></td>' +
            '<td>' + description + '</td>' +
            '<td class="amount">\u20A8' + expense.amount.toFixed(2) + '</td>' +
            '<td><button class="btn btn--delete" onclick="deleteExpense(' + expense.id + ')">Delete</button></td>' +
            '</tr>';
    });

    html += '</tbody></table>';
    expensesContainer.innerHTML = html;
}

// ========================================
// 9. CHARTS - Visual breakdown of spending
// ========================================

function updateCharts() {
    updateCategoryChart();
    updateTrendsChart();
}

/**
 * Doughnut chart: total spending per category (all-time, unfiltered).
 */
function updateCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const categories = {};
    expenses.forEach(function (expense) {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    const ctx = canvas.getContext('2d');
    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#C97B30', '#2E6E91', '#8E5BA8', '#2F8F7A', '#B5524A', '#1B6E5C', '#6B6458'],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Inter' } } }
            }
        }
    });
}

/**
 * Line chart: total spending per day over the last 7 days.
 */
function updateTrendsChart() {
    const canvas = document.getElementById('trendsChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const last7Days = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        last7Days[dateString] = 0;
    }

    expenses.forEach(function (expense) {
        if (Object.prototype.hasOwnProperty.call(last7Days, expense.date)) {
            last7Days[expense.date] += expense.amount;
        }
    });

    const ctx = canvas.getContext('2d');
    if (trendsChart) trendsChart.destroy();

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(last7Days).map(function (dateStr) {
                return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Daily spending',
                data: Object.values(last7Days),
                borderColor: '#1B4332',
                backgroundColor: 'rgba(27, 67, 50, 0.08)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#C9A227'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) { return '\u20A8' + value.toFixed(0); }
                    }
                }
            }
        }
    });
}

// ========================================
// 10. START THE APPLICATION
// ========================================

document.addEventListener('DOMContentLoaded', initializeApp);
