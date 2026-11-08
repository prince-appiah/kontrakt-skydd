import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { AppShell } from "@/features/shell/app-shell";
import { NotFound } from "@/features/shell/not-found";
import { RouteProvider } from "@/providers/router-provider";
import appCss from "@/styles/globals.css?url";

const themeScript = `(() => {
    const root = document.documentElement;
    if (root.dataset.themeSync) return;
    root.dataset.themeSync = "true";
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => root.classList.toggle("dark-mode", dark.matches);
    apply();
    dark.addEventListener("change", apply);
})();`;

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1.0" },
            {
                name: "description",
                content:
                    "Upload a contract and get its risky clauses explained. " +
                    "Personal data is redacted before analysis and nothing is stored.",
            },
            { title: "Kontrakt Skydd" },
        ],
        links: [
            { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
            { rel: "stylesheet", href: appCss },
        ],
        scripts: [{ children: themeScript }],
    }),
    shellComponent: RootDocument,
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="size-full bg-primary antialiased">
                {children}
                <Scripts />
            </body>
        </html>
    );
}

function RootComponent() {
    const [queryClient] = useState(
        () =>
            new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <RouteProvider>
                <AppShell>
                    <Outlet />
                </AppShell>
            </RouteProvider>
        </QueryClientProvider>
    );
}
