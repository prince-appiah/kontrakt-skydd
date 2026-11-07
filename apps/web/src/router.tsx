import { createRouter } from "@tanstack/react-router";
import { RouteError } from "@/features/shell/route-error";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
    const router = createRouter({
        routeTree,
        scrollRestoration: false,
        defaultErrorComponent: RouteError,
        defaultPreload: "intent",
        defaultPreloadStaleTime: 0,
    });

    return router;
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
