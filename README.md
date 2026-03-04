# Polypane Snippets

A community-powered collection of snippets for the Polypane [snippets panel](https://polypane.app/docs/snippets/), available from the [Polypane Snippets store](https://polypane.app/snippets).

## Contributing

To contribute, fork this repository, add your snippet to the snippets folder, and submit a pull request. Please ensure that your snippet includes a clear description. You can submit individual snippets or a single JSON file with a collection of snippets.

> Snippets can be [exported from Polypane](https://polypane.app/docs/snippets/#importing-and-exporting-snippets) directly. These don't include author, folder description or categories, so make sure to add those manually to your contribution.

PRs will be evaluated on a case-to-case basis. If you are unsure about your snippet, please first [create an issue](https://github.com/polypane/snippets/issues/new).

### Validating snippets

PRs can only be merged if the newly added snippets or collections follow the correct [JSON schema](schema.json) (both can be validated against the same schema). Added snippets are automatically checked when you open a PR, but you can also validate your snippets locally before submitting a PR:


```bash
npm install
npm run validate -- snippets/lang\ outliner.json
```

The validator exits with code `0` for valid input. For invalid input, it exits with code `1` and prints the validation issues. 

For more information on the validator script, you can run

```bash
npm run help
```

## License

This project is licensed under the [Apache License 2.0](LICENSE).
