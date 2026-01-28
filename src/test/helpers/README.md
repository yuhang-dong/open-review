# Test Helpers

This directory contains helper utilities for testing the Open Review extension.

## Overview

The test helpers provide a structured way to:
- Set up and tear down test workspaces
- Activate and interact with the extension
- Create and manipulate comment threads
- Make custom assertions
- Build test data

## Helpers

### TestWorkspaceManager

Manages temporary test workspaces with files and folders.

**Usage:**

```typescript
import { TestWorkspaceManager } from '../helpers';

const workspaceManager = new TestWorkspaceManager();

// Setup workspace with files
const workspaceUri = await workspaceManager.setup({
  files: [
    { path: 'src/test.ts', content: 'export const foo = 42;' },
    { path: 'README.md', content: '# Test Project' }
  ],
  folders: ['src', 'tests']
});

// Get file path
const filePath = workspaceManager.getFilePath('src/test.ts');

// Cleanup after test
await workspaceManager.cleanup();
```

### ExtensionTestHelper

Provides utilities for activating and interacting with the extension.

**Usage:**

```typescript
import { ExtensionTestHelper } from '../helpers';

const extensionHelper = new ExtensionTestHelper();

// Activate extension
await extensionHelper.activate();

// Execute command
await extensionHelper.executeCommand('openReview.createComment', reply);

// Get thread manager (for testing)
const threadManager = extensionHelper.getThreadManager();

// Get sidebar provider (for testing)
const sidebarProvider = extensionHelper.getSidebarProvider();
```

### ThreadTestHelper

Provides utilities for creating and manipulating comment threads.

**Usage:**

```typescript
import { ThreadTestHelper } from '../helpers';

const threadHelper = new ThreadTestHelper(extensionHelper);

// Create a thread
const threadId = await threadHelper.createThread(
  fileUri,
  10, // line number
  'This is a comment',
  'Test User'
);

// Reply to thread
await threadHelper.replyToThread(threadId, 'This is a reply', 'Another User');

// Resolve thread
await threadHelper.resolveThread(threadId);

// Reopen thread
await threadHelper.reopenThread(threadId);

// Delete thread
await threadHelper.deleteThread(threadId);

// Get all thread IDs
const threadIds = threadHelper.getAllThreadIds();

// Get thread by ID
const thread = threadHelper.getThreadById(threadId);
```

### AssertionHelper

Provides custom assertions for extension-specific validations.

**Usage:**

```typescript
import { AssertionHelper } from '../helpers';

// Assert thread exists
AssertionHelper.assertThreadExists(threadId, threads);

// Assert thread has expected number of comments
AssertionHelper.assertThreadHasComments(thread, 3);

// Assert thread status
AssertionHelper.assertThreadStatus(thread, 'resolved');

// Assert comment content
AssertionHelper.assertCommentContent(comment, 'Expected content');

// Assert thread location
AssertionHelper.assertThreadLocation(thread, 'src/test.ts', 10);

// Assert command executes without error
await AssertionHelper.assertCommandExecutes('openReview.createComment', reply);

// Assert condition eventually becomes true
await AssertionHelper.assertEventuallyTrue(
  () => threadManager.getAllThreads().length > 0,
  3000, // timeout in ms
  'Threads should be created'
);
```

## Test Fixtures

### ThreadBuilder

Provides a fluent API for building test thread data.

**Usage:**

```typescript
import { createThreadBuilder } from '../fixtures';

const builder = createThreadBuilder();

// Build a simple thread
const thread = builder
  .withFilePath('/test/file.ts')
  .withLine(10)
  .withComment('Test comment', 'Test User')
  .withStatus('open')
  .build();

// Build a thread with multiple comments
const threadWithReplies = builder
  .withFilePath('/test/file.ts')
  .withLine(20)
  .withComments([
    { content: 'First comment', author: 'User 1' },
    { content: 'Reply 1', author: 'User 2' },
    { content: 'Reply 2', author: 'User 3' }
  ])
  .withStatus('resolved')
  .build();

// Build a mock thread for testing
const mockThread = builder
  .withFilePath('/test/file.ts')
  .withLine(30)
  .withComment('Mock comment')
  .buildMock();

// Reset builder for reuse
builder.reset();
```

### Sample Files

Pre-defined sample file contents for testing:

```typescript
import { SAMPLE_TYPESCRIPT, SAMPLE_JAVASCRIPT, SAMPLE_PYTHON } from '../fixtures';

// Use in workspace setup
await workspaceManager.setup({
  files: [
    { path: 'test.ts', content: SAMPLE_TYPESCRIPT },
    { path: 'test.js', content: SAMPLE_JAVASCRIPT },
    { path: 'test.py', content: SAMPLE_PYTHON }
  ]
});
```

## Example Test

Here's a complete example of using the helpers in a test:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { 
  TestWorkspaceManager, 
  ExtensionTestHelper, 
  ThreadTestHelper,
  AssertionHelper 
} from '../helpers';
import { createThreadBuilder, SAMPLE_TYPESCRIPT } from '../fixtures';

suite('Comment Thread Tests', () => {
  let workspaceManager: TestWorkspaceManager;
  let extensionHelper: ExtensionTestHelper;
  let threadHelper: ThreadTestHelper;

  setup(async () => {
    // Setup workspace
    workspaceManager = new TestWorkspaceManager();
    await workspaceManager.setup({
      files: [{ path: 'test.ts', content: SAMPLE_TYPESCRIPT }]
    });

    // Activate extension
    extensionHelper = new ExtensionTestHelper();
    await extensionHelper.activate();

    // Create thread helper
    threadHelper = new ThreadTestHelper(extensionHelper);
  });

  teardown(async () => {
    await workspaceManager.cleanup();
  });

  test('creates and retrieves thread', async () => {
    const fileUri = vscode.Uri.file(workspaceManager.getFilePath('test.ts'));
    
    // Create thread
    const threadId = await threadHelper.createThread(
      fileUri,
      5,
      'Test comment',
      'Test User'
    );

    // Verify thread exists
    const thread = threadHelper.getThreadById(threadId);
    assert.ok(thread, 'Thread should exist');
    
    // Verify thread properties
    AssertionHelper.assertThreadLocation(thread, fileUri.fsPath, 5);
    AssertionHelper.assertThreadHasComments(thread, 1);
  });
});
```

## Best Practices

1. **Always cleanup**: Use `teardown()` to cleanup workspaces and resources
2. **Wait for async operations**: Use `AssertionHelper.assertEventuallyTrue()` for async conditions
3. **Reuse helpers**: Create helpers in `setup()` and reuse across tests
4. **Use builders**: Use `ThreadBuilder` for complex test data
5. **Test isolation**: Each test should start with a clean workspace

## Notes

- All helpers are designed to work with the VS Code Extension Development Host
- Tests run in a real VS Code environment with full API access
- The extension must be activated before using ThreadTestHelper
- Workspace cleanup is important to prevent test interference
