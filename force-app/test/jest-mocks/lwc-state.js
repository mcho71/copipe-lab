// Jest-only stub for @lwc/state. The Summer '26 SDK is not yet bundled
// with sfdx-lwc-jest, so tests resolve this stub via moduleNameMapper.
// Each test typically further overrides this via jest.mock(...).
//
// defineState(factory) returns a callable factory (real behavior); calling it
// produces a state-manager instance. We return a no-op factory whose instance
// is null — tests that need actual store behavior override this via jest.mock.
export const defineState = () => () => null;
export const fromContext = () => ({ value: {} });
