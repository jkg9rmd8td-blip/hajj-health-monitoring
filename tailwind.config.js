module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255,255,255,0.06)",
        borderGlass: "rgba(255,255,255,0.12)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};
