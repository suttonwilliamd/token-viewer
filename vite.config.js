import { defineConfig } from 'vite';

export default defineConfig({
  // The large local vocabulary is data, not thousands of named JS exports.
  json: { stringify: true, namedExports: false },
});
