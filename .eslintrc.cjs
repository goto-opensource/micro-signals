module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        // Prettier must be last to override other configs
        'plugin:prettier/recommended',
    ],
    ignorePatterns: ['**/*.d.ts'],
    settings: {
        'import/extensions': ['.js', '.jsx'],
    },
    env: {
        browser: true,
        commonjs: true,
        es6: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2018,
    },
    plugins: ['@typescript-eslint', 'mocha', 'simple-import-sort', 'import'],
    rules: {
        '@typescript-eslint/ban-types': ['off'],
        '@typescript-eslint/explicit-member-accessibility': [
            'warn',
            {
                overrides: {
                    constructors: 'no-public',
                    parameterProperties: 'off',
                },
            },
        ],
        '@typescript-eslint/member-ordering': [
            'warn',
            {
                default: [
                    'private-static-field',
                    'protected-static-field',
                    'public-static-field',
                    'private-instance-field',
                    'protected-instance-field',
                    'public-instance-field',
                    'public-static-method',
                    'protected-static-method',
                    'private-static-method',
                    'private-constructor',
                    'protected-constructor',
                    'public-constructor',
                    'public-instance-method',
                    'protected-instance-method',
                    'private-instance-method',
                ],
            },
        ],
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'method',
                modifiers: ['private'],
                format: ['camelCase'],
                leadingUnderscore: 'require',
            },
            {
                selector: 'memberLike',
                modifiers: ['private'],
                format: ['camelCase'],
                leadingUnderscore: 'require',
            },
            {
                selector: 'method',
                modifiers: ['static'],
                format: ['camelCase'],
            },
            {
                selector: 'property',
                modifiers: ['static'],
                format: ['UPPER_CASE'],
            },
        ],
        '@typescript-eslint/no-empty-interface': ['off'],
        '@typescript-eslint/no-explicit-any': ['off'],
        '@typescript-eslint/no-non-null-assertion': ['off'],
        '@typescript-eslint/no-shadow': [
            'warn',
            {
                builtinGlobals: true,
                hoist: 'all',
            },
        ],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
            },
        ],
        '@typescript-eslint/no-use-before-define': ['warn', 'nofunc'],
        'comma-dangle': [
            'warn',
            {
                arrays: 'always-multiline',
                objects: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                functions: 'never',
            },
        ],
        indent: 0,
        semi: ['warn', 'always'],
        'mocha/no-exclusive-tests': 'error',
        'no-template-curly-in-string': 'warn',
        'prettier/prettier': [
            'warn',
            {
                printWidth: 100,
                parser: 'typescript',
                useTabs: false,
                semi: true,
                singleQuote: true,
                trailingComma: 'es5',
                bracketSpacing: true,
                arrowParens: 'always',
                tabWidth: 4,
            },
        ],
        'simple-import-sort/imports': [
            'warn',
            {
                groups: [
                    // internal imports
                    ['^@getgo/.*$'],
                    // Anything not matched in another group.
                    ['^'],
                    // parent imports. Put `..` first.
                    ['^\\.\\.$', '^\\.\\./.*$'],
                    // Other relative imports. Put `.` first.
                    ['^\\.$', '^\\./.*$'],
                ],
            },
        ],
        'import/no-absolute-path': [2, { esmodule: true, amd: false, commonjs: true }],
        'import/no-named-as-default': [2],
        'import/no-commonjs': [1],
        'import/no-duplicates': [2],
        'import/extensions': [2, 'ignorePackages', { js: 'always' }],
    },
};
