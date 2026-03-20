import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <PageMeta title="Page Not Found" />
      <div className="text-center space-y-4">
        <p className="text-6xl font-black text-foreground tracking-tighter">404</p>
        <p className="text-sm text-muted-foreground">This page doesn't exist.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
