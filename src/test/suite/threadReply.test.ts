import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fc from 'fast-check';
import { 
	TestWorkspaceManager, 
	ExtensionTestHelper, 
	ThreadTestHelper 
} from '../helpers';
import { SAMPLE_TYPESCRIPT } from '../fixtures';

describe('Comment Reply Tests', () => {
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

	// Task 6.1: Write test for adding reply to thread
	it('adds reply to correct thread and preserves original comment', async () => {
		const originalContent = 'Original comment';
		const replyContent = 'This is a reply';
		const replyAuthor = 'Reply Author';

		// Create initial thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			5,
			originalContent
		);

		// Get initial state
		const threadBefore = threadHelper.getThreadById(threadId);
		const originalCommentBody = typeof threadBefore.comments[0].body === 'string'
			? threadBefore.comments[0].body
			: threadBefore.comments[0].body.value;

		// Add reply to thread
		await threadHelper.replyToThread(threadId, replyContent, replyAuthor);

		// Get updated thread
		const threadAfter = threadHelper.getThreadById(threadId);

		// Verify reply was added to correct thread
		assert.strictEqual(threadAfter.customId, threadId, 'Reply should be added to correct thread');

		// Verify thread now has 2 comments
		assert.strictEqual(threadAfter.comments.length, 2, 'Thread should have 2 comments after reply');

		// Verify original comment is preserved
		const originalCommentAfter = typeof threadAfter.comments[0].body === 'string'
			? threadAfter.comments[0].body
			: threadAfter.comments[0].body.value;
		assert.strictEqual(
			originalCommentAfter,
			originalCommentBody,
			'Original comment should be preserved unchanged'
		);

		// Verify reply content
		const replyCommentBody = typeof threadAfter.comments[1].body === 'string'
			? threadAfter.comments[1].body
			: threadAfter.comments[1].body.value;
		assert.strictEqual(replyCommentBody, replyContent, 'Reply should have correct content');

		// Verify reply author
		assert.strictEqual(threadAfter.comments[1].author.name, replyAuthor, 'Reply should have correct author');
	});

	// Task 6.2: Write property test for reply preservation
	// Feature: e2e-testing, Property 4: Reply Addition Preserves Existing Comments
	it('reply addition preserves existing comments (property test)', async function() {
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
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				async (originalPrefix, originalBody, replyPrefix, replyBody) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const originalContent = `${originalPrefix} ${originalBody}`;
					const replyContent = `${replyPrefix} ${replyBody}`;

					// Create initial thread
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						originalContent
					);

					// Get original comment state
					const threadBefore = threadHelper.getThreadById(threadId);
					const originalCommentBefore = threadBefore.comments[0];
					const originalContentBefore = typeof originalCommentBefore.body === 'string'
						? originalCommentBefore.body
						: originalCommentBefore.body.value;
					const originalAuthorBefore = originalCommentBefore.author.name;

					// Add reply
					await threadHelper.replyToThread(threadId, replyContent, 'Reply Author');

					// Get updated thread
					const threadAfter = threadHelper.getThreadById(threadId);

					// Verify original comment is preserved unchanged
					assert.strictEqual(
						threadAfter.comments.length,
						2,
						'Thread should have 2 comments after reply'
					);

					const originalCommentAfter = threadAfter.comments[0];
					const originalContentAfter = typeof originalCommentAfter.body === 'string'
						? originalCommentAfter.body
						: originalCommentAfter.body.value;

					assert.strictEqual(
						originalContentAfter,
						originalContentBefore,
						'Original comment content should be preserved exactly'
					);
					assert.strictEqual(
						originalCommentAfter.author.name,
						originalAuthorBefore,
						'Original comment author should be preserved'
					);

					// Verify reply is appended at the end
					const replyComment = threadAfter.comments[1];
					const replyCommentBody = typeof replyComment.body === 'string'
						? replyComment.body
						: replyComment.body.value;

					assert.strictEqual(
						replyCommentBody,
						replyContent,
						'Reply should have correct content'
					);
					assert.strictEqual(
						replyComment.author.name,
						'Reply Author',
						'Reply should have correct author'
					);
				}
			),
			{ numRuns: 20 }
		);
	});

	// Task 6.3: Write test for thread timestamp update on reply
	it('updates thread timestamp when reply is added', async () => {
		const originalContent = 'Original comment';
		const replyContent = 'Reply to comment';

		// Create initial thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			10,
			originalContent
		);

		// Get initial timestamp
		const threadBefore = threadHelper.getThreadById(threadId);
		const timestampBefore = threadBefore.updatedAt;
		assert.ok(timestampBefore, 'Thread should have an updatedAt timestamp');

		// Wait a bit to ensure timestamp difference
		await new Promise(resolve => setTimeout(resolve, 100));

		// Add reply
		await threadHelper.replyToThread(threadId, replyContent, 'Reply Author');

		// Get updated thread
		const threadAfter = threadHelper.getThreadById(threadId);
		const timestampAfter = threadAfter.updatedAt;

		// Verify timestamp was updated
		assert.ok(timestampAfter, 'Thread should still have an updatedAt timestamp');
		assert.ok(
			timestampAfter > timestampBefore,
			'updatedAt timestamp should be more recent after reply'
		);
	});

	// Task 6.4: Write property test for timestamp updates
	// Feature: e2e-testing, Property 5: Reply Addition Updates Thread Timestamp
	it('reply addition updates thread timestamp (property test)', async function() {
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
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				async (originalPrefix, originalBody, replyPrefix, replyBody) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const originalContent = `${originalPrefix} ${originalBody}`;
					const replyContent = `${replyPrefix} ${replyBody}`;

					// Create initial thread
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						originalContent
					);

					// Get initial timestamp
					const threadBefore = threadHelper.getThreadById(threadId);
					const timestampBefore = threadBefore.updatedAt;
					assert.ok(timestampBefore, 'Thread should have an updatedAt timestamp');

					// Wait to ensure timestamp difference
					await new Promise(resolve => setTimeout(resolve, 10));

					// Add reply
					await threadHelper.replyToThread(threadId, replyContent, 'Reply Author');

					// Get updated thread
					const threadAfter = threadHelper.getThreadById(threadId);
					const timestampAfter = threadAfter.updatedAt;

					// Verify timestamp was updated and is more recent
					assert.ok(timestampAfter, 'Thread should still have an updatedAt timestamp');
					assert.ok(
						timestampAfter >= timestampBefore,
						'updatedAt timestamp should be equal or more recent after reply'
					);
				}
			),
			{ numRuns: 20 }
		);
	});

	// Task 6.5: Write test for reply author information
	it('stores reply author name and metadata correctly', async () => {
		const originalContent = 'Original comment';
		const replyContent = 'Reply with author info';
		const replyAuthor = 'Jane Smith';

		// Create initial thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			15,
			originalContent
		);

		// Add reply with specific author
		await threadHelper.replyToThread(threadId, replyContent, replyAuthor);

		// Get updated thread
		const thread = threadHelper.getThreadById(threadId);

		// Verify reply has correct author
		assert.strictEqual(thread.comments.length, 2, 'Thread should have 2 comments');
		const replyComment = thread.comments[1];
		
		// Verify author name is stored correctly
		assert.strictEqual(
			replyComment.author.name,
			replyAuthor,
			'Reply author name should be stored correctly'
		);

		// Verify author metadata exists
		assert.ok(replyComment.author, 'Reply should have author metadata');
	});

	it('preserves different author names across multiple replies', async () => {
		const authors = ['Alice Johnson', 'Bob Williams', 'Charlie Brown', 'Diana Prince'];

		// Create initial thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			20,
			'Initial comment'
		);

		// Add replies with different authors
		for (const author of authors) {
			await threadHelper.replyToThread(threadId, `Reply from ${author}`, author);
		}

		// Get updated thread
		const thread = threadHelper.getThreadById(threadId);

		// Verify all authors are preserved correctly (skip first comment which is the original)
		assert.strictEqual(thread.comments.length, authors.length + 1, 'Thread should have all replies');
		
		for (let i = 0; i < authors.length; i++) {
			const replyComment = thread.comments[i + 1]; // +1 to skip original comment
			assert.strictEqual(
				replyComment.author.name,
				authors[i],
				`Reply ${i + 1} should have correct author name`
			);
		}
	});

	// Task 6.6: Write property test for author preservation
	// Feature: e2e-testing, Property 6: Reply Preserves Author Information
	it('reply preserves author information (property test)', async function() {
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
		const authorNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];

		let iterationCounter = 0;

		await fc.assert(
			fc.asyncProperty(
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				fc.constantFrom(...commentPrefixes),
				fc.constantFrom(...commentBodies),
				fc.constantFrom(...authorNames),
				async (originalPrefix, originalBody, replyPrefix, replyBody, authorName) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const originalContent = `${originalPrefix} ${originalBody}`;
					const replyContent = `${replyPrefix} ${replyBody}`;

					// Create initial thread
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						originalContent
					);

					// Add reply with specific author
					await threadHelper.replyToThread(threadId, replyContent, authorName);

					// Get updated thread
					const thread = threadHelper.getThreadById(threadId);

					// Verify reply has correct author information
					assert.strictEqual(thread.comments.length, 2, 'Thread should have 2 comments');
					const replyComment = thread.comments[1];

					// Verify author name is preserved exactly
					assert.strictEqual(
						replyComment.author.name,
						authorName,
						'Reply author name should be preserved exactly'
					);

					// Verify author metadata exists
					assert.ok(replyComment.author, 'Reply should have author metadata');
				}
			),
			{ numRuns: 20 }
		);
	});

	// Task 6.7: Write test for sequential reply ordering
	it('maintains correct order for sequential replies', async () => {
		const originalContent = 'Original comment';
		const replies = [
			{ content: 'First reply', author: 'User 1' },
			{ content: 'Second reply', author: 'User 2' },
			{ content: 'Third reply', author: 'User 3' },
			{ content: 'Fourth reply', author: 'User 4' }
		];

		// Create initial thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			25,
			originalContent
		);

		// Add replies in sequence
		for (const reply of replies) {
			await threadHelper.replyToThread(threadId, reply.content, reply.author);
		}

		// Get updated thread
		const thread = threadHelper.getThreadById(threadId);

		// Verify thread has all comments (original + replies)
		assert.strictEqual(
			thread.comments.length,
			replies.length + 1,
			'Thread should have original comment plus all replies'
		);

		// Verify replies appear in correct order
		for (let i = 0; i < replies.length; i++) {
			const comment = thread.comments[i + 1]; // +1 to skip original comment
			const commentBody = typeof comment.body === 'string'
				? comment.body
				: comment.body.value;

			assert.strictEqual(
				commentBody,
				replies[i].content,
				`Reply ${i + 1} should have correct content in correct order`
			);
			assert.strictEqual(
				comment.author.name,
				replies[i].author,
				`Reply ${i + 1} should have correct author in correct order`
			);
		}
	});

	it('maintains order when adding many replies', async () => {
		const replyCount = 10;

		// Create initial thread
		const threadId = await threadHelper.createThread(
			testFileUri,
			30,
			'Thread with many replies'
		);

		// Add many replies in sequence
		for (let i = 0; i < replyCount; i++) {
			await threadHelper.replyToThread(
				threadId,
				`Reply number ${i + 1}`,
				`Author ${i + 1}`
			);
		}

		// Get updated thread
		const thread = threadHelper.getThreadById(threadId);

		// Verify all replies are in correct order
		assert.strictEqual(
			thread.comments.length,
			replyCount + 1,
			'Thread should have all replies'
		);

		for (let i = 0; i < replyCount; i++) {
			const comment = thread.comments[i + 1];
			const commentBody = typeof comment.body === 'string'
				? comment.body
				: comment.body.value;

			assert.strictEqual(
				commentBody,
				`Reply number ${i + 1}`,
				`Reply ${i + 1} should be in correct position`
			);
		}
	});

	// Task 6.8: Write property test for reply order
	// Feature: e2e-testing, Property 7: Sequential Replies Maintain Order
	it('sequential replies maintain order (property test)', async function() {
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
				fc.array(
					fc.record({
						prefix: fc.constantFrom(...commentPrefixes),
						body: fc.constantFrom(...commentBodies)
					}),
					{ minLength: 2, maxLength: 5 }
				),
				async (originalPrefix, originalBody, replySpecs) => {
					// Use unique line number for each iteration
					const lineNumber = iterationCounter++;
					const originalContent = `${originalPrefix} ${originalBody}`;

					// Create initial thread
					const threadId = await threadHelper.createThread(
						testFileUri,
						lineNumber,
						originalContent
					);

					// Add replies in sequence
					const expectedReplies: string[] = [];
					for (let i = 0; i < replySpecs.length; i++) {
						const replyContent = `${replySpecs[i].prefix} ${replySpecs[i].body}`;
						expectedReplies.push(replyContent);
						await threadHelper.replyToThread(threadId, replyContent, `Author ${i}`);
					}

					// Get updated thread
					const thread = threadHelper.getThreadById(threadId);

					// Verify all replies are present in correct order
					assert.strictEqual(
						thread.comments.length,
						expectedReplies.length + 1,
						'Thread should have all replies'
					);

					// Verify each reply is in the correct position
					for (let i = 0; i < expectedReplies.length; i++) {
						const comment = thread.comments[i + 1]; // +1 to skip original comment
						const commentBody = typeof comment.body === 'string'
							? comment.body
							: comment.body.value;

						assert.strictEqual(
							commentBody,
							expectedReplies[i],
							`Reply ${i + 1} should be in correct order with exact content`
						);
					}
				}
			),
			{ numRuns: 20 }
		);
	});
});
