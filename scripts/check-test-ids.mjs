import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import process from "node:process";
import ts from "typescript";

const SOURCE_ROOT = join(process.cwd(), "src");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const STATIC_TEST_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNSAFE_IDENTIFIERS = new Set(["index", "idx", "arrayIndex", "useId"]);
const UNSAFE_CALLS = new Set([
  "Date.now",
  "Math.random",
  "crypto.randomUUID",
  "randomUUID",
]);

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return listSourceFiles(entryPath);
      }

      return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat();
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function isTestIdAttribute(node) {
  return (
    ts.isJsxAttribute(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === "data-testid"
  );
}

function isTestIdProperty(node) {
  return (
    ts.isPropertyAssignment(node) &&
    propertyNameText(node.name) === "data-testid"
  );
}

function formatLocation(sourceFile, node) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return `${relative(process.cwd(), sourceFile.fileName)}:${position.line + 1}:${position.character + 1}`;
}

function validateStaticPart(value, sourceFile, node, errors, partial = false) {
  if (value.length === 0) {
    return;
  }

  const pattern = partial ? /^[a-z0-9-]+$/ : STATIC_TEST_ID_PATTERN;

  if (!pattern.test(value)) {
    errors.push(
      `${formatLocation(sourceFile, node)} data-testid "${value}" must use lowercase kebab-case`,
    );
  }
}

function callName(expression) {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return `${callName(expression.expression)}.${expression.name.text}`;
  }

  return "";
}

function validateDynamicExpression(expression, sourceFile, errors) {
  function visit(node) {
    if (ts.isIdentifier(node) && UNSAFE_IDENTIFIERS.has(node.text)) {
      errors.push(
        `${formatLocation(sourceFile, node)} data-testid must not depend on ${node.text}`,
      );
    }

    if (ts.isCallExpression(node) && UNSAFE_CALLS.has(callName(node.expression))) {
      errors.push(
        `${formatLocation(sourceFile, node)} data-testid must not use ${callName(node.expression)}()`,
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(expression);
}

function validateExpression(expression, sourceFile, node, errors) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    validateStaticPart(expression.text, sourceFile, node, errors);
    return;
  }

  if (ts.isTemplateExpression(expression)) {
    validateStaticPart(expression.head.text, sourceFile, node, errors, true);
    for (const span of expression.templateSpans) {
      validateDynamicExpression(span.expression, sourceFile, errors);
      validateStaticPart(span.literal.text, sourceFile, node, errors, true);
    }
    return;
  }

  validateDynamicExpression(expression, sourceFile, errors);
}

function validateSource(sourceFile) {
  const errors = [];
  let testIdCount = 0;

  function visit(node) {
    if (isTestIdAttribute(node)) {
      testIdCount += 1;

      if (node.initializer && ts.isStringLiteral(node.initializer)) {
        validateStaticPart(node.initializer.text, sourceFile, node, errors);
      } else if (
        node.initializer &&
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression
      ) {
        validateExpression(node.initializer.expression, sourceFile, node, errors);
      }
    }

    if (isTestIdProperty(node)) {
      testIdCount += 1;
      validateExpression(node.initializer, sourceFile, node, errors);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { errors, testIdCount };
}

const files = await listSourceFiles(SOURCE_ROOT);
const results = await Promise.all(
  files.map(async (file) => {
    const source = await readFile(file, "utf8");
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    return validateSource(sourceFile);
  }),
);

const errors = results.flatMap((result) => result.errors);
const testIdCount = results.reduce((total, result) => total + result.testIdCount, 0);

if (errors.length > 0) {
  console.error(`Found ${errors.length} invalid data-testid declaration(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated ${testIdCount} data-testid declarations across ${files.length} source files.`);
}
