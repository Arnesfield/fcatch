import _eslint from '@rollup/plugin-eslint';
import _typescript from '@rollup/plugin-typescript';
import { OutputOptions, RollupOptions } from 'rollup';
import cleanup from 'rollup-plugin-cleanup';
import dts from 'rollup-plugin-dts';
import esbuild, { Options as EsbuildOptions } from 'rollup-plugin-esbuild';
import outputSize from 'rollup-plugin-output-size';
import pkg from './package.json' with { type: 'json' };

// NOTE: remove once import errors are fixed for their respective packages
const eslint = _eslint as unknown as typeof _eslint.default;
const typescript = _typescript as unknown as typeof _typescript.default;

// skip sourcemap and umd unless production
const PROD = process.env.NODE_ENV !== 'development';
const WATCH = process.env.ROLLUP_WATCH === 'true';
const name = pkg.name.slice(pkg.name.lastIndexOf('/') + 1);
const input = 'src/index.ts';
const inputUmd = 'src/index.umd.ts';

function build(options: EsbuildOptions = {}) {
  return esbuild({ target: 'esnext', ...options });
}

function clean() {
  return cleanup({
    comments: ['some', 'sources', /__PURE__/],
    extensions: ['js', 'ts']
  });
}

function umd(options: Partial<OutputOptions>): OutputOptions {
  return {
    name,
    format: 'umd',
    exports: 'default',
    sourcemap: PROD,
    ...options
  };
}

function defineConfig(options: (false | RollupOptions)[]) {
  return options.filter((options): options is RollupOptions => !!options);
}

export default defineConfig([
  {
    input,
    output: [
      { file: pkg.main, format: 'cjs', exports: 'named', sourcemap: PROD },
      { file: pkg.module, format: 'esm', exports: 'named', sourcemap: PROD }
    ],
    plugins: [build(), clean(), outputSize()]
  },
  PROD && {
    input: inputUmd,
    output: umd({ file: pkg.unpkg.replace(/\.min\.js$/, '.js') }),
    plugins: [build(), clean(), outputSize()]
  },
  PROD && {
    input: inputUmd,
    output: umd({ file: pkg.unpkg }),
    plugins: [build({ minify: true }), clean(), outputSize()]
  },
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [dts(), outputSize()]
  },
  WATCH && {
    input,
    watch: { skipWrite: true },
    plugins: [eslint(), typescript()]
  }
]);
