# Polypane Snippets

A community-powered collection of snippets for the Polypane [snippets panel](https://polypane.app/docs/snippets/), available from the [Polypane Snippets store](https://polypane.app/snippets).

## Contributing

To contribute, fork this repository, add your snippet to the snippets folder, and submit a pull request. Please ensure that your snippet includes a clear description. 

You can submit individual snippets or a single json file with a collection of snippets.

Snippets can be [exported from Polypane](https://polypane.app/docs/snippets/#importing-and-exporting-snippets) but note these do not include authors or categories, so make sure to add those manually to your contribution.

### Validating your snippets locally

This repo includes a CLI validator powered by `ajv`:

```bash
npm install
npm run help
npm run validate -- snippets/lang\ outliner.json
```

The validator exits with code `0` for valid input. For invalid input, it exits with code `1` and prints the validation issues. It uses the schema defined in [schema.json](schema.json), which supports both individual snippet files and collections of snippets.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
