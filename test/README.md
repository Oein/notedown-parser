# Test Directory Structure

This directory contains all test files for the notedown-parser project, organized into logical categories for better maintainability.

## Directory Structure

### `/core`

Core functionality tests for the main parser and renderer components.

- `debug.test.ts` - Debug functionality tests

### `/features`

Feature-specific test suites organized by functionality:

#### `/features/collapse`

Tests for collapse functionality:

- `collapse.test.ts` - Basic collapse parsing tests
- `collapse-renderer.test.ts` - Collapse rendering tests
- `collapse-nested-renderer.test.ts` - Nested collapse rendering tests
- `renderer.collapse.test.ts` - Additional collapse renderer tests

#### `/features/lists`

Tests for list functionality:

- `list.test.ts` - Basic list parsing tests
- `list-renderer.test.ts` - List rendering tests
- `nested-list-renderer.test.ts` - Nested list rendering tests
- `nested-mixed-lists.test.ts` - Mixed nested list tests

#### `/features/tables`

Tests for table functionality:

- `table.test.ts` - Basic table parsing tests
- `table-formatting.test.ts` - Table formatting tests

#### `/features/formatting`

Tests for text formatting features:

- `multiple-formatting.test.ts` - Multiple formatting combinations
- `latex.test.ts` - LaTeX formula support
- `links.test.ts` - Link parsing and rendering
- `code-highlighting.test.ts` - Code syntax highlighting
- `additional-escape.test.js` - Additional escape sequences
- `comprehensive-escape.test.js` - Comprehensive escape testing

### `/integration`

Integration tests that test multiple components working together:

- `collapse-integration.test.ts` - Collapse integration tests
- `list-collapse-integration.test.ts` - List and collapse integration

### `/samples`

Tests that validate against sample files and comprehensive scenarios:

- `samples-comprehensive.test.ts` - Comprehensive sample file tests
- `samples-individual.test.ts` - Individual sample file tests

### `/utilities`

Tests for utility components and helpers:

- `highlighter-loader.test.ts` - Syntax highlighter loader tests
- `raw-meta.test.ts` - Raw metadata handling tests

## Running Tests

Use bun to run tests:

```bash
# Run all tests
bun test

# Run specific test category
bun test test/features/
bun test test/core/
bun test test/integration/

# Run specific test file
bun test test/features/collapse/collapse.test.ts
```

## Test File Naming Convention

- Test files should be named as `{feature-name}.test.ts`
- Debug scripts should be named as `debug-{description}.js` (per project guidelines)
- TypeScript test files are preferred over JavaScript
