import { Button } from "@/components/base/buttons/button";

export const RouteError = () => (
    <section className="flex flex-col items-start gap-6">
        <h1 className="text-display-sm font-semibold text-primary">Something went wrong</h1>
        <Button size="lg" href="/">
            Home
        </Button>
    </section>
);
