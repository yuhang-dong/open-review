import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// The workspace path for tests
		const testWorkspace = path.resolve(__dirname, '../../test-workspace');

		// Download VS Code, unzip it and run the integration test
		await runTests({
			vscodeExecutablePath: undefined, // Will download and use latest stable
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				testWorkspace,
				'--disable-extensions', // Disable other extensions for test isolation
				'--disable-gpu', // Disable GPU for headless mode
			],
			extensionTestsEnv: {
				OPEN_REVIEW_TEST_MODE: 'true'
			}
		});
	} catch (err) {
		console.error('Failed to run tests:', err);
		process.exit(1);
	}
}

main();
