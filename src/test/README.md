# E2E Test Suite for Open Review Extension

This directory contains the end-to-end test infrastructure for the Open Review VS Code extension.

## Structure

```
src/test/
├── suite/              # Test suites
│   ├── index.ts       # Mocha test runner configuration
│   └── *.test.ts      # Test files
├── helpers/           # Test helper utilities
│   ├── assertionHelpers.ts    # Custom assertions
│   ├── extensionHelpers.ts    # Extension interaction helpers
│   ├── testWorkspace.ts       # Workspace setup/cleanup
│   └── threadHelpers.ts       # Thread manipulation helpers
├── fixtures/          # Sample files for testing
│   ├── sample.ts      # TypeScript sample
│   ├── sample.js      # JavaScript sample
│   └── sample.py      # Python sample
└── runTest.ts         # Test runner entry point
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with compilation
```bash
npm run pretest
```

### Debug tests in VS Code
1. Open the Run and Debug panel (Cmd+Shift+D / Ctrl+Shift+D)
2. Select "Extension Tests" from the dropdown
3. Press F5 to start debugging

## Writing Tests

Tests use Mocha with BDD-style syntax (`describe` and `it`):

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

describe('My Feature', () => {
  it('should do something', () => {
    assert.strictEqual(1 + 1, 2);
  });
});
```

### Using Test Helpers

```typescript
import { ExtensionTestHelper } from '../helpers/extensionHelpers';
import { ThreadTestHelper } from '../helpers/threadHelpers';
import { TestWorkspaceManager } from '../helpers/testWorkspace';

describe('Thread Creation', () => {
  const extensionHelper = new ExtensionTestHelper();
  const threadHelper = new ThreadTestHelper();
  const workspaceManager = new TestWorkspaceManager();

  before(async () => {
    await extensionHelper.activate();
  });

  after(async () => {
    await workspaceManager.cleanup();
  });

  it('should create a thread', async () => {
    // Your test code here
  });
});
```

## Test Configuration

- **Timeout**: 10 seconds per test
- **Slow threshold**: 2 seconds
- **UI**: BDD (describe/it)
- **Test pattern**: `**/**.test.js` in `out/test` directory

## CI/CD

Tests run automatically in GitHub Actions on:
- Push to main branch
- Pull requests
- Multiple platforms (Linux, macOS, Windows)

## Troubleshooting

### Tests not found
- Ensure tests are compiled: `npm run compile`
- Check test files match pattern `*.test.ts` in `src/test/suite/`

### Extension not activating
- Check that extension is properly built
- Verify `package.json` activation events

### Timeout errors
- Increase timeout in `src/test/suite/index.ts`
- Check for async operations without proper awaits
