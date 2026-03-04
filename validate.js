#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HELP_TEXT = `Polypane snippet validator

Usage:
  node validate.js <path-to-json-file>
  npm run validate -- <path-to-json-file>

Examples:
  node validate.js snippets/lang\ outliner.json
  npm run validate -- snippets/lang\ outliner.json

Output:
  On success: no output, exits with code 0.
  On failure: prints validation issues, exits with code 1.

Options:
  -h, --help    Show this help message
`;

function printHelp() {
  process.stdout.write(HELP_TEXT);
}

function fail(issues) {
  process.stderr.write(issues);
  process.exit(1);
}

function failValidation(filePath, errors) {
  const fileName = path.basename(filePath);
  const lines = formatAjvErrors(errors).map((message) => `✗ ${message}`);
  process.stderr.write(`${fileName} is not valid, issues found:\n`);
  process.stderr.write(`${lines.join("\n")}\n`);
  process.exit(1);
}

function formatAjvErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return ["Validation failed."];
  }

  return errors.map((error) => `${error.message}`);
}

function toSnippetCollection(parsedValue) {
  if (Array.isArray(parsedValue)) {
    return parsedValue;
  }

  if (parsedValue && typeof parsedValue === "object") {
    return [parsedValue];
  }

  return null;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const inputPath = path.resolve(process.cwd(), args[0]);
  const schemaPath = path.resolve(__dirname, "schema.json");

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (error) {
    fail(`Unable to read schema at ${schemaPath}:\n\t ${error.message}`);
  }

  let parsedInput;
  try {
    parsedInput = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    fail(`Unable to read or parse JSON at ${inputPath}:\n\t ${error.message}`);
  }

  const collection = toSnippetCollection(parsedInput);
  if (!collection) {
    fail("Input JSON must be a snippet object or an array of snippet/folder objects.");
  }

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const isValid = validate(collection);

  if (isValid) {
    process.exit(0);
  }

  failValidation(inputPath, validate.errors);
}

main();
