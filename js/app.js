/* =========================================================
   Loanwise – Final JS Engine (v3)
   Indian-first • UX-safe • Finance-correct
   ========================================================= */

/* ------------------------------
   Indian Number Utilities
------------------------------ */

function stripNonDigits(value) {
  return value.replace(/[^\d]/g, "");
}

function formatIndianNumber(value) {
  if (!value) return "";
  return Number(value).toLocaleString("en-IN");
}

function numberToIndianWords(num) {
  if (!num || num === 0) return "";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);

  let parts = [];
  if (crore) parts.push(crore + " crore");
  if (lakh) parts.push(lakh + " lakh");
  if (thousand) parts.push(thousand + " thousand");

  return parts.join(" ");
}

function updateHelperText(inputEl, helperEl) {
  const raw = stripNonDigits(inputEl.value);
  const num = Number(raw);

  if (!num) {
    helperEl.innerText = "";
    return;
  }

  const words = numberToIndianWords(num);
  helperEl.innerText =
    "₹ " + formatIndianNumber(num) + (words ? " · " + words : "");
}

/* ------------------------------
   Input Formatting (UX-safe)
------------------------------ */

function attachIndianFormatter(inputId, helperId) {
  const input = document.getElementById(inputId);
  const helper = document.getElementById(helperId);

  if (!input || !helper) return;

  input.addEventListener("input", () => {
    const cursorPos = input.selectionStart;
    const raw = stripNonDigits(input.value);
    if (!raw) {
      input.value = "";
      helper.innerText = "";
      return;
    }

    const formatted = formatIndianNumber(raw);
    input.value = formatted;

    updateHelperText(input, helper);

    // cursor safety (simple but effective)
    input.setSelectionRange(formatted.length, formatted.length);
  });
}

/* ------------------------------
   EMI & Loan Math
------------------------------ */

function calculateEMI(principal, annualRate, months) {
  const monthlyRate = annualRate / 12 / 100;

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return { emi, monthlyRate };
}

function generateAmortization(
  principal,
  emi,
  monthlyRate,
  maxMonths,
  lumpSum,
  extraMonthly
) {
  let balance = principal - lumpSum;
  if (balance < 0) balance = 0;

  const schedule = [];

  for (let m = 1; m <= maxMonths && balance > 0; m++) {
    const interest = balance * monthlyRate;

    let principalPaid = emi - interest + extraMonthly;
    if (principalPaid > balance) principalPaid = balance;

    balance -= principalPaid;

    schedule.push({
      month: m,
      emi: emi + extraMonthly,
      principal: principalPaid,
      interest,
      balance: balance > 0 ? balance : 0
    });
  }

  return schedule;
}

function formatCurrency(val) {
  return "₹ " + Math.round(val).toLocaleString("en-IN");
}

/* ------------------------------
   Main Calculate Handler
------------------------------ */

document.getElementById("calculateBtn").addEventListener("click", () => {
  const principal = Number(
    stripNonDigits(document.getElementById("principal").value)
  );
  const rate = Number(document.getElementById("rate").value);
  const tenureValue = Number(document.getElementById("tenureValue").value);
  const tenureUnit = document.getElementById("tenureUnit").value;

  const lumpSum = Number(
    stripNonDigits(document.getElementById("prepayment").value)
  );
  const extraMonthly = Number(
    stripNonDigits(document.getElementById("extraMonthly").value)
  );

  if (!principal || !rate || !tenureValue) {
    alert("Please enter valid loan details.");
    return;
  }

  const totalMonths =
    tenureUnit === "years" ? tenureValue * 12 : tenureValue;

  const { emi, monthlyRate } = calculateEMI(
    principal,
    rate,
    totalMonths
  );

  const schedule = generateAmortization(
    principal,
    emi,
    monthlyRate,
    totalMonths,
    lumpSum,
    extraMonthly
  );

  /* -------- Summary -------- */

  const totalPayment =
    schedule.reduce((sum, row) => sum + row.emi, 0) + lumpSum;

  const totalInterest = totalPayment - principal;

  const actualMonths = schedule.length;
  const years = Math.floor(actualMonths / 12);
  const months = actualMonths % 12;

  document.getElementById("emi").innerText = formatCurrency(emi);
  document.getElementById("totalInterest").innerText =
    formatCurrency(totalInterest);
  document.getElementById("totalPayment").innerText =
    formatCurrency(totalPayment);
  document.getElementById("loanDuration").innerText =
    years + " years " + months + " months";

  /* -------- Amortization Table -------- */

  const tbody = document.getElementById("amortizationBody");
  tbody.innerHTML = "";

  schedule.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${formatCurrency(row.emi)}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    `;
    tbody.appendChild(tr);
  });
});

/* ------------------------------
   Amortization Toggle
------------------------------ */

document
  .getElementById("toggleAmortization")
  .addEventListener("click", function () {
    const container = document.getElementById("amortizationContainer");
    container.classList.toggle("hidden");

    this.innerText = container.classList.contains("hidden")
      ? "View detailed amortization schedule"
      : "Hide amortization schedule";
  });

/* ------------------------------
   Init
------------------------------ */

attachIndianFormatter("principal", "principalHelp");
attachIndianFormatter("prepayment", "prepaymentHelp");
attachIndianFormatter("extraMonthly", "extraMonthlyHelp");
