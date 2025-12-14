// -------------------------------
// Utility Functions
// -------------------------------

function formatCurrency(value) {
  return "₹ " + Math.round(value).toLocaleString("en-IN");
}

// -------------------------------
// Core Loan Calculations
// -------------------------------

function calculateEMI(principal, annualRate, years) {
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return { emi, monthlyRate, months };
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

  for (let month = 1; month <= maxMonths && balance > 0; month++) {
    const interest = balance * monthlyRate;

    let principalPaid = emi - interest + extraMonthly;
    if (principalPaid > balance) {
      principalPaid = balance;
    }

    balance -= principalPaid;

    schedule.push({
      month,
      emi: emi + extraMonthly,
      principalPaid,
      interest,
      balance: balance > 0 ? balance : 0
    });
  }

  return schedule;
}

// -------------------------------
// Main Event Handler
// -------------------------------

document.getElementById("calculateBtn").addEventListener("click", function () {
  const principal = Number(document.getElementById("principal").value);
  const rate = Number(document.getElementById("rate").value);
  const tenureYears = Number(document.getElementById("tenure").value);
  const lumpSum = Number(document.getElementById("prepayment").value || 0);
  const extraMonthly = Number(
    document.getElementById("extraMonthly").value || 0
  );

  if (!principal || !rate || !tenureYears) {
    alert("Please enter valid loan details");
    return;
  }

  const { emi, monthlyRate, months } = calculateEMI(
    principal,
    rate,
    tenureYears
  );

  const schedule = generateAmortization(
    principal,
    emi,
    monthlyRate,
    months,
    lumpSum,
    extraMonthly
  );

  // -------------------------------
  // Summary Calculations
  // -------------------------------

  const totalPayment =
    schedule.reduce((sum, row) => sum + row.emi, 0) + lumpSum;

  const totalInterest = totalPayment - principal;

  const actualMonths = schedule.length;
  const years = Math.floor(actualMonths / 12);
  const remainingMonths = actualMonths % 12;

  // -------------------------------
  // Update Summary UI
  // -------------------------------

  document.getElementById("emi").innerText = formatCurrency(emi);

  document.getElementById("totalInterest").innerText =
    formatCurrency(totalInterest);

  document.getElementById("totalPayment").innerText =
    formatCurrency(totalPayment);

  document.getElementById("loanDuration").innerText =
    years + " years " + remainingMonths + " months";

  // -------------------------------
  // Render Amortization Table
  // -------------------------------

  const tbody = document.getElementById("amortizationBody");
  tbody.innerHTML = "";

  schedule.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${formatCurrency(row.emi)}</td>
      <td>${formatCurrency(row.principalPaid)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    `;

    tbody.appendChild(tr);
  });
});
