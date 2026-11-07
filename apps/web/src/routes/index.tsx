import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/pages/home-screen";

export const Route = createFileRoute("/")({
    component: HomeScreen,
});
