# Implementation Plan

- [ ] 1. Set up project structure and show initial UI
- [x] 1.1 Create VS Code extension project structure
  - Create VS Code extension project structure with TypeScript configuration
  - Set up basic extension manifest and activation events
  - Configure build system and development environment
  - _Requirements: 1.1, 2.1_

- [ ] 1.2 Create placeholder Review Panel UI
  - Write basic ReviewPanel webview provider with placeholder content
  - Register Review Panel in VS Code sidebar with extension activation
  - Add basic HTML/CSS structure for comment list view
  - Test extension activation and panel visibility in VS Code
  - _Requirements: 2.1_

- [ ] 2. Define core data models and basic comment creation
- [ ] 2.1 Create core data model interfaces
  - Write TypeScript interfaces for Comment with isDraft boolean and publishedAt timestamp
  - Implement CodeAnchor interface with git diff-style anchor properties
  - Create ThreadMessage interface with role-based typing (human/ai/system)
  - Define CommentStatus enum with draft, open, needs_review, resolved, outdated states
  - _Requirements: 1.1, 1.7, 5.2, 5.3_

- [ ] 2.2 Implement basic comment creation UI
  - Add "Add Comment" command integration with VS Code editor
  - Create simple comment creation dialog that captures user input
  - Display new comments in the Review Panel as draft items
  - Add basic styling to distinguish draft comments visually
  - _Requirements: 1.1, 1.2, 2.5_

- [ ] 3. Add storage and make comments persistent
- [ ] 3.1 Implement workspace storage utilities
  - Write WorkspaceStorage class for persisting comments in .vscode/ai-review-comments/
  - Create file system utilities with atomic operations and error handling
  - Implement basic CRUD operations for comment persistence
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 3.2 Connect UI to storage and show persistent comments
  - Integrate CommentManager with WorkspaceStorage for data persistence
  - Update Review Panel to load and display saved comments on extension activation
  - Add real-time UI updates when comments are created or modified
  - Test comment persistence across VS Code sessions
  - _Requirements: 5.1, 5.5, 2.1_

- [ ] 4. Implement code anchoring and navigation
- [ ] 4.1 Create CodeAnchor model with git diff-style binding
  - Code CodeAnchor class with snippet normalization and range handling
  - Implement anchor validation and status detection (active/moved/outdated)
  - Write unit tests for anchor creation and validation logic
  - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [ ] 4.2 Add code binding to comment creation
  - Integrate CodeAnchor creation with "Add Comment" command
  - Bind comments to selected code snippets with range information
  - Add navigation functionality to jump from comment to code location
  - Update UI to show code context and anchor status for each comment
  - _Requirements: 1.3, 1.6, 2.4_

- [ ] 5. Add comment management features and enhanced UI
- [ ] 5.1 Implement Comment Manager with privacy controls
  - Write CommentManager class with createComment method (defaults to draft)
  - Implement publishComment method to transition from draft to open status
  - Add updateCommentStatus and addThreadMessage methods
  - Create getPublishedComments method for AI-accessible comment filtering
  - _Requirements: 1.1, 1.2, 1.7, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.2 Enhance Review Panel with full comment management
  - Add filtering UI for status, draft/published state, and tags
  - Implement comment detail view with thread display and action buttons
  - Add "Publish" action for transitioning draft comments to open
  - Create comment operations: Resolve, Reply, Reopen, Mark outdated
  - _Requirements: 2.2, 2.3, 2.4, 2.6, 1.7_

- [ ] 6. Set up MCP server foundation
- [ ] 6.1 Create MCP server project structure
  - Set up MCP server project structure with proper TypeScript types
  - Write MCP server entry point with protocol handler setup
  - Create resource and tool server base classes
  - Add connection management and error handling for MCP protocol
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 6.2 Implement Privacy Manager and filtering
  - Write PrivacyManager class with isCommentPublished validation
  - Implement filterForAIAccess method to exclude draft comments
  - Add privacy filter layer to exclude draft comments from all AI access
  - Create unit tests for privacy boundary enforcement
  - _Requirements: 1.7, 3.1, 3.2, 3.7_

