// Jest-only stub for @lwc/state. The Summer '26 SDK is not yet bundled
// with sfdx-lwc-jest, so tests resolve this stub via moduleNameMapper.
// Each test typically further overrides this via jest.mock(...).
export const defineState = () => null;
export const fromContext = () => ({ value: {} });
