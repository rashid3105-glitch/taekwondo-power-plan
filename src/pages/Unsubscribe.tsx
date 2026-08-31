import { Card, CardContent } from "@/components/ui/card";
import { MailX } from "lucide-react";

// Unsubscribe is handled by the hosted unsubscribe page linked in the footer
// of every app email. This page only explains that to anyone landing here
// from an old link.
const Unsubscribe = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <Card className="max-w-md w-full">
      <CardContent className="pt-6 text-center space-y-4">
        <MailX className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-xl font-bold text-foreground">Unsubscribe</h1>
        <p className="text-muted-foreground text-sm">
          To stop receiving emails from us, use the unsubscribe link at the bottom of any
          email you have received. It opens a secure page where you can confirm with one click.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default Unsubscribe;
