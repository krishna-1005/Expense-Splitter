document.addEventListener("DOMContentLoaded", () => {

  /* ================== STATE ================== */
  let members = [];
  let expenses = [];

  /* ================== ELEMENTS ================== */
  const memberList = document.getElementById("memberList");
  const payerCheckboxes = document.getElementById("payerCheckboxes");
  const expenseList = document.getElementById("expenseList");
  const balanceList = document.getElementById("balanceList");
  const historyList = document.getElementById("historyList");

  const themeBtn = document.getElementById("themeToggle");
  const createGroupBtn = document.getElementById("createGroupBtn");
  const addMemberBtn = document.getElementById("addMemberBtn");
  const addExpenseBtn = document.getElementById("addExpenseBtn");
  const resetBtn = document.getElementById("resetBtn");

  const groupInput = document.getElementById("groupName");
  const memberInput = document.getElementById("memberName");
  const expenseDescInput = document.getElementById("expenseDesc");
  const expenseAmountInput = document.getElementById("expenseAmount");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  /* ================== INITIAL STATE ================== */
  addExpenseBtn.disabled = true;

  /* ================== DARK MODE ================== */
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  /* ================== GROUP ================== */
  createGroupBtn.addEventListener("click", () => {
    const name = groupInput.value.trim();
    if (!name) return alert("Enter group name");

    document.getElementById("currentGroup").textContent = `Group: ${name}`;
    groupInput.value = ""; // ✅ clear input
  });

  /* ================== MEMBERS ================== */
  addMemberBtn.addEventListener("click", () => {
    const name = memberInput.value.trim();
    if (!name) return alert("Enter member name");
    if (members.includes(name)) return alert("Member already exists");

    members.push(name);
    renderMembers();
    memberInput.value = ""; // ✅ clear input
  });

  function renderMembers() {
    memberList.innerHTML = "";
    payerCheckboxes.innerHTML = "";

    members.forEach(member => {
      memberList.innerHTML += `<li>${member}</li>`;
      payerCheckboxes.innerHTML += `
        <label>
          <input type="checkbox" value="${member}">
          ${member}
        </label>
      `;
    });

    // ✅ enable expense button when members exist
    addExpenseBtn.disabled = members.length === 0;
  }

  /* ================== EXPENSE ================== */
  addExpenseBtn.addEventListener("click", () => {
    const desc = expenseDescInput.value.trim();
    const amount = Number(expenseAmountInput.value);

    const selectedPayers = [...payerCheckboxes.querySelectorAll("input:checked")]
      .map(cb => cb.value);

    if (!desc || amount <= 0 || selectedPayers.length === 0) {
      return alert("Fill all expense details");
    }

    const splitAmount = amount / members.length;

    expenses.push({
      desc,
      amount,
      paidBy: [...selectedPayers],
      splitAmount
    });

    renderExpenses();
    renderHistory();
    calculateBalances();

    // ✅ clear inputs
    expenseDescInput.value = "";
    expenseAmountInput.value = "";
    payerCheckboxes.querySelectorAll("input").forEach(cb => cb.checked = false);
  });

  function renderExpenses() {
    expenseList.innerHTML = "";
    expenses.forEach(e => {
      expenseList.innerHTML += `
        <li>
          ${e.desc}
          <strong>₹${e.amount}</strong>
        </li>
      `;
    });
  }

  /* ================== HISTORY ================== */
  function renderHistory() {
    historyList.innerHTML = "";

    expenses.forEach((e, index) => {
      historyList.innerHTML += `
        <li class="history-item">
          <strong>${index + 1}. ${e.desc}</strong>
          <span>Amount: ₹${e.amount}</span>
          <span>Paid by: ${e.paidBy.join(", ")}</span>
        </li>
      `;
    });
  }

  /* ================== BALANCES ================== */
  function calculateBalances() {
    const balances = {};
    members.forEach(m => balances[m] = 0);

    expenses.forEach(e => {
      members.forEach(m => balances[m] -= e.splitAmount);
      e.paidBy.forEach(p => {
        balances[p] += e.amount / e.paidBy.length;
      });
    });

    balanceList.innerHTML = "";
    for (let person in balances) {
      balanceList.innerHTML += `
        <li>
          ${person}
          <strong>
            ${balances[person] >= 0 ? "Gets" : "Pays"}
            ₹${Math.abs(balances[person]).toFixed(2)}
          </strong>
        </li>
      `;
    }
  }

  /* ================== RESET ================== */
  resetBtn.addEventListener("click", () => {
    location.reload();
  });

/* ================== PDF ================== */
downloadPdfBtn.addEventListener("click", () => {
  if (expenses.length === 0) {
    alert("No expenses to generate receipt");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // ===== VERY IMPORTANT SAFETY SETTINGS =====
  doc.setFont("helvetica", "normal");
  doc.setCharSpace(0);
  doc.setFontSize(12);

  let y = 15;

  // ===== TITLE =====
  doc.setFontSize(18);
  doc.text("Expense Receipt", 10, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, y);
  y += 10;

  // ===== EXPENSES =====
  doc.setFontSize(13);
  doc.text("Expenses:", 10, y);
  y += 8;

  doc.setFontSize(11);

  expenses.forEach((e, i) => {
    const text = `${i + 1}. ${e.desc} - Rs. ${e.amount} (Paid by: ${e.paidBy.join(", ")})`;
    doc.text(text, 10, y);
    y += 7;

    // page break safety
    if (y > 280) {
      doc.addPage();
      y = 15;
    }
  });

  // ===== TOTAL =====
  y += 5;
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  doc.text(`Total Spent: Rs. ${totalAmount}`, 10, y);
  y += 10;

  // ===== NET BALANCES =====
  doc.setFontSize(13);
  doc.text("Net Balances:", 10, y);
  y += 8;

  doc.setFontSize(11);

  const balances = {};
  members.forEach(m => balances[m] = 0);

  expenses.forEach(e => {
    const split = e.amount / members.length;
    members.forEach(m => balances[m] -= split);
    e.paidBy.forEach(p => {
      balances[p] += e.amount / e.paidBy.length;
    });
  });

  for (let person in balances) {
    const line = `${person}: ${balances[person] >= 0 ? "Gets" : "Pays"} Rs. ${Math.abs(balances[person]).toFixed(2)}`;
    doc.text(line, 10, y);
    y += 7;

    if (y > 280) {
      doc.addPage();
      y = 15;
    }
  }

  // ===== FOOTER =====
  y += 10;
  doc.setFontSize(10);
  doc.text("Generated by Expense Splitter", 10, y);

  // ===== SAVE =====
  doc.save("expense-receipt.pdf");
});



});