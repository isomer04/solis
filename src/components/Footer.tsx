export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer footer-center bg-base-300 text-base-content p-4 fixed bottom-0 z-40">
      <aside>
        <p className="text-sm">Copyright &copy; Solis {currentYear}</p>
      </aside>
    </footer>
  );
}
