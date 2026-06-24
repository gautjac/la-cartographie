/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // La Cartographie du Goût — a celestial atlas. Deep night, engraved ivory,
        // a gold for what you love and a luminous rose for the adjacent unknown.
        night: {
          DEFAULT: "#0a0e1a",
          deep: "#06080f",
          raised: "#121829",
          line: "#1d2540",
        },
        ivory: {
          DEFAULT: "#f3ecda",
          soft: "#ddd6c4",
          dim: "#b3ad9b",
        },
        haze: "#79839f",
        // rating accents (the star palette)
        amour: "#f0c761", // coup de cœur — gold
        aime: "#74c8c0", // j'aime — teal
        bof: "#8089a6", // bof — slate
        non: "#b5705f", // non — dim rust
        // the adjacent unknown
        lueur: {
          DEFAULT: "#ef6f9c",
          soft: "#f7a6c2",
        },
        compass: "#86a8e0", // axis / grid accent
      },
      fontFamily: {
        display: ['"Bodoni Moda"', "Didot", "Georgia", "serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        halo: "0 0 0 1px rgba(243,236,218,0.06), 0 18px 50px -20px rgba(0,0,0,0.8)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        pulseStar: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.18)" },
        },
        drawIn: {
          "0%": { strokeDashoffset: "1" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        riseIn: "riseIn 0.45s ease-out both",
        twinkle: "twinkle 3.2s ease-in-out infinite",
        pulseStar: "pulseStar 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
