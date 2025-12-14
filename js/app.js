/* ============================================================
   LOANWISE — HARDENED ADVISORY ENGINE
   Bank-grade • Explicit DOM • Robust • Frontend-only
   ============================================================ */

/* =========================
   DOM REFERENCES (EXPLICIT)
========================= */

const principalInput = document.getElementById("principal");
const principalHelp = document.getElementById("principalHelp");

const rateInput = document.getElementById("rate");

const tenureValueInput = document.getElementById("tenureValue");
const tenureUnitSelect = document.getElementById("tenureUnit");

const prepaymentInput = document.getElementById("prepayment");
const prepaymentHelp = document.getElementById("prepaymentHelp");

const extraMonthlyInput = document.getElementById("extraMonthly");
const extraMonthlyHelp = document.getElementById("extraMonthlyHelp");

const reductionModeSelect = document.getElementById("reductionMode");

const rentInput = document.getElementById("rentInput");

const newRateInput = document.getElementById("newRate");
const switchCostInput = document.getElementById("switchCost");
const switchCostHelp = document.getElementById("switchCostHelp");

const calculateBtn = document.getElementById("calculateBtn");

const emiEl = document.getElementById("emi");
const optEmiEl = document.getElementById("optEmi");
const interestSavedEl = document.getElementById("interestSaved");
const loanDurationEl = document.getElementById("loanDuration");
const verdictEl = document.getElementById("verdict");
const switchVerdictEl = document.getElementById("switchVerdict");

const risk025El = document.getElementById("risk025");
const risk050El = document.getElementById("risk050");
const risk100El = document.getElementById("risk100");

const amortizationToggle = document.getElementById("toggleAmortization");
const amortizationContainer = document.getElementById("amortizationContainer");
const amortizationBody = document.getElementById("amortizationBody");

/* =========================
   UTILITIES
========================= */

function parseCurrency(val) {
  return Number(String(val || "").replace(/[^\d]/g, "")) || 0;
}

function parsePercent(val) {
  return Number(val) || 0;
}

function formatINR(n) {
  return "₹ " + Math.round(n).toLocaleString("en-IN");
}

function amountInWords(n) {
  if (!n) return "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const parts = [];
  if (crore) parts.push(crore + " crore");
  if (lakh) parts.push(lakh + " lakh");
  return parts.join(" ");
}

/* =========================
   INPUT FORMATTERS
========================= */

function attachIndianFormatter(input, helper) {
  if (!input || !helper) return;

  input.addEventListener("input", () => {
    const value = parseCurrency(input.value);
    if (!value) {
      input.value = "";
      helper.textContent = "";
      return;
    }
    input.value = value.toLocaleString("en-IN");
    helper.textContent =
      formatINR(value) +
      (amountInWords(value) ? " · " + amountInWords(value) : "");
  });
}

/* =========================
   CORE CALCULATIONS
========================= */

