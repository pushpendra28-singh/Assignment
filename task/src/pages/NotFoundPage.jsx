import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="font-display text-[8rem] font-black text-border leading-none select-none">404</div>
        <h1 className="font-display text-3xl font-bold text-text-primary mt-4 mb-3">Page Not Found</h1>
        <p className="text-text-secondary mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className="btn btn-primary btn-lg">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}