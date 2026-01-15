import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('AI × Human Review Comments extension is now active!');

    // Register the Add Comment command
    const addCommentCommand = vscode.commands.registerCommand('aiReviewComments.addComment', () => {
        vscode.window.showInformationMessage('Add Comment command executed!');
    });

    // Register the Install MCP Everywhere command
    const installMCPCommand = vscode.commands.registerCommand('aiReviewComments.installMCPEverywhere', () => {
        vscode.window.showInformationMessage('Install MCP Everywhere command executed!');
    });

    // Register the Review Panel provider (placeholder)
    const reviewPanelProvider = new ReviewPanelProvider(context.extensionUri);
    vscode.window.registerTreeDataProvider('aiReviewComments.reviewPanel', reviewPanelProvider);

    context.subscriptions.push(addCommentCommand, installMCPCommand);
}

export function deactivate() {
    console.log('AI × Human Review Comments extension is now deactivated!');
}

// Placeholder Review Panel Provider
class ReviewPanelProvider implements vscode.TreeDataProvider<ReviewItem> {
    constructor(private workspaceRoot: vscode.Uri) {}

    getTreeItem(element: ReviewItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ReviewItem): Thenable<ReviewItem[]> {
        if (!element) {
            // Return placeholder items for now
            return Promise.resolve([
                new ReviewItem('No comments yet', vscode.TreeItemCollapsibleState.None)
            ]);
        }
        return Promise.resolve([]);
    }
}

class ReviewItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
    }
}