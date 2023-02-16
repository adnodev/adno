/** @type {import('tailwindcss').Config} */
module.exports = {
  content:  ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    button : {
      backgroundColor: "red"
    },
    extend: {},
  },
  plugins: [require("daisyui")],
}
