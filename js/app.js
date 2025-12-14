/* ============================================================
   LOANWISE — FINAL WORKING ADVISORY JS
   Decision-first • Professional • Frontend-only
   ============================================================ */

/* =========================
   UTILITIES
========================= */

function cleanNumber(val) {
  return Number(String(val || "").replace(/[^\d]/g, "")) || 0;
}

function formatINR(n) {
  return "₹ " + Math.round(n).toLocaleString("en-IN");
}

function amountInWords(n) {
  if (!n) return "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  let parts = [];
  if (crore) parts.push(crore + " crore");
  if (lakh) parts.push(lakh + " lakh");
  return parts.join(" ");
}

/* =========================
   INDIAN NUMBER FORMATTER
========================= */

function attachFormatter(input, helper) {
  if (!input || !helper) return;

  input.addEventListener("input", () => {
    const val = cleanNumber(input.value);
    if (!val) {
      input.value = "";
      helper.innerText = "";
      return;
    }
    input.value = val.toLocaleString("en-IN");
    helper.innerText =
      formatINR(val) +
      (amountInWords(val) ? " · " + amountInWords(val) : "");
  });
}

/* =========================
   CORE LOAN CALCULATIONS
========================= */

function calculateEMI(P, rate, months) {
  const r = rate / 12 / 100;
  return (P * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

function amortization(P, rate, emi, months, extra = 0) {
  let balance = P;
  let totalInterest = 0;
  const r = rate / 12 / 100;
  const schedule = [];

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = balance * r;
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
  let years = [];
  let i = 0, p = 0, y = 1;

  schedule.forEach((row, idx) => {
    i += row.interest;
    p += row.principal;
    if ((idx + 1) % 12 === 0 || row.balance === 0) {
      years.push({
        year: y++,
        interest: i,
        principal: p,
        balance: row.balance
      });
      i = 0;
      p = 0;
    }
  });

  return years;
}

/* =========================
   MAIN ANALYSIS
========================= */

function analyzeLoan() {

  /* ---------- BASIC INPUTS ---------- */

  const P = cleanNumber(principal.value);
  const rateVal = Number(rate.value);
  const tenureMonths =
    tenureUnit.value === "years"
      ? Number(tenureValue.value) * 12
      : Number(tenureValue.value);

  if (!P || !rateVal || !tenureMonths) {
    alert("Please enter loan amount, interest rate and tenure.");
    return;
  }

  /* ---------- OPTIONAL INPUTS ---------- */

  const lumpSum = cleanNumber(prepayment.value);
  const extraMonthlyVal = cleanNumber(extraMonthly.value);
  const reductionModeVal = reductionMode.value;
  const rentVal = cleanNumber(rentInput.value);
  const newRateVal = Number(newRate.value);
  const switchCostVal = cleanNumber(switchCost.value);

  /* ---------- BASE SCENARIO ---------- */

  const baseEmi = calculateEMI(P, rateVal, tenureMonths);
  const baseResult = amortization(P, rateVal, baseEmi, tenureMonths);

  /* ---------- OPTIMIZED SCENARIO ---------- */

  let optPrincipal = P - lumpSum;
  if (optPrincipal < 0) optPrincipal = 0;

  let optEmiVal = calculateEMI(optPrincipal, rateVal, tenureMonths);
  let optResult = amortization(
    optPrincipal,
    rateVal,
    optEmiVal,
    tenureMonths,
    extraMonthlyVal
  );

  /* ---------- OUTPUT: SUMMARY ---------- */

  emi.innerText = formatINR(baseEmi);
  optEmi.innerText = formatINR(optEmiVal);
  interestSaved.innerText =
    formatINR(baseResult.totalInterest - optResult.totalInterest);

  loanDuration.innerText =
    Math.floor(optResult.months / 12) +
    " years " +
    (optResult.months % 12) +
    " months";

  /* ---------- DECISION TEXT ---------- */

  let decisionText =
    "Based on your inputs, applying prepayments reduces your total interest by " +
    formatINR(baseResult.totalInterest - optResult.totalInterest) +
    " and shortens the loan duration.";

  if (!lumpSum && !extraMonthlyVal) {
    decisionText =
      "With no prepayments, your loan will run for the full tenure with total interest of " +
      formatINR(baseResult.totalInterest) +
      ". Any principal reduction will meaningfully reduce this.";
  }

  if (rentVal) {
    const coverage = Math.round((rentVal / optEmiVal) * 100);
    decisionText +=
      " Your rental income covers approximately " +
      coverage +
      "% of your EMI.";
  }

  verdict.innerText = decisionText;

  /* ---------- BANK SWITCHING ---------- */

  if (newRateVal && newRateVal < rateVal) {
    const altEmi = calculateEMI(P, newRateVal, tenureMonths);
    const altResult = amortization(P, newRateVal, altEmi, tenureMonths);
    const netGain =
      baseResult.totalInterest - altResult.totalInterest - switchCostVal;

    switchVerdict.innerText =
      netGain > 0
        ? "Switching to a lower rate can save approximately " +
          formatINR(netGain) +
          " over the loan tenure."
        : "After considering switching costs, switching banks is not financially beneficial.";
  } else {
    switchVerdict.innerText =
      "Bank switching analysis was not applied.";
  }

  /* ---------- INTEREST RATE RISK ---------- */

  risk025.innerText =
    formatINR(
      amortization(P, rateVal + 0.25,
        calculateEMI(P, rateVal + 0.25, tenureMonths),
        tenureMonths
      ).totalInterest - baseResult.totalInterest
    );

  risk050.innerText =
    formatINR(
      amortization(P, rateVal + 0.5,
        calculateEMI(P, rateVal + 0.5, tenureMonths),
        tenureMonths
      ).totalInterest - baseResult.totalInterest
    );

  risk100.innerText =
    formatINR(
      amortization(P, rateVal + 1,
        calculateEMI(P, rateVal + 1, tenureMonths),
        tenureMonths
      ).totalInterest - baseResult.totalInterest
    );

  /* ---------- AMORTIZATION ---------- */

  amortizationBody.innerHTML = "";
  yearlySummary(optResult.schedule).forEach(y => {
    amortizationBody.innerHTML += `
      <tr>
        <td>${y.year}</td>
        <td>${formatINR(y.interest)}</td>
        <td>${formatINR(y.principal)}</td>
        <td>${formatINR(y.balance)}</td>
      </tr>
    `;
  });
}

/* =========================
   EVENTS
========================= */

calculateBtn.addEventListener("click", analyzeLoan);

toggleAmortization.addEventListener("click", () => {
  amortizationContainer.classList.toggle("hidden");
});

/* =========================
   INIT FORMATTERS
========================= */

attachFormatter(principal, principalHelp);
attachFormatter(prepayment, prepaymentHelp);
attachFormatter(extraMonthly, extraMonthlyHelp);
attachFormatter(switchCost, switchCostHelp);
