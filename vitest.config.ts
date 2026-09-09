import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({resolve:{alias:{app:path.resolve('src/app'),assets:path.resolve('src/assets')}},test:{globals:true,include:['tests/**/*.test.ts','tests/**/*.spec.ts'],testTimeout:30000,maxWorkers:1}});
