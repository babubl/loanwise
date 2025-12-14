/* ============================================================
   LOANWISE — FINAL ADVISORY ENGINE (FRONTEND ONLY)
   World-class • Consumer-grade • Bank-demo ready
   ============================================================ */

/* =========================
   UTILITIES
========================= */

function num(val) {
  return Number(String(val || "").replace(/[^\d]/g, "")) || 0;
}

function fmt(n) {
  return "₹ " + Math.round(n).toLocaleString("en-IN");
}

function indianWords(n) {
  if (!n) return "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  let parts = [];
  if (crore) parts.push(crore + " crore");
  if (lakh) parts.push(lakh + " lakh");
  return parts.join(" ");
}

/* =========================
   INDIAN AMOUNT INPUT UX
========================= */

function attachIndianFormatter(input, helper) {
  input.addEventListener("input", () => {
    const raw = num(input.value);
    if (!raw) {
      input.value = "";
      helper.innerText = "";
      return;
    }
    input.value = raw.toLocaleString("en-IN");
    helper.innerText =
      fmt(raw) + (indianWords(raw) ? " · " + indianWords(raw) : "");
  });
}

/* =========================
   EMI & AMORTIZATION CORE
========================= */

function calculateEMI(P, annualRate, months) {
  const r = annualRate / 12 / 100;
  return (P * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

function amortize(P, rate, emi, months, extra = 0) {
  let balance = P;
  let r = rate / 12 / 100;
  let totalInterest = 0;
  let schedule = [];

  for (let m = 1; m <= months && balance > 0; m++) {
    let interest = balance * r;
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

function yearWise(schedule) {
  let years = [];
  let interest = 0, principal = 0, year = 1;

  schedule.forEach((row, i) => {
    interest += row.interest;
    principal += row.principal;

    if ((i + 1) % 12 === 0 || row.balance === 0) {
      years.push({
        year,
        interest,
        principal,
        balance: row.balance
      });
      year++;
      interest = 0;
      principal = 0;
    }
  });

  return years;
}

/* =========================
   SCENARIOS
========================= */

function baselineScenario(P, rate, months) {
  const emi = calculateEMI(P, rate, months);
  const result = amortize(P, rate, emi, months);
  return { emi, ...result };
}

function optimizedScenario(
  P, rate, months, lump, extra, mode
) {
  let balance = P - lump;
  if (balance < 0) balance = 0;

  let emi = calculateEMI(balance, rate, months);
  let r = rate / 12 / 100;
  let totalInterest = 0;
  let schedule = [];

  for (let m = 1; m <= months && balance > 0; m++) {
    let interest = balance * r;
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

    if (mode === "emi" && m === 1) {
      emi = calculateEMI(balance, rate, months - 1);
    }
  }

  return { emi, totalInterest, months: schedule.length, schedule };
}

/* =========================
   BANK SWITCHING
========================= */

function bankSwitch(P, r1, r2, months, cost) {
  const base = baselineScenario(P, r1, months);
  const alt = baselineScenario(P, r2, months);

  const net = base.totalInterest - alt.totalInterest - cost;

  let breakeven = null;
  let cum = -cost;

  for (let i = 0; i < base.schedule.length; i++) {
    cum += base.schedule[i].interest - alt.schedule[i].interest;
    if (cum > 0 && breakeven === null) {
      breakeven = i + 1;
      break;
    }
  }

  return { net, breakeven };
}

/* =========================
   STRESS TEST
========================= */

function stress(P, rate, months, shock) {
  const r = rate + shock;
  const emi = calculateEMI(P, r, months);
  const res = amortize(P, r, emi, months);
  return res.totalInterest;
}

/* =========================
   TAB SYSTEM
========================= */

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
  });
});

/* =========================
   MAIN CONTROLLER
========================= */

function analyze() {
  const P = num(principal.value);
  const rateVal = Number(rate.value);
  const months =
    tenureUnit.value === "years"
      ? Number(tenureValue.value) * 12
      : Number(tenureValue.value);

  if (!P || !rateVal || !months) {
    alert("Please enter loan amount, interest rate and tenure.");
    return;
  }

  const lump = num(prepayment.value);
  const extra = num(extraMonthly.value);
  const mode = reductionMode.value;
  const rent = num(rentInput.value);

  /* PLAN */
  const base = baselineScenario(P, rateVal, months);
  const opt = optimizedScenario(P, rateVal, months, lump, extra, mode);

  emi.innerText = fmt(base.emi);
  optEmi.innerText = fmt(opt.emi);
  interestSaved.innerText = fmt(base.totalInterest - opt.totalInterest);
  loanDuration.innerText =
    Math.floor(opt.months / 12) + "y " + (opt.months % 12) + "m";

  verdict.innerText =
    "By optimizing, you save " +
    fmt(base.totalInterest - opt.totalInterest) +
    " and close your loan earlier.";

  if (rent) {
    const gap = opt.emi - rent;
    verdict.innerText +=
      gap > 0
        ? ` Rent covers ${(rent / opt.emi * 100).toFixed(0)}% of EMI.`
        : " Rent fully covers EMI.";
  }

  /* COMPARE */
  cmpBaseEmi.innerText = fmt(base.emi);
  cmpOptEmi.innerText = fmt(opt.emi);
  cmpBaseInterest.innerText = fmt(base.totalInterest);
  cmpOptInterest.innerText = fmt(opt.totalInterest);
  cmpBaseDuration.innerText =
    Math.floor(base.months / 12) + "y";
  cmpOptDuration.innerText =
    Math.floor(opt.months / 12) + "y";

  cmpNetBenefit.innerText =
    fmt(base.totalInterest - opt.totalInterest) + " saved";

  /* SWITCH */
  const newRateVal = Number(newRate.value);
  if (newRateVal && newRateVal < rateVal) {
    const sw = bankSwitch(
      P, rateVal, newRateVal, months, num(switchCost.value)
    );
    switchVerdict.innerText =
      sw.net > 0
        ? `Switching saves ${fmt(sw.net)}. Break-even in ${sw.breakeven} months.`
        : "Switching is not financially beneficial.";
  } else {
    switchVerdict.innerText = "Switching analysis not applicable.";
  }

  /* RISK */
  risk025.innerText =
    "Extra interest: " +
    fmt(stress(P, rateVal, months, 0.25) - base.totalInterest);

  risk050.innerText =
    "Extra interest: " +
    fmt(stress(P, rateVal, months, 0.5) - base.totalInterest);

  risk100.innerText =
    "Extra interest: " +
    fmt(stress(P, rateVal, months, 1) - base.totalInterest);

  /* AMORTIZATION */
  amortizationBody.innerHTML = "";
  yearWise(opt.schedule).forEach(y => {
    amortizationBody.innerHTML += `
      <tr>
        <td>${y.year}</td>
        <td>${fmt(y.interest)}</td>
        <td>${fmt(y.principal)}</td>
        <td>${fmt(y.balance)}</td>
      </tr>
    `;
  });
}

/* =========================
   EVENT BINDINGS
========================= */

calculateBtn.addEventListener("click", analyze);

toggleAmortization.addEventListener("click", () => {
  amortizationContainer.classList.toggle("hidden");
});

/* =========================
   INIT FORMATTERS
========================= */

attachIndianFormatter(principal, principalHelp);
attachIndianFormatter(prepayment, prepaymentHelp);
attachIndianFormatter(extraMonthly, extraMonthlyHelp);
attachIndianFormatter(switchCost, switchCostHelp);
