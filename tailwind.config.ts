import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { paper: "#E9EDF0", ink: "#1B2430", stamp: "#B3261E", slate2: "#5B6773", line: "#C9D1D8" },
      fontFamily: { sans: ["var(--font-bricolage)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
