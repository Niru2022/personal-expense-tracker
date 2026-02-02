/******************** DARK / LIGHT MODE ********************/
const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️ Light Mode";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "🌙 Dark Mode";
  }
});


/******************** DATA ********************/
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editId = null;
let deleteId = null;

// Inputs
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");
const addBtn = document.getElementById("addBtn");

// Display
const expenseList = document.getElementById("expenseList");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const balanceEl = document.getElementById("balance");
const categorySummaryEl = document.getElementById("categorySummary");
const emptyStateEl = document.getElementById("emptyState");

// Filters & Search
const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");
const searchInput = document.getElementById("searchInput");

// Export buttons
const exportBtn = document.getElementById("exportBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

// Modal
const confirmModal = document.getElementById("confirmModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");

// Events
addBtn.addEventListener("click", handleSubmit);
filterCategory.addEventListener("change", renderExpenses);
filterMonth.addEventListener("change", renderExpenses);
searchInput.addEventListener("input", renderExpenses);
exportBtn.addEventListener("click", exportToCSV);
exportPdfBtn.addEventListener("click", exportToPDF);


/******************** ADD / UPDATE ********************/
function handleSubmit() {
  const amount = amountInput.value;
  const category = categoryInput.value;
  const type = typeInput.value;
  const date = dateInput.value;

  if (amount === "" || date === "") {
    alert("Please fill all fields");
    return;
  }

  if (editId) {
    expenses = expenses.map(exp =>
      exp.id === editId
        ? { ...exp, amount: Number(amount), category, type, date }
        : exp
    );
    editId = null;
    addBtn.textContent = "Add Entry";
  } else {
    expenses.push({
      id: Date.now(),
      amount: Number(amount),
      category,
      type,
      date
    });
  }

  localStorage.setItem("expenses", JSON.stringify(expenses));
  clearForm();
  renderExpenses();
  updateSummary();
}

function clearForm() {
  amountInput.value = "";
  dateInput.value = "";
}


/******************** RENDER WITH FILTERS + SEARCH ********************/
function renderExpenses() {
  expenseList.innerHTML = "";

  const selectedCategory = filterCategory.value;
  const selectedMonth = filterMonth.value;
  const searchText = searchInput.value.toLowerCase();

  let filteredExpenses = expenses;

  if (selectedCategory !== "All") {
    filteredExpenses = filteredExpenses.filter(
      exp => exp.category === selectedCategory
    );
  }

  if (selectedMonth !== "All") {
    filteredExpenses = filteredExpenses.filter(exp => {
      const month = exp.date.split("-")[1];
      return month === selectedMonth;
    });
  }

  if (searchText !== "") {
    filteredExpenses = filteredExpenses.filter(exp => {
      const isNumberSearch = !isNaN(searchText);
      if (isNumberSearch) {
        return exp.amount === Number(searchText);
      }
      return (
        exp.category.toLowerCase().includes(searchText) ||
        exp.type.toLowerCase().includes(searchText) ||
        exp.date.includes(searchText)
      );
    });
  }

  filteredExpenses.forEach(exp => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>Rs ${exp.amount}</td>
      <td>${exp.category}</td>
      <td>${exp.type}</td>
      <td>${exp.date}</td>
      <td>
        <button onclick="editExpense(${exp.id})">Edit</button>
        <button class="delete-btn" onclick="deleteExpense(${exp.id})">
          Delete
        </button>
      </td>
    `;
    expenseList.appendChild(row);
  });

  emptyStateEl.style.display =
    filteredExpenses.length === 0 ? "block" : "none";

  updateCategorySummary(filteredExpenses);
}


/******************** EDIT ********************/
function editExpense(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  amountInput.value = exp.amount;
  categoryInput.value = exp.category;
  typeInput.value = exp.type;
  dateInput.value = exp.date;

  editId = id;
  addBtn.textContent = "Update Entry";
}


/******************** DELETE WITH MODAL ********************/
function deleteExpense(id) {
  deleteId = id;
  confirmModal.classList.remove("hidden");
}

confirmDeleteBtn.addEventListener("click", () => {
  expenses = expenses.filter(exp => exp.id !== deleteId);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  deleteId = null;
  confirmModal.classList.add("hidden");
  renderExpenses();
  updateSummary();
});

cancelDeleteBtn.addEventListener("click", () => {
  deleteId = null;
  confirmModal.classList.add("hidden");
});


/******************** SUMMARY ********************/
function updateSummary() {
  let income = 0;
  let expense = 0;

  expenses.forEach(exp => {
    if (exp.type === "Income") income += exp.amount;
    else expense += exp.amount;
  });

  totalIncomeEl.textContent = income;
  totalExpenseEl.textContent = expense;
  balanceEl.textContent = income - expense;
}


/******************** CATEGORY-WISE SUMMARY ********************/
function updateCategorySummary(data) {
  categorySummaryEl.innerHTML = "";

  const categoryTotals = data.reduce((acc, exp) => {
    if (exp.type === "Expense") {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    }
    return acc;
  }, {});

  if (Object.keys(categoryTotals).length === 0) {
    categorySummaryEl.innerHTML = "<li>No expense data</li>";
    return;
  }

  for (let category in categoryTotals) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${category}</span>
      <strong>Rs ${categoryTotals[category]}</strong>
    `;
    categorySummaryEl.appendChild(li);
  }
}


/******************** EXPORT TO CSV ********************/
function exportToCSV() {
  if (expenses.length === 0) {
    alert("No data to export");
    return;
  }

  let csv = "Amount (Rs),Category,Type,Date\n";

  expenses.forEach(exp => {
    csv += `${exp.amount},${exp.category},${exp.type},${exp.date}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();

  URL.revokeObjectURL(url);
}


/******************** EXPORT TO PDF ********************/
function exportToPDF() {
  if (expenses.length === 0) {
    alert("No data to export");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Personal Expense Report (Rs)", 14, 15);

  doc.setFontSize(10);
  doc.text("Generated for expense management", 14, 22);

  const tableColumn = ["Amount (Rs)", "Category", "Type", "Date"];
  const tableRows = [];

  expenses.forEach(exp => {
    tableRows.push([
      `Rs ${exp.amount}`,
      exp.category,
      exp.type,
      exp.date
    ]);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30
  });

  doc.save("expense-report.pdf");
}


/******************** INITIAL LOAD ********************/
renderExpenses();
updateSummary();
