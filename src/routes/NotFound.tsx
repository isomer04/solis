import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-8xl font-bold text-base-content/20">404</h1>
      <p className="text-xl font-medium">Page not found</p>
      <p className="text-base-content/60 text-sm">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary mt-2">
        Go Home
      </Link>
    </div>
  );
}
