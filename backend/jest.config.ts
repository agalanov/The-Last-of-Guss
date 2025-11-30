import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    roots: ['<rootDir>/src'],
    setupFiles: ['<rootDir>/jest.setup.integration.ts'],
};

export default config;
