const base = require('@hodfords/nestjs-eslint-config');

module.exports = [
    ...base,
    {
        files: ['**/*.spec.ts'],
        rules: {
            'max-lines-per-function': 'off',
            '@typescript-eslint/naming-convention': 'off'
        }
    },
    {
        files: ['src/modules/**/*.ts', 'src/common/**/*.ts'],
        rules: {
            '@typescript-eslint/naming-convention': 'off'
        }
    },
    {
        files: [
            'src/modules/inference/inference.controller.ts',
            'src/modules/inference/inference.service.ts',
            'src/modules/llm/services/llm-agent.service.ts'
        ],
        rules: {
            'max-lines-per-function': 'off'
        }
    }
];
