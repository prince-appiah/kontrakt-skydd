import type { PropsWithChildren } from "react";
import { useRouter } from "@tanstack/react-router";
import { RouterProvider } from "react-aria-components";

export const RouteProvider = ({ children }: PropsWithChildren) => {
    const router = useRouter();

    return (
        <RouterProvider navigate={(href) => router.navigate({ to: href })} useHref={(href) => router.buildLocation({ to: href }).href}>
            {children}
        </RouterProvider>
    );
};
