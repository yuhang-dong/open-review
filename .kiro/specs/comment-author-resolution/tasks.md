# Implementation Plan: Comment Author Resolution

## Overview

This implementation plan converts the hardcoded "vscode" author names in the VS Code extension to a dynamic, priority-based author resolution system. The current codebase has three hardcoded `{ name: 'vscode' }` references in extension.ts that need to be replaced with a dynamic resolution system.

## Current State Analysis

- **Existing Code**: Basic VS Code extension with comment functionality working
- **Hardcoded References**: 3 instances of `{ name: 'vscode' }` in extension.ts (lines 51, 66, 151)
- **Missing Components**: No author resolution system exists yet - need to build from scratch
- **Target**: Replace hardcoded names with dynamic resolution using git → system → runtime → fallback priority

## Tasks

- [ ] 1. Set up core interfaces and project structure
  - Create `src/services/` directory structure
  - Create `src/services/author/` subdirectory for author resolution components
  - Define TypeScript interfaces for providers and resolver in `src/services/author/interfaces.ts`
  - Create error handling types and constants in `src/services/author/types.ts`
  - _Requirements: 1.1, 5.1_

- [ ] 2. Implement username provider classes
  - [ ] 2.1 Implement GitUsernameProvider in `src/services/author/providers/GitUsernameProvider.ts`
    - Query git user.name configuration using child_process
    - Handle cases where git is not installed or workspace is not a git repository
    - Return null for invalid/empty usernames
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 2.2 Implement SystemUsernameProvider in `src/services/author/providers/SystemUsernameProvider.ts`
    - Create cross-platform system username retrieval (Windows: USERNAME, macOS/Linux: USER)
    - Handle permission errors and unavailable usernames
    - Return null for invalid/empty usernames
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 2.3 Implement RuntimeEnvironmentProvider in `src/services/author/providers/RuntimeEnvironmentProvider.ts`
    - Detect runtime environment (vscode, kiro, cursor) using process.env and vscode API
    - Provide safe fallback for unknown environments
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3. Implement AuthorResolver class
  - [ ] 3.1 Create AuthorResolver in `src/services/author/AuthorResolver.ts`
    - Implement priority system: git → system → runtime → fallback
    - Add caching mechanism with configurable timeout (default 5 minutes)
    - Implement error handling and logging using VS Code output channel
    - Provide `getAuthorName()` and `getCurrentAuthor()` methods
    - _Requirements: 1.1, 1.2, 6.1, 5.1, 5.2, 5.3_
  
  - [ ] 3.2 Create index file `src/services/author/index.ts`
    - Export AuthorResolver and interfaces for easy importing
    - Create singleton pattern for extension-wide use

- [ ] 4. Integrate AuthorResolver with existing comment system
  - [ ] 4.1 Initialize AuthorResolver in extension.ts
    - Import AuthorResolver and create singleton instance
    - Initialize resolver with default configuration
    - _Requirements: 1.3_
  
  - [ ] 4.2 Replace hardcoded author names in comment creation
    - Update `openReview.startDraft` command (line 51) to use `await authorResolver.getCurrentAuthor()`
    - Update `openReview.finishDraft` command (line 66) to use `await authorResolver.getCurrentAuthor()`
    - Update `replyNote` function (line 151) to use `await authorResolver.getCurrentAuthor()`
    - Handle async/await properly in all three locations
    - _Requirements: 1.3, 1.4_

- [ ] 5. Add configuration and cache management
  - [ ] 5.1 Add VS Code extension settings in package.json
    - Add `openReview.author.cacheTimeout` setting (default: 300000ms = 5 minutes)
    - Add `openReview.author.fallbackName` setting (default: "user")
    - Add `openReview.author.enableLogging` setting (default: false)
    - _Requirements: 6.1_
  
  - [ ] 5.2 Implement cache refresh command
    - Add `openReview.refreshAuthor` command to package.json
    - Implement command handler in extension.ts to call `authorResolver.refreshCache()`
    - _Requirements: 6.3_

- [ ] 6. Final verification and cleanup
  - [ ] 6.1 Verify all hardcoded references are removed
    - Search codebase for any remaining `{ name: 'vscode' }` references
    - Ensure all comment creation uses dynamic author resolution
    - _Requirements: 1.4_
  
  - [ ] 6.2 Test the complete integration
    - Manually test comment creation in different scenarios (with/without git, different OS)
    - Verify caching works correctly
    - Test cache refresh functionality
    - _Requirements: 1.1, 1.2, 1.3, 5.4_

## Notes

- All tasks are required for the MVP - no optional tasks marked with `*`
- Each task references specific requirements for traceability
- The implementation maintains backward compatibility with existing comment functionality
- Focus on minimal, working implementation without extensive testing initially
- Property-based testing removed to focus on core functionality delivery