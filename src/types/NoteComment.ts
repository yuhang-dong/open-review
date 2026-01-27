import * as vscode from 'vscode';

let commentId = 1;

export class NoteComment implements vscode.Comment {
	id: number;
	label: string | undefined;
	savedBody: string | vscode.MarkdownString; // for the Cancel button
	createdAt: Date;
	updatedAt: Date;
	
	constructor(
		public body: string | vscode.MarkdownString,
		public mode: vscode.CommentMode,
		public author: vscode.CommentAuthorInformation,
		public parent?: vscode.CommentThread,
		public contextValue?: string
	) {
		this.id = ++commentId;
		this.savedBody = this.body;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	/**
	 * Update the comment body and timestamp
	 */
	updateBody(newBody: string | vscode.MarkdownString): void {
		this.body = newBody;
		this.updatedAt = new Date();
	}

	/**
	 * Save the comment and update timestamp
	 */
	save(): void {
		this.savedBody = this.body;
		this.updatedAt = new Date();
	}
}