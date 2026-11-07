import { config } from "@repo/eslint-config/react-internal";

export default [...config, { ignores: ["src/routeTree.gen.ts", ".output/**", "dist/**"] }];
