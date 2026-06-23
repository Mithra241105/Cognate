import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                neo: "#e8e8e8",
            },
            boxShadow: {
                "neo-convex":  "20px 20px 60px #bebebe, -20px -20px 60px #ffffff",
                "neo-concave": "inset 10px 10px 20px #bebebe, inset -10px -10px 20px #ffffff",
                "neo-convex-sm": "6px 6px 14px #bebebe, -6px -6px 14px #ffffff",
                "neo-concave-sm": "inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
} satisfies Config;
