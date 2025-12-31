module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Custom Theme Colors
        mustard: {
          50: "#FFF9E6",
          100: "#FFF2CC",
          200: "#FFE699",
          300: "#FFD966",
          400: "#FFCC33",
          500: "#FFBF00", 
          600: "#E6AC00",
          700: "#CC9900",
          800: "#B38600",
          900: "#997300",
          950: "#7A5C00",
        },
        
        scarlet: {
          50: "#FFE6E6",
          100: "#FFCCCC",
          200: "#FF9999",
          300: "#FF6666",
          400: "#FF3333",
          500: "#FF0000", 
          600: "#E60000",
          700: "#CC0000",
          800: "#B30000",
          900: "#990000",
        },
        
        royal: {
          50: "#E6F0FF",
          100: "#CCE0FF",
          200: "#99C2FF",
          300: "#66A3FF",
          400: "#3385FF",
          500: "#0066FF", 
          600: "#005CE6",
          700: "#004DCC",
          800: "#003DB3",
          900: "#002E99",
        },
        
        // Neutral palette
        neutral: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },

        // Legacy colors for backward compatibility
        primary: {
          50: "#E6F0FF",
          100: "#CCE0FF",
          200: "#99C2FF",
          300: "#66A3FF",
          400: "#3385FF",
          500: "#0066FF", 
          600: "#005CE6",
          700: "#004DCC",
          800: "#003DB3",
          900: "#002E99",
        },
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },

      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.06)",
        card: "0 6px 30px rgba(0,0,0,0.08)",
        "mustard-glow": "0 0 20px rgba(255, 191, 0, 0.3)",
        "scarlet-glow": "0 0 20px rgba(255, 0, 0, 0.3)",
        "royal-glow": "0 0 20px rgba(0, 102, 255, 0.3)",
      },

      fontFamily: {
        sans: ['"Neulis Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      // Custom gradients
      backgroundImage: {
        'mustard-gradient': 'linear-gradient(135deg, #FFBF00 0%, #FFCC33 100%)',
        'scarlet-gradient': 'linear-gradient(135deg, #FF0000 0%, #FF3333 100%)',
        'royal-gradient': 'linear-gradient(135deg, #0066FF 0%, #3385FF 100%)',
        'theme-gradient': 'linear-gradient(135deg, #FFBF00 0%, #FF0000 50%, #0066FF 100%)',
      },
    },
  },
  plugins: [],
};