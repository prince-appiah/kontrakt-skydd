import { type PropsWithChildren, useEffect, useRef } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ShieldTick } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export const AppShell = ({ children }: PropsWithChildren) => {
    const pathname = useRouterState({ select: (state) => state.resolvedLocation?.pathname });
    const main = useRef<HTMLElement>(null);
    const previousPathname = useRef(pathname);

    useEffect(() => {
        const previous = previousPathname.current;
        previousPathname.current = pathname;
        if (previous === undefined || previous === pathname) {
            return;
        }
        const heading = main.current?.querySelector("h1");
        heading?.setAttribute("tabindex", "-1");
        heading?.focus();
    }, [pathname]);

    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            <a
                href="#main"
                className={cx(
                    "sr-only rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary",
                    "shadow-lg outline-brand focus:not-sr-only focus:fixed focus:top-4",
                    "focus:left-4 focus:z-50 focus-visible:outline-2",
                    "focus-visible:outline-offset-2",
                )}
            >
                Skip to content
            </a>
            <header className="border-b border-secondary">
                <div className="mx-auto flex h-16 w-full max-w-container items-center px-4 md:px-8">
                    <Link
                        to="/"
                        className={cx(
                            "flex items-center gap-2 rounded-md text-md font-semibold text-primary",
                            "outline-brand focus-visible:outline-2 focus-visible:outline-offset-2",
                        )}
                    >
                        <ShieldTick aria-hidden="true" className="size-6 text-brand-secondary" />
                        Clause Guard
                    </Link>
                </div>
            </header>
            <main
                ref={main}
                id="main"
                tabIndex={-1}
                className={cx(
                    "mx-auto w-full max-w-container flex-1 px-4 py-8 outline-none md:px-8 md:py-12",
                    "[&_h1:focus]:outline-none",
                )}
            >
                {children}
            </main>
        </div>
    );
};
