import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs({
      include: /node_modules/,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['**/*.test.tsx', '**/*.test.ts', '**/*.stories.tsx'],
    }),
    terser(),
  ],
  external: (id) => {
    // Исключаем все Material-UI импорты
    if (id.startsWith('@mui/')) return true;
    if (id.startsWith('@emotion/')) return true;
    if (id === 'react' || id === 'react-dom') return true;
    if (id.startsWith('react/')) return true;
    if (id.startsWith('react-dom/')) return true;
    return false;
  },
  onwarn(warning, warn) {
    // Игнорируем предупреждения о 'use client' директивах
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
      return;
    }
    warn(warning);
  },
};