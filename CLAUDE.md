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

* Keep tests focused and testing one behavior at a time
* Use descriptive test names that explain the expected behavior
* Run the full test suite before committing changes
* Maintain test coverage for critical paths



\### Tenant Isolation Rules



All implementations, bug fixes, and refactors must:



1\. Enforce 'tenant\_id' scoping at every layer:

2\. Prevent cross-tenant data access under all circumstances.

3\. Explicitly validate tenant context propagation across service boundaries.





\### Tenant-Aware TDD Requirement



All TDD implementations must include tenant-aware test coverage:



No feature or bug fix is considered complete without tenant-aware tests and validation of isolation guarantees.



---



\## Test Quality \& Maintainability Standards



To maintain a high-quality and scalable test suite, the following standards must be enforced:



\### 1. Eliminate Duplication



\### 2. Strengthen Tenant Coverage



\* Every financial, order, billing, or reporting test must validate tenant isolation explicitly.

\* Include at least one negative tenant-mismatch test where applicable.



\### 3. Continuous Test Refactoring



\* When adding new tests, review related existing tests.

\* Refactor outdated or poorly structured tests before integrating new ones.





