# CLAUDE.md

## Development Guidelines

### Test-Driven Development (TDD)

All development and bug fixes in this project must follow Test-Driven Development practices.

#### TDD Workflow

1. **Red** - Write a failing test first that defines the expected behavior
2. **Green** - Write the minimum code necessary to make the test pass
3. **Refactor** - Improve the code while keeping all tests passing

#### For New Features

1. Write test cases that describe the expected behavior before writing any implementation code
2. Run the tests to confirm they fail (red phase)
3. Implement the feature with the simplest code that makes tests pass
4. Refactor for code quality while ensuring tests remain green

#### For Bug Fixes

1. Write a test that reproduces the bug (the test should fail)
2. Fix the bug with minimal code changes
3. Verify the test passes
4. Add additional edge case tests if applicable

#### Best Practices

- Keep tests focused and testing one behavior at a time
- Use descriptive test names that explain the expected behavior
- Run the full test suite before committing changes
- Maintain test coverage for critical paths