function calculateEMI(P, annualRate, months) {
  if (months === 0) return 0;

  if (annualRate === 0) {
    return P / months;
  }

  const r = annualRate / 12 / 100;
  return (P * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

function amortize(P, annualRate, emi, months, extra = 0) {
  let balance = P;
  let totalInterest = 0;
  const schedule = [];

  const r = annualRate / 12 / 100;

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = annualRate === 0 ? 0 : balance * r;
    let principal = emi - interest + extra;

    if (principal > balance) principal = balance;

    balance -= principal;
    totalInterest += interest;

    schedule.push({
      month: m,
      interest,
      principal,
      balance: Math.max(balance, 0)
    });
  }

  return {
    schedule,
    totalInterest,
    months: schedule.length
  };
}

function yearlySummary(schedule) {
  let interest = 0;
  let principal = 0;
  let year = 1;

  return schedule.reduce((acc, row, idx) => {
    interest += row.interest;
    principal += row.principal;

    if ((idx + 1) % 12 === 0 || row.balance === 0) {
      acc.push({
        year,
        interest,
        principal,
        balance: row.balance
      });
      interest = 0;
      principal = 0;
      year++;
    }
    return acc;
  }, []);
}

/* =========================
   MAIN ANALYSIS
========================= */

function analyzeLoan() {

  const principal = parseCurrency(principalInput.value);
  const rate = parsePercent(rateInput.value);

  const tenureMonths =
    tenureUnitSelect.value === "years"
      ? Number(tenureValueInput.value) * 12
      : Number(tenureValueInput.value);

  if (!principal || !rate || !tenureMonths) {
    alert("Please enter loan amount, interest rate and tenure.");
    return;
  }

  const lumpSum = parseCurrency(prepaymentInput.value);
  const extraMonthly = parseCurrency(extraMonthlyInput.value);
  const reductionMode = reductionModeSelect.value;
  const rent = parseCurrency(rentInput.value);
  const newRate = parsePercent(newRateInput.value);
  const switchCost = parseCurrency(switchCostInput.value);

  /* ---------- BASE ---------- */

  const baseEmi = calculateEMI(principal, rate, tenureMonths);
  const base = amortize(principal, rate, baseEmi, tenureMonths);

  /* ---------- OPTIMIZED ---------- */

  let optPrincipal = Math.max(principal - lumpSum, 0);
  let optEmi = calculateEMI(optPrincipal, rate, tenureMonths);

  const optimized = amortize(
    optPrincipal,
    rate,
    optEmi,
    tenureMonths,
    extraMonthly
  );

  /* ---------- SUMMARY OUTPUT ---------- */

  emiEl.textContent = formatINR(baseEmi);
  optEmiEl.textContent = formatINR(optEmi);
  interestSavedEl.textContent =
    formatINR(base.totalInterest - optimized.totalInterest);

  loanDurationEl.textContent =
    Math.floor(optimized.months / 12) +
    " years " +
    (optimized.months % 12) +
    " months";

  /* ---------- DECISION TEXT ---------- */

  let message =
    "Based on your inputs, reducing principal through prepayments lowers your total interest by " +
    formatINR(base.totalInterest - optimized.totalInterest) +
    " and shortens the loan duration.";

  if (!lumpSum && !extraMonthly) {
    message =
      "With no prepayments, the loan runs its full tenure with total interest of " +
      formatINR(base.totalInterest) +
      ". Any early principal reduction meaningfully reduces this.";
  }

  if (rent) {
    const coverage = Math.round((rent / optEmi) * 100);
    message +=
      " Your rental income covers approximately " +
      coverage +
      "% of the EMI.";
  }

  verdictEl.textContent = message;

  /* ---------- BANK SWITCH ---------- */

  if (newRate && newRate < rate) {
    const altEmi = calculateEMI(principal, newRate, tenureMonths);
    const alt = amortize(principal, newRate, altEmi, tenureMonths);

    const netGain =
      base.totalInterest - alt.totalInterest - switchCost;

    switchVerdictEl.textContent =
      netGain > 0
        ? "Switching banks can save approximately " +
          formatINR(netGain) +
          " over the remaining loan period."
        : "After accounting for switching costs, changing banks does not provide a financial benefit.";
  } else {
    switchVerdictEl.textContent =
      "Bank switching analysis not applied.";
  }

  /* ---------- RATE RISK ---------- */

  const risk = shock =>
    amortize(
      principal,
      rate + shock,
      calculateEMI(principal, rate + shock, tenureMonths),
      tenureMonths
    ).totalInterest - base.totalInterest;

  risk025El.textContent = formatINR(risk(0.25));
  risk050El.textContent = formatINR(risk(0.5));
  risk100El.textContent = formatINR(risk(1));

  /* ---------- AMORTIZATION ---------- */

  const rows = yearlySummary(optimized.schedule)
    .map(y => `
      <tr>
        <td>${y.year}</td>
        <td>${formatINR(y.interest)}</td>
        <td>${formatINR(y.principal)}</td>
        <td>${formatINR(y.balance)}</td>
      </tr>
    `)
    .join("");

  amortizationBody.innerHTML = rows;
}

/* =========================
   EVENTS
========================= */

calculateBtn.addEventListener("click", analyzeLoan);

amortizationToggle.addEventListener("click", () => {
  amortizationContainer.classList.toggle("hidden");
  amortizationToggle.setAttribute(
    "aria-expanded",
    !amortizationContainer.classList.contains("hidden")
  );
});

/* =========================
   INIT FORMATTERS
========================= */

attachIndianFormatter(principalInput, principalHelp);
attachIndianFormatter(prepaymentInput, prepaymentHelp);
attachIndianFormatter(extraMonthlyInput, extraMonthlyHelp);
attachIndianFormatter(switchCostInput, switchCostHelp);
