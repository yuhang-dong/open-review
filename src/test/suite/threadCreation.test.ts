import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fc from 'fast-check';
import { 
	TestWorkspaceManager, 
	ExtensionTestHelper, 
	ThreadTestHelper 
} from '../helpers';
import { SAMPLE_TYPESCRIPT } from '../fixtures';

describe('Comment Thread Creation Tests', () => {
	let workspaceManager: TestWorkspaceManager;
	let extensionHelper: ExtensionTestHelper;
	let threadHelper: ThreadTestHelper;
	let testFileUri: vscode.Uri;

	beforeEach(async () => {
		// Set up test workspace
		workspaceManager = new TestWorkspaceManager();
		await workspaceManager.setup({
			files: [
				{ path: 'test.ts', content: SAMPLE_TYPESCRIPT },
				{ path: 'test2.ts', content: SAMPLE_TYPESCRIPT }
			]
		});

		// Activate extension
		extensionHelper = new ExtensionTestHelper();
		await extensionHelper.activate();

		// Create thread helper
		threadHelper = new ThreadTestHelper(extensionHelper);

		// Get test file URI
		testFileUri = vscode.Uri.file(workspaceManager.getFilePath('test.ts'));
	});

	afterEach(async () => {
		// Clean up workspace
		await workspaceManager.cleanup();
	});

	// Task 4.1: Write test for basic thread creation
	it('creates thread at specific line with correct metadata', async () => {
		const lineNumber = 5;
		const content = 'Test comment at line 5';

		// Create thread (author will be system username)
		const threadId = await threadHelper.createThread(
			testFileUri,
			lineNumber,
			content
		);

		// Verify thread was created
		assert.ok(threadId, 'Thread should have an ID');

		// Get the thread
		const thread = threadHelper.getThreadById(threadId);

		// Verify thread has correct file path
		assert.strictEqual(
			thread.uri.toString(),
			testFileUri.toString(),
			'Thread should have correct file URI'
		);

		// Verify thread has correct line number
		assert.ok(thread.range, 'Thread should have a range');
		assert.strictEqual(
			thread.range.start.line,
			lineNumber,
			'Thread should be at correct line number'
		);

		// Verify thread has unique ID
		assert.ok(thread.customId, 'Thread should have a unique custom ID');
		assert.strictEqual(thread.customId, threadId, 'Thread ID should match returned ID');

		// Verify thread has correct content
		assert.strictEqual(thread.comments.length, 1, 'Thread should have one comment');
		const comment = thread.comments[0];
		const commentBody = typeof comment.body === 'string' ? comment.body : comment.body.value;
		assert.strictEqual(commentBody, content, 'Comment should have correct content');

		// Verify thread has an author (will be system username)
		assert.ok(comment.author.name, 'Comment should have an author name');
	});

	it('creates thread with unique ID', async () => {
		// Create first thread
		const threadId1 = await threadHelper.createThread(
			testFileUri,
			1,
			'First comment',
			'User 1'
		);

		// Create second thread
		const threadId2 = await threadHelper.createThread(
			testFileUri,
			2,
			'Second comment',
			'User 2'
		);

		// Verify IDs are unique
		assert.notStrictEqual(threadId1, threadId2, 'Thread IDs should be unique');
	});

	it('creates thread at line 0', async () => {
		const threadId = await threadHelper.createThread(
			testFileUri,
			0,
			'Comment at line 0',
			'Test User'
		);

		const thread = threadHelper.getThreadById(threadId);
		assert.strictEqual(thread.range.start.line, 0, 'Thread should be at line 0');
	});

	// Task 4.3: Write test for thread creation with author information
	it('stores author name correctly when using replyToThread', async () => {
		const authorName = 'John Doe';
		
		// Create initial thread (will use system username)
		const threadId = await threadHelper.createThread(
			testFileUri,
			10,
			'Initial comment'
		);

		// Add a reply with custom author using replyToThread command
		await threadHelper.replyToThread(threadId, 'Reply with custom author', authorName);

		const thread = threadHelper.getThreadById(threadId);
		
		// Check the reply (second comment) has the custom author
		assert.strictEqual(thread.comments.length, 2, 'Thread should have 2 comments');
		const replyComment = thread.comments[1];
		assert.strictEqual(replyComment.author.name, authorName, 'Reply author name should be stored correctly');
	});

	it('preserves author metadata across different replies', async () => {
		const author1 = 'Alice';
		const author2 = 'Bob';
		const author3 = 'Charlie';

		// Create initial thread
		const threadId = await threadHelper.createThread(testFileUri, 1, 'Initial comment');

		// Add replies with different authors
		await threadHelper.replyToThread(threadId, 'Reply 1', author1);
		await threadHelper.replyToThread(threadId, 'Reply 2', author2);
		await threadHelper.replyToThread(threadId, 'Reply 3', author3);

		const thread = threadHelper.getThreadById(threadId);

		// Verify each reply has correct author (skip first comment which uses system username)
		assert.strictEqual(thread.comments[1].author.name, author1, 'First reply author should be preserved');
		assert.strictEqual(thread.comments[2].author.name, author2, 'Second reply author should be preserved');
		assert.strictEqual(thread.comments[3].author.name, author3, 'Third reply author should be preserved');
	});

	// Task 4.5: Write test for multiple threads in same file
	it('creates multiple threads at different lines independently', async () => {
		// Create three threads at different lines
		const threadId1 = await threadHelper.createThread(testFileUri, 5, 'Comment at line 5', 'User 1');
		const threadId2 = await threadHelper.createThread(testFileUri, 10, 'Comment at line 10', 'User 2');
		const threadId3 = await threadHelper.createThread(testFileUri, 15, 'Comment at line 15', 'User 3');

		// Verify all threads exist
		const thread1 = threadHelper.getThreadById(threadId1);
		const thread2 = threadHelper.getThreadById(threadId2);
		const thread3 = threadHelper.getThreadById(threadId3);

		assert.ok(thread1, 'First thread should exist');
		assert.ok(thread2, 'Second thread should exist');
		assert.ok(thread3, 'Third thread should exist');

		// Verify threads are at correct lines
		assert.strictEqual(thread1.range.start.line, 5, 'First thread should be at line 5');
		assert.strictEqual(thread2.range.start.line, 10, 'Second thread should be at line 10');
		assert.strictEqual(thread3.range.start.line, 15, 'Third thread should be at line 15');

		// Verify threads have correct content
		const comment1Body = typeof thread1.comments[0].body === 'string' 
			? thread1.comments[0].body 
			: thread1.comments[0].body.value;
		const comment2Body = typeof thread2.comments[0].body === 'string' 
			? thread2.comments[0].body 
			: thread2.comments[0].body.value;
		const comment3Body = typeof thread3.comments[0].body === 'string' 
			? thread3.comments[0].body 
			: thread3.comments[0].body.value;

		assert.strictEqual(comment1Body, 'Comment at line 5', 'First thread should have correct content');
		assert.strictEqual(comment2Body, 'Comment at line 10', 'Second thread should have correct content');
		assert.strictEqual(comment3Body, 'Comment at line 15', 'Third thread should have correct content');
	});

	it('modifying one thread does not affect others', async () => {
		// Create two threads
		const threadId1 = await threadHelper.createThread(testFileUri, 5, 'Original comment 1', 'User 1');
		const threadId2 = await threadHelper.createThread(testFileUri, 10, 'Original comment 2', 'User 2');

		// Get initial state of thread 2
		const thread2Before = threadHelper.getThreadById(threadId2);
		const thread2CommentsBefore = thread2Before.comments.length;
		const thread2ContentBefore = typeof thread2Before.comments[0].body === 'string'
			? thread2Before.comments[0].body
			: thread2Before.comments[0].body.value;

		// Modify thread 1 by adding a reply
		await threadHelper.replyToThread(threadId1, 'Reply to thread 1', 'User 3');

		// Verify thread 2 is unchanged
		const thread2After = threadHelper.getThreadById(threadId2);
		assert.strictEqual(
			thread2After.comments.length,
			thread2CommentsBefore,
			'Thread 2 should still have same number of comments'
		);
		
		const thread2ContentAfter = typeof thread2After.comments[0].body === 'string'
			? thread2After.comments[0].body
			: thread2After.comments[0].body.value;
		
		assert.strictEqual(
			thread2ContentAfter,
			thread2ContentBefore,
			'Thread 2 content should be unchanged'
		);

		// Verify thread 1 was modified
		const thread1After = threadHelper.getThreadById(threadId1);
		assert.strictEqual(thread1After.comments.length, 2, 'Thread 1 should have 2 comments');
	});

	// Task 4.2: Write property test for thread creation metadata preservation
	// Feature: e2e-testing, Property 1: Thread Creation Preserves Location and Metadata
	it('thread creation preserves all provided metadata (property test)', async function() {
		// Increase timeout for property test
		this.timeout(30000);

		// Use more realistic comment content to avoid edge cases with MarkdownString processing
		const commentPrefixes = ['TODO:', 'FIXME:', 'NOTE:', 'Review:', 'Question:', 'Bug:'];
		const commentBodies = [
			'This needs to be refactored',
			'Check the logic here',
			'Add error handling',
			'Optimize this section',
			'Update documentation',
			'Verify edge cases'
		];

		let iterationCounter = 0;

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				async (prefix, body) => {
					// Use unique line number for each iteration to avoid conflicts
					const lineNumber = iterationCounter++;
					const content = `${prefix} ${body}`;
					
					// Create thread with generated values
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						content
					);

					// Retrieve thread by ID (not by line number)
					const thread = threadHelper.getThreadById(threadId);

					// Verify all metadata is preserved
					assert.ok(thread.customId, 'Thread should have a unique ID');
					assert.strictEqual(thread.customId, threadId, 'Thread ID should match');
					assert.strictEqual(
						thread.uri.toString(),
						testFileUri.toString(),
						'File path should be preserved'
					);
					assert.strictEqual(
						thread.range.start.line,
						lineNumber,
						'Line number should be preserved'
					);
					assert.strictEqual(thread.comments.length, 1, 'Thread should have one comment');
					
					const comment = thread.comments[0];
					const commentBody = typeof comment.body === 'string' ? comment.body : comment.body.value;
					
					// Content should be preserved exactly
					assert.strictEqual(commentBody, content, 'Content should be preserved exactly');
					
					// Author should exist (will be system username)
					assert.ok(comment.author.name, 'Author name should exist');
				}
			),
			{ numRuns: 20 }
		);
	});

	// Task 4.4: Write property test for sidebar update on thread creation
	// Feature: e2e-testing, Property 2: Thread Creation Triggers Sidebar Update
	it('thread creation triggers sidebar update (property test)', async function() {
		// Increase timeout for property test
		this.timeout(15000);

		const commentPrefixes = ['TODO:', 'FIXME:', 'NOTE:', 'Review:', 'Question:', 'Bug:'];
		const commentBodies = [
			'This needs to be refactored',
			'Check the logic here',
			'Add error handling',
			'Optimize this section',
			'Update documentation',
			'Verify edge cases'
		];

		let iterationCounter = 0;

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				async (prefix, body) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const content = `${prefix} ${body}`;
					
					// Get sidebar provider
					const sidebarProvider = extensionHelper.getSidebarProvider();
					assert.ok(sidebarProvider, 'Sidebar provider should be available');

					// Get thread manager
					const threadManager = extensionHelper.getThreadManager();
					assert.ok(threadManager, 'Thread manager should be available');

					// Get initial thread count
					const initialThreads = threadManager.toWebviewFormat();
					const initialCount = initialThreads.length;

					// Create thread
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						content
					);

					// Verify thread was added to thread manager
					const updatedThreads = threadManager.toWebviewFormat();
					assert.strictEqual(
						updatedThreads.length,
						initialCount + 1,
						'Thread manager should have one more thread'
					);

					// Verify the new thread is in the list
					const newThread = updatedThreads.find(t => t.id === threadId);
					assert.ok(newThread, 'New thread should be in thread manager');
					assert.strictEqual(newThread.lineNumber, lineNumber + 1, 'Line number should match (1-indexed)');
					
					// Content should be preserved exactly
					const threadContent = newThread.comments[0].content;
					assert.strictEqual(threadContent, content, 'Content should be preserved exactly');
				}
			),
			{ numRuns: 15 }
		);
	});

	// Task 4.6: Write property test for thread independence
	// Feature: e2e-testing, Property 3: Multiple Threads Maintain Independence
	it('multiple threads maintain independence (property test)', async function() {
		// Increase timeout for property test
		this.timeout(20000);

		const commentPrefixes = ['TODO:', 'FIXME:', 'NOTE:', 'Review:', 'Question:', 'Bug:'];
		const commentBodies = [
			'This needs to be refactored',
			'Check the logic here',
			'Add error handling',
			'Optimize this section',
			'Update documentation',
			'Verify edge cases'
		];

		let iterationCounter = 0;

		await fc.assert(
			fc.asyncProperty(
				fc.array(
					fc.record({
						prefix: fc.constantFrom(...commentPrefixes),
						body: fc.constantFrom(...commentBodies)
					}),
					{ minLength: 2, maxLength: 5 }
				),
				async (threadSpecs) => {
					// Create multiple threads with unique line numbers
					const threadIds: string[] = [];
					const threadData: Array<{ line: number; content: string }> = [];
					
					for (const spec of threadSpecs) {
						const line = iterationCounter++;
						const content = `${spec.prefix} ${spec.body}`;
						threadData.push({ line, content });
						
						const threadId = await threadHelper.createThread(
							testFileUri,
							line,
							content
						);
						threadIds.push(threadId);
					}

					// Verify all threads exist independently
					for (let i = 0; i < threadIds.length; i++) {
						const thread = threadHelper.getThreadById(threadIds[i]);
						assert.ok(thread, `Thread ${i} should exist`);
						
						// Verify thread has correct properties
						assert.strictEqual(
							thread.range.start.line,
							threadData[i].line,
							`Thread ${i} should be at correct line`
						);
						
						const commentBody = typeof thread.comments[0].body === 'string'
							? thread.comments[0].body
							: thread.comments[0].body.value;
						
						// Content should be preserved exactly
						assert.strictEqual(
							commentBody,
							threadData[i].content,
							`Thread ${i} should have exact content`
						);
					}

					// Modify first thread and verify others are unaffected
					if (threadIds.length >= 2) {
						// Store state of other threads before modification
						const otherThreadsStateBefore = threadIds.slice(1).map(id => {
							const thread = threadHelper.getThreadById(id);
							return {
								id,
								commentCount: thread.comments.length,
								content: typeof thread.comments[0].body === 'string'
									? thread.comments[0].body
									: thread.comments[0].body.value
							};
						});

						// Modify first thread
						await threadHelper.replyToThread(threadIds[0], 'New reply to first thread', 'Modifier');

						// Verify other threads are unchanged
						for (const stateBefore of otherThreadsStateBefore) {
							const thread = threadHelper.getThreadById(stateBefore.id);
							assert.strictEqual(
								thread.comments.length,
								stateBefore.commentCount,
								'Other threads should have same comment count'
							);
							
							const content = typeof thread.comments[0].body === 'string'
								? thread.comments[0].body
								: thread.comments[0].body.value;
							
							assert.strictEqual(
								content,
								stateBefore.content,
								'Other threads should have unchanged content'
							);
						}
					}
				}
			),
			{ numRuns: 10 }
		);
	});
});
