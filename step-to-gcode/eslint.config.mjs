import { eslintPresets } from '@lark-apaas/coding-presets'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '**/components/ui/**']),
  // 客户端：React + TypeScript
  ...eslintPresets.client.map(config => config.ignores ? config : {
    ...config,
    files: ['client/**/*.{ts,tsx}'],
  }),
  // 服务端：Node.js + TypeScript
  ...eslintPresets.server.map(config => config.ignores ? config : {
    ...config,
    files: ['server/**/*.ts', 'shared/**/*.ts'],
  }),
])
