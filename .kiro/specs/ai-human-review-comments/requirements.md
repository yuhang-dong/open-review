# Requirements Document

## Introduction

This document outlines the requirements for an AI × Human Review Comments Layer MVP - a VS Code extension with MCP Server integration that provides a unified review workflow for managing human-generated comments and AI responses. The system focuses on comment creation with draft/published states, AI integration through MCP for accessing published comments, and human-AI validation loops without directly modifying code or applying patches.

## Requirements

### Requirement 1: Comment Creation and Draft Management

**User Story:** As a developer using vibe coding tools, I want to create review comments that start as drafts and can be published when ready, so that I can work on comments privately before making them available to AI systems.

#### Acceptance Criteria

1. WHEN a user selects a code snippet or positions cursor on a line THEN the system SHALL provide an "Add Comment" command
2. WHEN a user executes "Add Comment" THEN the system SHALL create a comment card in the Review Panel with status "draft"
3. WHEN a comment is created THEN the system SHALL bind it to the code using snippet anchor with git diff mentality
4. WHEN code is modified by inserting/deleting other lines THEN the system SHALL maintain comment validity
5. WHEN the original snippet cannot be found THEN the system SHALL mark the comment as "outdated"
6. WHEN a user views a comment THEN the system SHALL provide navigation to jump to the associated code location
7. WHEN a user is ready to share a draft comment THEN the system SHALL provide a "Publish" action to change status from "draft" to "open"

### Requirement 2: Review Panel Interface

**User Story:** As a developer, I want a dedicated Review Panel in VS Code, so that I can view, filter, and manage all my comments in a centralized location with clear distinction between draft and published states.

#### Acceptance Criteria

1. WHEN the extension is activated THEN the system SHALL display a Review Panel in the VS Code sidebar
2. WHEN the panel is opened THEN the system SHALL show a list view of all comments with filtering options
3. WHEN a user selects filter criteria THEN the system SHALL filter comments by status (draft, open, resolved, outdated)
4. WHEN a user clicks on a comment THEN the system SHALL show detailed view with snippet, thread, and operations
5. WHEN viewing comment details THEN the system SHALL provide operations: Publish (for drafts), Resolve, Reply, Reopen, Mark outdated
6. WHEN viewing draft comments THEN the system SHALL visually distinguish them from published comments

### Requirement 3: MCP Server Integration for Published Comments

**User Story:** As an AI client, I want to access only published comment data and post replies through MCP protocol, so that I can read review tasks and provide structured responses while respecting the user's draft privacy.

#### Acceptance Criteria

1. WHEN the MCP server starts THEN the system SHALL expose only published (non-draft) comment resources at defined endpoints
2. WHEN an AI client requests `comments://open` THEN the system SHALL return all open (published) comments with context, excluding drafts
3. WHEN an AI client requests `comments://all` THEN the system SHALL return all published comments regardless of status, excluding drafts
4. WHEN an AI client calls `list_comments` tool THEN the system SHALL return filtered published comment list based on provided parameters
5. WHEN an AI client calls `post_ai_reply` tool THEN the system SHALL add the reply to the comment thread and update status to "needs_review"
6. WHEN an AI client calls `set_comment_status` tool THEN the system SHALL update the comment status accordingly
7. WHEN an AI client calls `export_comments` tool THEN the system SHALL return all published comments in a structured format for AI consumption

### Requirement 4: Human-AI Validation Loop

**User Story:** As a developer, I want to review AI responses and provide feedback, so that I can validate solutions and iterate until satisfactory resolution is achieved.

#### Acceptance Criteria

1. WHEN an AI posts a reply THEN the system SHALL automatically change comment status to "needs_review"
2. WHEN a user reviews an AI response and is satisfied THEN the system SHALL allow marking as "Resolve"
3. WHEN a user is not satisfied with AI response THEN the system SHALL allow posting a "Reply" with additional requirements
4. WHEN a user posts a reply to AI response THEN the system SHALL change status back to "open" for AI re-processing
5. WHEN viewing comment threads THEN the system SHALL clearly distinguish between human, AI, and system messages
6. WHEN a comment is resolved THEN the system SHALL maintain the complete thread history

### Requirement 5: Data Persistence and Structure

**User Story:** As a developer, I want my comments and threads to be persistently stored in my workspace, so that I can maintain review history and context across sessions.

#### Acceptance Criteria

1. WHEN comments are created THEN the system SHALL store them in workspace-local storage
2. WHEN the system stores comment data THEN it SHALL include: id, uri, anchor info, status (draft/open/needs_review/resolved/outdated), and thread array
3. WHEN storing anchor information THEN the system SHALL include snippet, normalized text, and anchor status
4. WHEN storing thread messages THEN the system SHALL include role (human/ai/system), content, and timestamp
5. WHEN workspace is reopened THEN the system SHALL restore all comment data and states
6. WHEN comments become outdated THEN the system SHALL preserve data but mark appropriately rather than delete

### Requirement 6: MCP Auto-Configuration

**User Story:** As a developer, I want to easily configure the MCP server with my existing vibe coding tools, so that I can quickly start using the review workflow without manual configuration.

#### Acceptance Criteria

1. WHEN the extension is installed THEN the system SHALL provide an "Install MCP Everywhere" command
2. WHEN the install command is executed THEN the system SHALL detect configuration files for Cline, Cursor, Kiro, and Claude Code
3. WHEN configuration files are found THEN the system SHALL merge MCP server configuration into existing mcpServers section
4. WHEN modifying configuration files THEN the system SHALL create backups before making changes
5. WHEN installation completes THEN the system SHALL provide a summary of successful installations and any required manual steps
6. WHEN configuration is updated THEN the system SHALL provide restart instructions for affected tools

### Requirement 7: Error Handling and Status Management

**User Story:** As a developer, I want clear feedback about comment states and system operations, so that I can understand when comments become outdated or when operations fail.

#### Acceptance Criteria

1. WHEN a comment anchor cannot be located THEN the system SHALL mark it as "outdated" rather than deleting
2. WHEN MCP operations fail THEN the system SHALL log errors and provide user-friendly error messages
3. WHEN AI operations are recorded THEN the system SHALL add system messages to comment threads for traceability
4. WHEN comment status changes THEN the system SHALL update the UI immediately to reflect new state
5. WHEN comment operations encounter errors THEN the system SHALL provide detailed feedback about which operations succeeded or failed