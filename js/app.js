function calculateEMI(principal, annualRate, years) {
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  return {
    emi,
    totalPayment,
    totalInterest
  };
}

document.getElementById("calculateBtn").addEventListener("click", function () {
  const principal = Number(document.getElementById("principal").value);
  const rate = Number(document.getElementById("rate").value);
  const tenure = Number(document.getElementById("tenure").value);

  if (!principal || !rate || !tenure) {
    alert("Please enter all values");
    return;
  }

  const result = calculateEMI(principal, rate, tenure);

  document.getElementById("emi").innerText =
    "₹ " + result.emi.toFixed(0).toLocaleString();

  document.getElementById("totalInterest").innerText =
    "₹ " + result.totalInterest.toFixed(0).toLocaleString();

  document.getElementById("totalPayment").innerText =
    "₹ " + result.totalPayment.toFixed(0).toLocaleString();
});
