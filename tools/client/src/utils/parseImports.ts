import { parse } from "@swc/core";
import { readFileSync } from "fs";

export const extractImports = async (filePath: string): Promise<string[]> => {
  const content = readFileSync(filePath, "utf-8");
  const ast = await parse(content, {
    syntax: "typescript",
    decorators: true,
    tsx: filePath.endsWith(".tsx"),
  });
  const imports: string[] = [];

  ast.body.forEach((node) => {
    if (node.type === "ImportDeclaration") {
      imports.push(node.source.value);
    } else if (node.type === "VariableDeclaration") {
      node.declarations.forEach((decl) => {
        if (
          decl.init?.type === "CallExpression" &&
          decl.init.callee.type === "Identifier" &&
          decl.init.callee.value === "require"
        ) {
          imports.push(decl.init.arguments[0].expression.type);
        }
      });
    }
  });

  return imports;
};
