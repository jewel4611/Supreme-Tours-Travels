/* Brand theme for the Tailwind CDN build. Colours come from the logo. */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink: '#0A2A3B', deep: '#064A68', sea: '#0A6A94', surf: '#3E93B8',
        sun: '#F5C518', sand: '#FFF4D0', paper: '#EEF3F6', leaf: '#3F7A5E'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        bangla: ['"Hind Siliguri"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        lift: '0 18px 40px -22px rgba(6,74,104,.55)',
        deep: '0 30px 70px -40px rgba(6,42,59,.85)'
      }
    }
  }
};
