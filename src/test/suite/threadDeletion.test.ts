import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fc from 'fast-check';
import { 
	TestWorkspaceManager, 
	ExtensionTestHelper, 
	ThreadTestHelper 
} from '../helpers';
import { SAMPLE_TYPESCRIPT } from '../fixtures';

describe('Thread Deletion Tests', () => {
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

	// Task 9.1: Write test for deleting single comment
	it('deletes single comment from thread with multiple comments', async () => {
		const originalContent = 'Original comment';
		const reply1Content = 'First reply';
		const reply2Content = 'Second reply';
		const reply3Content = 'Third reply';

		// Create thread with multiple comments
		const threadId = await threadHelper.createThread(
			testFileUri,
			5,
			originalContent
		);

		// Add multiple replies
		await threadHelper.replyToThread(threadId, reply1Content, 'User 1');
		await threadHelper.replyToThread(threadId, reply2Content, 'User 2');
		await threadHelper.replyToThread(threadId, reply3Content, 'User 3');

		// Get thread before deletion
		const threadBefore = threadHelper.getThreadById(threadId);
		assert.strictEqual(threadBefore.comments.length, 4, 'Thread should have 4 comments');

		// Get the ID of the second reply (index 2)
		const commentToDelete = threadBefore.comments[2];
		const commentIdToDelete = (commentToDelete as any).id;

		// Store other comment IDs for verification
		const otherCommentIds = threadBefore.comments
			.filter((_: any, index: number) => index !== 2)
			.map((c: any) => c.id);

		// Delete the second reply
		await threadHelper.deleteComment(threadId, commentIdToDelete);

		// Get thread after deletion
		const threadAfter = threadHelper.getThreadById(threadId);

		// Verify only target comment was removed
		assert.strictEqual(
			threadAfter.comments.length,
			3,
			'Thread should have 3 comments after deletion'
		);

		// Verify the deleted comment is not present
		const deletedCommentExists = threadAfter.comments.some((c: any) => c.id === commentIdToDelete);
		assert.strictEqual(
			deletedCommentExists,
			false,
			'Deleted comment should not exist in thread'
		);

		// Verify other comments remain
		for (const commentId of otherCommentIds) {
			const commentExists = threadAfter.comments.some((c: any) => c.id === commentId);
			assert.ok(
				commentExists,
				`Comment ${commentId} should still exist after deletion`
			);
		}

		// Verify original comment is preserved
		const originalCommentBody = typeof threadAfter.comments[0].body === 'string'
			? threadAfter.comments[0].body
			: threadAfter.comments[0].body.value;
		assert.strictEqual(
			originalCommentBody,
			originalContent,
			'Original comment should be preserved'
		);
	});

	it('deletes middle comment and preserves order of remaining comments', async () => {
		const comments = [
			{ content: 'Original comment', author: 'Author 0' },
			{ content: 'Reply 1', author: 'Author 1' },
			{ content: 'Reply 2', author: 'Author 2' },
			{ content: 'Reply 3', author: 'Author 3' }
		];

		// Create thread with multiple comments
		const threadId = await threadHelper.createThread(
			testFileUri,
			10,
			comments[0].content
		);

		// Add replies
		for (let i = 1; i < comments.length; i++) {
			await threadHelper.replyToThread(threadId, comments[i].content, comments[i].author);
		}

		// Get thread and delete middle comment (Reply 2, index 2)
		const threadBefore = threadHelper.getThreadById(threadId);
		const commentToDelete = threadBefore.comments[2];
		const commentIdToDelete = (commentToDelete as any).id;

		await threadHelper.deleteComment(threadId, commentIdToDelete);

		// Get thread after deletion
		const threadAfter = threadHelper.getThreadById(threadId);

		// Verify remaining comments are in correct order
		assert.strictEqual(threadAfter.comments.length, 3, 'Thread should have 3 comments');

		// Check original comment
		const comment0Body = typeof threadAfter.comments[0].body === 'string'
			? threadAfter.comments[0].body
			: threadAfter.comments[0].body.value;
		assert.strictEqual(comment0Body, comments[0].content, 'Original comment should be first');

		// Check Reply 1
		const comment1Body = typeof threadAfter.comments[1].body === 'string'
			? threadAfter.comments[1].body
			: threadAfter.comments[1].body.value;
		assert.strictEqual(comment1Body, comments[1].content, 'Reply 1 should be second');

		// Check Reply 3
		const comment2Body = typeof threadAfter.comments[2].body === 'string'
			? threadAfter.comments[2].body
			: threadAfter.comments[2].body.value;
		assert.strictEqual(comment2Body, comments[3].content, 'Reply 3 should be third');
	});

	// Task 9.2: Write property test for targeted deletion
	// Feature: e2e-testing, Property 11: Comment Deletion Is Targeted
	it('comment deletion is targeted (property test)', async function() {
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
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				fc.array(
					fc.record({
						prefix: fc.constantFrom(...commentPrefixes),
						body: fc.constantFrom(...commentBodies)
					}),
					{ minLength: 2, maxLength: 5 }
				),
				fc.integer({ min: 0, max: 4 }), // Index of comment to delete (will be clamped to array length)
				async (originalPrefix, originalBody, replySpecs, deleteIndex) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const originalContent = `${originalPrefix} ${originalBody}`;

					// Create thread with multiple comments
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						originalContent
					);

					// Add replies
					const allComments = [originalContent];
					for (const spec of replySpecs) {
						const replyContent = `${spec.prefix} ${spec.body}`;
						allComments.push(replyContent);
						await threadHelper.replyToThread(threadId, replyContent, 'Test Author');
					}

					// Get thread before deletion
					const threadBefore = threadHelper.getThreadById(threadId);
					const commentCount = threadBefore.comments.length;

					// Clamp delete index to valid range (skip index 0 to avoid deleting last comment)
					const actualDeleteIndex = Math.max(1, Math.min(deleteIndex, commentCount - 1));

					// Get comment to delete
					const commentToDelete = threadBefore.comments[actualDeleteIndex];
					const commentIdToDelete = (commentToDelete as any).id;

					// Store IDs of other comments
					const otherCommentIds = threadBefore.comments
						.filter((_: any, index: number) => index !== actualDeleteIndex)
						.map((c: any) => c.id);

					// Delete the comment
					await threadHelper.deleteComment(threadId, commentIdToDelete);

					// Get thread after deletion
					const threadAfter = threadHelper.getThreadById(threadId);

					// Verify only target comment was removed
					assert.strictEqual(
						threadAfter.comments.length,
						commentCount - 1,
						'Thread should have one less comment after deletion'
					);

					// Verify deleted comment is not present
					const deletedCommentExists = threadAfter.comments.some((c: any) => c.id === commentIdToDelete);
					assert.strictEqual(
						deletedCommentExists,
						false,
						'Deleted comment should not exist in thread'
					);

					// Verify all other comments remain
					for (const commentId of otherCommentIds) {
						const commentExists = threadAfter.comments.some((c: any) => c.id === commentId);
						assert.ok(
							commentExists,
							`Comment ${commentId} should still exist after deletion`
						);
					}
				}
			),
			{ numRuns: 15 }
		);
	});

	// Task 9.3: Write test for deleting last comment
	it('deletes entire thread when last comment is removed', async () => {
		const content = 'Only comment in thread';

		// Create thread with single comment
		const threadId = await threadHelper.createThread(
			testFileUri,
			15,
			content
		);

		// Verify thread exists
		const threadBefore = threadHelper.getThreadById(threadId);
		assert.ok(threadBefore, 'Thread should exist before deletion');
		assert.strictEqual(threadBefore.comments.length, 1, 'Thread should have one comment');

		// Get the comment ID
		const commentId = (threadBefore.comments[0] as any).id;

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');

		// Get initial thread count
		const threadsBefore = threadManager.getAllThreads();
		const threadCountBefore = threadsBefore.length;

		// Delete the only comment
		await threadHelper.deleteComment(threadId, commentId);

		// Verify thread is removed from thread manager
		const threadsAfter = threadManager.getAllThreads();
		assert.strictEqual(
			threadsAfter.length,
			threadCountBefore - 1,
			'Thread count should decrease by 1'
		);

		// Verify thread no longer exists
		const threadAfter = threadManager.findThreadById(threadId);
		assert.strictEqual(
			threadAfter,
			undefined,
			'Thread should not exist after deleting last comment'
		);
	});

	it('deletes thread when deleting last remaining comment after other deletions', async () => {
		const originalContent = 'Original comment';
		const reply1Content = 'First reply';
		const reply2Content = 'Second reply';

		// Create thread with multiple comments
		const threadId = await threadHelper.createThread(
			testFileUri,
			20,
			originalContent
		);

		await threadHelper.replyToThread(threadId, reply1Content, 'User 1');
		await threadHelper.replyToThread(threadId, reply2Content, 'User 2');

		// Verify thread has 3 comments
		const threadInitial = threadHelper.getThreadById(threadId);
		assert.strictEqual(threadInitial.comments.length, 3, 'Thread should have 3 comments');

		// Delete second comment
		const comment1Id = (threadInitial.comments[1] as any).id;
		await threadHelper.deleteComment(threadId, comment1Id);

		// Verify thread still exists with 2 comments
		const threadAfterFirst = threadHelper.getThreadById(threadId);
		assert.ok(threadAfterFirst, 'Thread should still exist');
		assert.strictEqual(threadAfterFirst.comments.length, 2, 'Thread should have 2 comments');

		// Delete third comment
		const comment2Id = (threadAfterFirst.comments[1] as any).id;
		await threadHelper.deleteComment(threadId, comment2Id);

		// Verify thread still exists with 1 comment
		const threadAfterSecond = threadHelper.getThreadById(threadId);
		assert.ok(threadAfterSecond, 'Thread should still exist');
		assert.strictEqual(threadAfterSecond.comments.length, 1, 'Thread should have 1 comment');

		// Delete last comment
		const lastCommentId = (threadAfterSecond.comments[0] as any).id;
		await threadHelper.deleteComment(threadId, lastCommentId);

		// Verify thread is removed
		const threadManager = extensionHelper.getThreadManager();
		const threadAfterLast = threadManager?.findThreadById(threadId);
		assert.strictEqual(
			threadAfterLast,
			undefined,
			'Thread should be removed after deleting last comment'
		);
	});

	// Task 9.4: Write property test for last comment deletion
	// Feature: e2e-testing, Property 12: Last Comment Deletion Removes Thread
	it('last comment deletion removes thread (property test)', async function() {
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

					// Create thread with single comment
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						content
					);

					// Verify thread exists
					const threadBefore = threadHelper.getThreadById(threadId);
					assert.ok(threadBefore, 'Thread should exist before deletion');
					assert.strictEqual(threadBefore.comments.length, 1, 'Thread should have exactly one comment');

					// Get thread manager
					const threadManager = extensionHelper.getThreadManager();
					assert.ok(threadManager, 'Thread manager should be available');

					// Get initial thread count
					const threadsBefore = threadManager.getAllThreads();
					const threadCountBefore = threadsBefore.length;

					// Get the comment ID
					const commentId = (threadBefore.comments[0] as any).id;

					// Delete the only comment
					await threadHelper.deleteComment(threadId, commentId);

					// Verify thread is removed from thread manager
					const threadsAfter = threadManager.getAllThreads();
					assert.strictEqual(
						threadsAfter.length,
						threadCountBefore - 1,
						'Thread count should decrease by 1 after deleting last comment'
					);

					// Verify thread no longer exists
					const threadAfter = threadManager.findThreadById(threadId);
					assert.strictEqual(
						threadAfter,
						undefined,
						'Thread should not exist after deleting last comment'
					);
				}
			),
			{ numRuns: 20 }
		);
	});

	// Task 9.5: Write test for deleting entire thread
	it('deletes entire thread with all comments', async () => {
		const originalContent = 'Original comment';
		const reply1Content = 'First reply';
		const reply2Content = 'Second reply';
		const reply3Content = 'Third reply';

		// Create thread with multiple comments
		const threadId = await threadHelper.createThread(
			testFileUri,
			25,
			originalContent
		);

		await threadHelper.replyToThread(threadId, reply1Content, 'User 1');
		await threadHelper.replyToThread(threadId, reply2Content, 'User 2');
		await threadHelper.replyToThread(threadId, reply3Content, 'User 3');

		// Verify thread exists with all comments
		const threadBefore = threadHelper.getThreadById(threadId);
		assert.ok(threadBefore, 'Thread should exist before deletion');
		assert.strictEqual(threadBefore.comments.length, 4, 'Thread should have 4 comments');

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');

		// Get initial thread count
		const threadsBefore = threadManager.getAllThreads();
		const threadCountBefore = threadsBefore.length;

		// Delete entire thread
		await threadHelper.deleteThread(threadId);

		// Verify thread is removed from thread manager
		const threadsAfter = threadManager.getAllThreads();
		assert.strictEqual(
			threadsAfter.length,
			threadCountBefore - 1,
			'Thread count should decrease by 1'
		);

		// Verify thread no longer exists
		const threadAfter = threadManager.findThreadById(threadId);
		assert.strictEqual(
			threadAfter,
			undefined,
			'Thread should not exist after deletion'
		);
	});

	it('deletes thread and all comments are removed', async () => {
		const comments = [
			{ content: 'Original comment', author: 'Author 0' },
			{ content: 'Reply 1', author: 'Author 1' },
			{ content: 'Reply 2', author: 'Author 2' },
			{ content: 'Reply 3', author: 'Author 3' },
			{ content: 'Reply 4', author: 'Author 4' }
		];

		// Create thread with multiple comments
		const threadId = await threadHelper.createThread(
			testFileUri,
			30,
			comments[0].content
		);

		// Add replies
		for (let i = 1; i < comments.length; i++) {
			await threadHelper.replyToThread(threadId, comments[i].content, comments[i].author);
		}

		// Get thread before deletion and store comment IDs
		const threadBefore = threadHelper.getThreadById(threadId);
		const commentIds = threadBefore.comments.map((c: any) => c.id);

		// Delete entire thread
		await threadHelper.deleteThread(threadId);

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();

		// Verify thread is removed
		const threadAfter = threadManager?.findThreadById(threadId);
		assert.strictEqual(
			threadAfter,
			undefined,
			'Thread should be removed from thread manager'
		);

		// Verify all comments are removed (thread no longer exists, so comments are gone)
		// We can verify by checking that the thread is not in the list of all threads
		const allThreads = threadManager?.getAllThreads() || [];
		const deletedThreadExists = allThreads.some(t => t.customId === threadId);
		assert.strictEqual(
			deletedThreadExists,
			false,
			'Deleted thread should not exist in thread manager'
		);
	});

	it('deletes thread without affecting other threads', async () => {
		// Create multiple threads
		const threadId1 = await threadHelper.createThread(testFileUri, 35, 'Thread 1', 'User 1');
		const threadId2 = await threadHelper.createThread(testFileUri, 40, 'Thread 2', 'User 2');
		const threadId3 = await threadHelper.createThread(testFileUri, 45, 'Thread 3', 'User 3');

		// Add replies to each thread
		await threadHelper.replyToThread(threadId1, 'Reply to thread 1', 'User A');
		await threadHelper.replyToThread(threadId2, 'Reply to thread 2', 'User B');
		await threadHelper.replyToThread(threadId3, 'Reply to thread 3', 'User C');

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();

		// Get initial state of threads 1 and 3
		const thread1Before = threadHelper.getThreadById(threadId1);
		const thread3Before = threadHelper.getThreadById(threadId3);
		const thread1CommentCount = thread1Before.comments.length;
		const thread3CommentCount = thread3Before.comments.length;

		// Delete thread 2
		await threadHelper.deleteThread(threadId2);

		// Verify thread 2 is removed
		const thread2After = threadManager?.findThreadById(threadId2);
		assert.strictEqual(thread2After, undefined, 'Thread 2 should be removed');

		// Verify threads 1 and 3 still exist
		const thread1After = threadHelper.getThreadById(threadId1);
		const thread3After = threadHelper.getThreadById(threadId3);

		assert.ok(thread1After, 'Thread 1 should still exist');
		assert.ok(thread3After, 'Thread 3 should still exist');

		// Verify threads 1 and 3 have same comment counts
		assert.strictEqual(
			thread1After.comments.length,
			thread1CommentCount,
			'Thread 1 should have same number of comments'
		);
		assert.strictEqual(
			thread3After.comments.length,
			thread3CommentCount,
			'Thread 3 should have same number of comments'
		);
	});

	// Task 9.6: Write property test for thread deletion
	// Feature: e2e-testing, Property 13: Thread Deletion Removes All Comments
	it('thread deletion removes all comments (property test)', async function() {
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
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				fc.array(
					fc.record({
						prefix: fc.constantFrom(...commentPrefixes),
						body: fc.constantFrom(...commentBodies)
					}),
					{ minLength: 0, maxLength: 5 }
				),
				async (originalPrefix, originalBody, replySpecs) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const originalContent = `${originalPrefix} ${originalBody}`;

					// Create thread with multiple comments
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						originalContent
					);

					// Add replies
					for (const spec of replySpecs) {
						const replyContent = `${spec.prefix} ${spec.body}`;
						await threadHelper.replyToThread(threadId, replyContent, 'Test Author');
					}

					// Get thread before deletion
					const threadBefore = threadHelper.getThreadById(threadId);
					const commentCount = threadBefore.comments.length;
					assert.ok(commentCount >= 1, 'Thread should have at least one comment');

					// Get thread manager
					const threadManager = extensionHelper.getThreadManager();
					assert.ok(threadManager, 'Thread manager should be available');

					// Get initial thread count
					const threadsBefore = threadManager.getAllThreads();
					const threadCountBefore = threadsBefore.length;

					// Delete entire thread
					await threadHelper.deleteThread(threadId);

					// Verify thread is removed from thread manager
					const threadsAfter = threadManager.getAllThreads();
					assert.strictEqual(
						threadsAfter.length,
						threadCountBefore - 1,
						'Thread count should decrease by 1 after deletion'
					);

					// Verify thread no longer exists
					const threadAfter = threadManager.findThreadById(threadId);
					assert.strictEqual(
						threadAfter,
						undefined,
						'Thread should not exist after deletion'
					);

					// Verify thread is not in the list of all threads
					const deletedThreadExists = threadsAfter.some(t => t.customId === threadId);
					assert.strictEqual(
						deletedThreadExists,
						false,
						'Deleted thread should not exist in thread manager'
					);
				}
			),
			{ numRuns: 15 }
		);
	});

	// Task 9.7: Write test for sidebar update after deletion
	it('sidebar updates after comment deletion', async () => {
		const originalContent = 'Original comment';
		const reply1Content = 'First reply';
		const reply2Content = 'Second reply';

		// Create thread with multiple comments
		const threadId = await threadHelper.createThread(
			testFileUri,
			50,
			originalContent
		);

		await threadHelper.replyToThread(threadId, reply1Content, 'User 1');
		await threadHelper.replyToThread(threadId, reply2Content, 'User 2');

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');

		// Get webview format before deletion
		const webviewThreadsBefore = threadManager.toWebviewFormat();
		const webviewThreadBefore = webviewThreadsBefore.find(t => t.id === threadId);
		assert.ok(webviewThreadBefore, 'Thread should exist in webview format');
		assert.strictEqual(
			webviewThreadBefore.comments.length,
			3,
			'Thread should have 3 comments in webview format'
		);

		// Get thread and delete a comment
		const thread = threadHelper.getThreadById(threadId);
		const commentToDelete = thread.comments[1];
		const commentIdToDelete = (commentToDelete as any).id;

		await threadHelper.deleteComment(threadId, commentIdToDelete);

		// Get webview format after deletion
		const webviewThreadsAfter = threadManager.toWebviewFormat();
		const webviewThreadAfter = webviewThreadsAfter.find(t => t.id === threadId);

		// Verify sidebar shows updated comment count
		assert.ok(webviewThreadAfter, 'Thread should still exist in webview format');
		assert.strictEqual(
			webviewThreadAfter.comments.length,
			2,
			'Thread should have 2 comments in webview format after deletion'
		);

		// Verify deleted comment is not in webview format
		const deletedCommentInWebview = webviewThreadAfter.comments.some(
			c => c.id === commentIdToDelete
		);
		assert.strictEqual(
			deletedCommentInWebview,
			false,
			'Deleted comment should not appear in webview format'
		);
	});

	it('sidebar updates after thread deletion', async () => {
		const content1 = 'Thread 1';
		const content2 = 'Thread 2';
		const content3 = 'Thread 3';

		// Create multiple threads
		const threadId1 = await threadHelper.createThread(testFileUri, 55, content1, 'User 1');
		const threadId2 = await threadHelper.createThread(testFileUri, 60, content2, 'User 2');
		const threadId3 = await threadHelper.createThread(testFileUri, 65, content3, 'User 3');

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');

		// Get webview format before deletion
		const webviewThreadsBefore = threadManager.toWebviewFormat();
		const threadCountBefore = webviewThreadsBefore.length;

		// Verify all threads exist in webview format
		assert.ok(
			webviewThreadsBefore.some(t => t.id === threadId1),
			'Thread 1 should exist in webview format'
		);
		assert.ok(
			webviewThreadsBefore.some(t => t.id === threadId2),
			'Thread 2 should exist in webview format'
		);
		assert.ok(
			webviewThreadsBefore.some(t => t.id === threadId3),
			'Thread 3 should exist in webview format'
		);

		// Delete thread 2
		await threadHelper.deleteThread(threadId2);

		// Get webview format after deletion
		const webviewThreadsAfter = threadManager.toWebviewFormat();

		// Verify sidebar no longer shows deleted thread
		assert.strictEqual(
			webviewThreadsAfter.length,
			threadCountBefore - 1,
			'Should have one less thread in webview format after deletion'
		);

		// Verify deleted thread is not in webview format
		const deletedThreadInWebview = webviewThreadsAfter.some(t => t.id === threadId2);
		assert.strictEqual(
			deletedThreadInWebview,
			false,
			'Deleted thread should not appear in webview format'
		);

		// Verify other threads still exist
		assert.ok(
			webviewThreadsAfter.some(t => t.id === threadId1),
			'Thread 1 should still exist in webview format'
		);
		assert.ok(
			webviewThreadsAfter.some(t => t.id === threadId3),
			'Thread 3 should still exist in webview format'
		);
	});

	it('sidebar updates when last comment is deleted and thread is removed', async () => {
		const content = 'Single comment thread';

		// Create thread with single comment
		const threadId = await threadHelper.createThread(
			testFileUri,
			70,
			content
		);

		// Get thread manager
		const threadManager = extensionHelper.getThreadManager();
		assert.ok(threadManager, 'Thread manager should be available');

		// Get webview format before deletion
		const webviewThreadsBefore = threadManager.toWebviewFormat();
		const threadCountBefore = webviewThreadsBefore.length;
		const webviewThreadBefore = webviewThreadsBefore.find(t => t.id === threadId);
		assert.ok(webviewThreadBefore, 'Thread should exist in webview format');

		// Get thread and delete the only comment
		const thread = threadHelper.getThreadById(threadId);
		const commentId = (thread.comments[0] as any).id;

		await threadHelper.deleteComment(threadId, commentId);

		// Get webview format after deletion
		const webviewThreadsAfter = threadManager.toWebviewFormat();

		// Verify sidebar no longer shows the thread
		assert.strictEqual(
			webviewThreadsAfter.length,
			threadCountBefore - 1,
			'Thread count should decrease by 1 in webview format'
		);

		const deletedThreadInWebview = webviewThreadsAfter.some(t => t.id === threadId);
		assert.strictEqual(
			deletedThreadInWebview,
			false,
			'Deleted thread should not appear in webview format'
		);
	});

	// Task 9.8: Write property test for deletion sidebar updates
	// Feature: e2e-testing, Property 14: Deletion Updates Sidebar
	it('deletion updates sidebar (property test)', async function() {
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
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				fc.array(
					fc.record({
						prefix: fc.constantFrom(...commentPrefixes),
						body: fc.constantFrom(...commentBodies)
					}),
					{ minLength: 0, maxLength: 4 }
				),
				fc.constantFrom('deleteComment', 'deleteThread'), // Deletion type
				async (originalPrefix, originalBody, replySpecs, deletionType) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const originalContent = `${originalPrefix} ${originalBody}`;

					// Create thread with multiple comments
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						originalContent
					);

					// Add replies
					for (const spec of replySpecs) {
						const replyContent = `${spec.prefix} ${spec.body}`;
						await threadHelper.replyToThread(threadId, replyContent, 'Test Author');
					}

					// Get thread manager
					const threadManager = extensionHelper.getThreadManager();
					assert.ok(threadManager, 'Thread manager should be available');

					// Get webview format before deletion
					const webviewThreadsBefore = threadManager.toWebviewFormat();
					const webviewThreadBefore = webviewThreadsBefore.find(t => t.id === threadId);
					assert.ok(webviewThreadBefore, 'Thread should exist in webview format before deletion');

					const commentCountBefore = webviewThreadBefore.comments.length;
					const threadCountBefore = webviewThreadsBefore.length;

					// Perform deletion based on type
					if (deletionType === 'deleteComment' && commentCountBefore > 1) {
						// Delete a comment (not the first one to avoid deleting last comment)
						const thread = threadHelper.getThreadById(threadId);
						const commentToDelete = thread.comments[1];
						const commentIdToDelete = (commentToDelete as any).id;

						await threadHelper.deleteComment(threadId, commentIdToDelete);

						// Get webview format after deletion
						const webviewThreadsAfter = threadManager.toWebviewFormat();
						const webviewThreadAfter = webviewThreadsAfter.find(t => t.id === threadId);

						// Verify sidebar shows updated comment count
						assert.ok(webviewThreadAfter, 'Thread should still exist in webview format');
						assert.strictEqual(
							webviewThreadAfter.comments.length,
							commentCountBefore - 1,
							'Sidebar should show one less comment after deletion'
						);

						// Verify deleted comment is not in webview format
						const deletedCommentInWebview = webviewThreadAfter.comments.some(
							c => c.id === commentIdToDelete
						);
						assert.strictEqual(
							deletedCommentInWebview,
							false,
							'Deleted comment should not appear in sidebar'
						);
					} else {
						// Delete entire thread
						await threadHelper.deleteThread(threadId);

						// Get webview format after deletion
						const webviewThreadsAfter = threadManager.toWebviewFormat();

						// Verify sidebar no longer shows deleted thread
						assert.strictEqual(
							webviewThreadsAfter.length,
							threadCountBefore - 1,
							'Sidebar should show one less thread after deletion'
						);

						const deletedThreadInWebview = webviewThreadsAfter.some(t => t.id === threadId);
						assert.strictEqual(
							deletedThreadInWebview,
							false,
							'Deleted thread should not appear in sidebar'
						);
					}
				}
			),
			{ numRuns: 15 }
		);
	});
});
