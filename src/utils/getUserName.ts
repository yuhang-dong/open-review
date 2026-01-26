import * as vscode from 'vscode';
import * as os from 'os';
import * as cp from 'child_process';

/**
 * Get the username with priority:
 * 1. Workspace git username (only if workspace is a git repository)
 * 2. System (mac/linux/windows) user name
 * 3. Default name from runtime (vscode / kiro / cursor)
 */
export function getUserName(): string {
	// 1. Try to get workspace git username (only if it's a git repository)
	try {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (workspaceFolder) {
			// First check if this is a git repository
			cp.execSync('git rev-parse --is-inside-work-tree', { 
				encoding: 'utf8',
				cwd: workspaceFolder,
				timeout: 3000,
				stdio: 'pipe'
			});
			
			// If we get here, it's a git repository, so get the username
			const gitUserName = cp.execSync('git config user.name', { 
				encoding: 'utf8',
				cwd: workspaceFolder,
				timeout: 3000
			}).trim();
			if (gitUserName) {
				return gitUserName;
			}
		}
	} catch (error) {
		// Not a git repository or git config not available, continue to next option
	}

	// 2. Try to get system username
	try {
		const systemUserName = os.userInfo().username;
		if (systemUserName) {
			return systemUserName;
		}
	} catch (error) {
		// System username not available, continue to next option
	}

	// 3. Default name based on runtime
	const productName = vscode.env.appName.toLowerCase();
	if (productName.includes('cursor')) {
		return 'cursor';
	} else if (productName.includes('kiro')) {
		return 'kiro';
	} else {
		return 'vscode';
	}
}