import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export const NotFound = () => {
    const router = useRouter();

    return (
        <section className="flex flex-col items-start gap-6">
            <h1 className="text-display-sm font-semibold text-primary md:text-display-md">Page not found</h1>
            <div className="flex flex-wrap gap-3">
                <Button color="secondary" size="lg" iconLeading={ArrowLeft} onClick={() => router.history.back()}>
                    Go back
                </Button>
                <Button size="lg" href="/">
                    Home
                </Button>
            </div>
        </section>
    );
};
