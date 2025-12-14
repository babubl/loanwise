import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Header />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          Home Loan Calculator
        </h1>

        <p style={{ color: "#4b5563", maxWidth: "700px" }}>
          Calculate EMI, view amortization schedule, and make better
          decisions about prepayment and home loan optimization.
        </p>
      </main>

      <Footer />
    </>
  );
}
