export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "3rem",
        padding: "1.5rem",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "0.875rem",
      }}
    >
      © {new Date().getFullYear()} Loanwise. All rights reserved.
    </footer>
  );
}
