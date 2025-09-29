import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    tailwindcss,
    autoprefixer,
    postcssPresetEnv({
      stage: 1,
      features: {
        'oklab-function': true,
        'color-function': { unresolved: 'warn' },
      },
    }),
  ],
}

export default config