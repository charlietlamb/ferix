Whenever you make changes make sure to run `bun lint`, `bun format`, `bun knip` to ensure the code is meeting code standards.

After making changes to apps/code, also run:
- `bun test` in apps/code - Run all tests to ensure nothing is broken

Never use any. Always prefer strong types.

When working in an app that uses Effect make sure to use Effect schemas to validate data.

When importing from Phospher Icons in apps/web make sure to add the Icon postfix to these icons as without this they're deprecated.

Always import at the top of the file never inline like import("asdf").asdf