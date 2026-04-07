import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#F3F7F5",
        sage: "#D7E5DE",
        pine: "#1D4D3F",
        ember: "#C56C43",
      },
      boxShadow: {
        panel: "0 20px 45px -24px rgba(17, 24, 39, 0.35)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

