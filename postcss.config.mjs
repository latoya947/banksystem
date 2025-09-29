/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'oklab-function': true,
        'color-function': { unresolved: 'warn' },
      },
    },
  },
}

export default config