- [ ] 7. Implement MCP resources and test with simple AI interaction
- [ ] 7.1 Create MCP resource server for published comments
  - Write ResourceServer class exposing comments://open and comments://all endpoints
  - Implement comments://comment/<id> endpoint for individual published comments
  - Add comments://export endpoint for bulk published comment export
  - Create unit tests for resource serving with privacy filtering validation
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [ ] 7.2 Add basic MCP tools and test AI interaction
  - Write ToolServer class with list_comments tool (published comments only)
  - Implement post_ai_reply tool with validation for published comment access
  - Add set_comment_status tool for AI to update published comment states
  - Test basic AI interaction by manually calling MCP tools
  - _Requirements: 3.4, 3.5, 3.6, 3.7_

- [ ] 8. Complete human-AI validation loop with UI updates
- [ ] 8.1 Implement AI response handling and UI integration
  - Write AI reply processing with automatic status change to "needs_review"
  - Implement thread message creation with role-based typing (ai messages)
  - Update Review Panel to display AI responses in comment threads
  - Add visual distinction for AI messages vs human messages
  - _Requirements: 4.1, 4.5, 2.4_

- [ ] 8.2 Complete human review workflow in UI
  - Add "Resolve" action for satisfied AI responses with status transition
  - Implement "Reply" functionality for additional requirements to AI
  - Create status management for human feedback loop (open ↔ needs_review)
  - Update UI to show complete conversation threads with proper styling
  - _Requirements: 4.2, 4.3, 4.4, 4.6, 2.5_

- [ ] 9. Add comprehensive error handling
- [ ] 9.1 Implement anchor resolution error handling
  - Write error handling for outdated anchors with graceful degradation
  - Add user feedback for anchor resolution failures in UI
  - Implement anchor re-binding workflow for moved code
  - Update Review Panel to show anchor status and error states
  - _Requirements: 1.5, 7.1, 7.4_

- [ ] 9.2 Add MCP and privacy error handling
  - Implement retry logic with exponential backoff for MCP operations
  - Add error logging and user-friendly error messages for MCP failures
  - Implement strict access control validation for draft comment protection
  - Add audit logging for attempted privacy boundary violations
  - _Requirements: 7.2, 7.3, 3.7_

- [ ] 10. Implement MCP auto-configuration
- [ ] 10.1 Create MCP configuration detection and installation
  - Write "Install MCP Everywhere" command for VS Code
  - Implement detection logic for Cline, Cursor, Kiro, and Claude Code config files
  - Add configuration merging logic for mcpServers section updates
  - Create backup mechanism before modifying configuration files
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10.2 Complete MCP installation workflow with UI feedback
  - Implement installation summary reporting with success/failure details
  - Add restart instruction generation for affected AI tools
  - Create UI notifications for installation progress and results
  - Write integration tests for MCP configuration installation
  - _Requirements: 6.5, 6.6_

- [ ] 11. Add comprehensive testing and final polish
- [ ] 11.1 Create comprehensive test suite
  - Write unit tests for Comment, CodeAnchor, and ThreadMessage models
  - Add tests for CommentManager, PrivacyManager, and AnchorManager classes
  - Create tests for storage operations and privacy filtering
  - Implement tests for MCP server components with privacy validation
  - _Requirements: All core functionality requirements_

- [ ] 11.2 Final integration testing and UI polish
  - Write end-to-end tests for comment creation to AI response flow
  - Add tests for draft-to-published workflow with privacy enforcement
  - Perform performance testing with target scalability limits
  - Polish UI styling, animations, and user experience details
  - _Requirements: Complete workflow validation_

- [ ] 12. Documentation and deployment preparation
  - Create user documentation for comment creation and publishing workflow
  - Write developer documentation for MCP server integration
  - Add configuration examples and troubleshooting guides
  - Prepare extension packaging and distribution setup
  - _Requirements: User and developer experience_