# About this project

1. It uses bun.
2. So you should test with `bun test`
3. We develop in TDD way. So if you start from beginning, just make code then add test.
4. Test all of cases after you make a feature.
5. Test scripts must be named as `debug-{what ever you want}.js`
6. This project follows markdown syntax.
7. If you want to add css to project, do not use typescript inline style adder. Add it to notedown-theme.css and add description what it does to comment.
8. Do not use whatever thing to run code directly in terminal. Create debug script, run, and delete it.
9. There is no timeout command in this environment
10. Bun test does not support timeout

## Test Organization

The test files are organized into logical categories for better maintainability:

### Directory Structure

```
test/
├── core/           # Core functionality tests (parser, renderer basics)
├── features/       # Feature-specific tests organized by functionality
│   ├── collapse/   # Collapse functionality tests
│   ├── formatting/ # Text formatting, LaTeX, links, code highlighting, escapes
│   ├── lists/      # List parsing and rendering tests
│   └── tables/     # Table functionality tests
├── integration/    # Cross-component integration tests
├── samples/        # Comprehensive sample file validation tests
└── utilities/      # Utility component tests (highlighter, metadata)
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific categories
bun test test/core/           # Core functionality
bun test test/features/       # All feature tests
bun test test/integration/    # Integration tests
bun test test/samples/        # Sample validation tests
bun test test/utilities/      # Utility tests

# Run specific feature categories
bun test test/features/collapse/     # Collapse tests
bun test test/features/formatting/   # Formatting tests
bun test test/features/lists/        # List tests
bun test test/features/tables/       # Table tests

# Run specific test file
bun test test/features/collapse/collapse.test.ts
```

### Test File Guidelines

1. **Naming Convention**: Test files should be named `{feature-name}.test.ts`
2. **Location**: Place tests in the appropriate category directory
3. **TypeScript Preferred**: Use `.ts` files over `.js` files for new tests
4. **Comprehensive Coverage**: Test all edge cases and error conditions
5. **Integration Tests**: Place cross-component tests in `/integration`
6. **Sample Tests**: Validate against real sample files in `/samples`

### Adding New Tests

When adding a new feature:

1. **Create unit tests** in the appropriate `/features` subdirectory
2. **Add integration tests** in `/integration` if the feature interacts with other components
3. **Update sample tests** in `/samples` if the feature affects sample file parsing
4. **Follow TDD**: Write tests first, then implement the feature
5. **Test all cases**: Include happy path, edge cases, and error conditions

### Debug Scripts

- Create temporary debug scripts as `debug-{description}.js` in the project root
- Run them to test specific functionality
- Delete them after use (don't commit to repo)
- Use these instead of running code directly in terminal
