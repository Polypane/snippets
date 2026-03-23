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
  node validate.js --all <path-to-folder>
  npm run validate -- <path-to-json-file>
  npm run validate -- --all <path-to-folder>

Examples:
  node validate.js snippets/lang\ outliner.json
  node validate.js --all snippets
  npm run validate -- snippets/lang\ outliner.json
  npm run validate -- --all snippets

Output:
  On success: no output, exits with code 0.
  On failure: prints validation issues, exits with code 1.

Options:
  --all         Validate all .json files in a folder (non-recursive)
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

function parseArgs(args) {
  const hasAll = args.includes("--all");

  if (hasAll) {
    if (args.length !== 2) {
      fail("When using --all, provide qa folder path.\n");
    }
    const folderArg = args[args.indexOf("--all") + 1];

    return {
      mode: "all",
      inputPath: path.resolve(process.cwd(), folderArg),
    };
  }

  if (args.length !== 1) {
    fail("Provide a JSON file path, or use --all <path-to-folder>.\n");
  }

  return {
    mode: "single",
    inputPath: path.resolve(process.cwd(), args[0]),
  };
}

function collectJsonFiles(folderPath) {
  let stat;
  try {
    stat = fs.statSync(folderPath);
  } catch (error) {
    fail(`Unable to access folder at ${folderPath}:\n\t ${error.message}`);
  }

  if (!stat.isDirectory()) {
    fail(`${folderPath} is not a directory.`);
  }

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(folderPath, entry.name));
}

function checkUrlEncodedContent(collection) {
  const errors = [];

  function checkSnippet(snippet) {
    const content = snippet.content;
    if (typeof content !== "string") return;

    if (content.startsWith("javascript:")) {
      errors.push(`Snippet "${snippet.name}": content must not start with "javascript:" (remove the bookmarklet wrapper)`);
    } else if (/%[0-9A-Fa-f]{2}/.test(content)) {
      errors.push(`Snippet "${snippet.name}": content must not be URL-encoded (contains % sequences like %20)`);
    }
  }

  function walk(items) {
    for (const item of items) {
      if (Array.isArray(item.children)) {
        walk(item.children);
      } else {
        checkSnippet(item);
      }
    }
  }

  walk(collection);
  return errors;
}

function validateFile(inputPath, validate) {
  let parsedInput;
  try {
    parsedInput = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    return [`Unable to read or parse JSON at ${inputPath}:\n\t ${error.message}`];
  }

  const collection = toSnippetCollection(parsedInput);
  if (!collection) {
    return ["Input JSON must be a snippet object or an array of snippet/folder objects."];
  }

  const isValid = validate(collection);
  if (!isValid) {
    return formatAjvErrors(validate.errors);
  }

  return checkUrlEncodedContent(collection);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  const { mode, inputPath } = parseArgs(args);
  const schemaPath = path.resolve(__dirname, "schema.json");

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (error) {
    fail(`Unable to read schema at ${schemaPath}:\n\t ${error.message}`);
  }

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (mode === "single") {
    const errors = validateFile(inputPath, validate);
    if (errors.length > 0) {
      failValidation(
        inputPath,
        errors.map((message) => ({ message })),
      );
      process.exit(1);
    }

    process.exit(0);
  }

  const jsonFiles = collectJsonFiles(inputPath);
  if (jsonFiles.length === 0) {
    fail(`No .json files found in ${inputPath}`);
  }

  const failures = [];

  for (const filePath of jsonFiles) {
    const errors = validateFile(filePath, validate);
    if (errors.length > 0) {
      failures.push({ filePath, errors });
    }
  }

  if (failures.length === 0) {
    process.exit(0);
  }

  for (const failure of failures) {
    const errorObjects = failure.errors.map((message) => ({ message }));
    failValidation(failure.filePath, errorObjects);
  }

  process.exit(1);
}

main();
