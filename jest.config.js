const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');

module.exports = {
    ...jestConfig,
    modulePathIgnorePatterns: ['<rootDir>/.localdevserver'],
    moduleNameMapper: {
        ...(jestConfig.moduleNameMapper || {}),
        '^@lwc/state$': '<rootDir>/force-app/test/jest-mocks/lwc-state.js'
    }
};
