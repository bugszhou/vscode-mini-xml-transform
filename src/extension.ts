// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { format, parse, relative } from "path";
import * as vscode from "vscode";
import parseXml from "mini-xml-parser";
import { existsSync, readFileSync } from "fs";

enum SupportFileExt {
  ".wxml" = 1,
  ".axml",
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.wxml2axml",
    async (info) => {
      const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path || "";
      const filePath = info.path || "";
      const fileObj = parse(filePath);

      if (!fileObj.ext || !SupportFileExt[fileObj.ext as any]) {
        vscode.window.showErrorMessage("不是小程序xml文件，暂不支持转换");
        return;
      }
      const allConfig = vscode.workspace.getConfiguration("mini-xml-transform");

      const miniConfig =
        (
          await vscode.workspace.findFiles(
            ".vscode/**/weapp2aliapp.mini.json",
            "**/node_modules/**",
            1,
          )
        )[0] || Object.create(null);

      const src = allConfig.get("sourceFolderName") as string;

      fileObj.ext = ".axml";
      fileObj.base = `${fileObj.name}${fileObj.ext}`;

      const dest = format(fileObj);

      if (existsSync(dest)) {
        const content = readFileSync(dest, "utf-8");

        if (content.includes("@mini-transform-disabled")) {
          vscode.window.showErrorMessage("文件已存在且不可覆盖");
          return;
        }

        const result = await vscode.window.showInformationMessage(
          "文件已存在，是否要覆盖",
          {
            modal: true,
          },
          {
            title: "覆盖",
          },
        );

        if (result?.title !== "覆盖") {
          return;
        }
      }

      try {
        (process.env as any).isLowerCaseTag = true;
        const elementMappings = miniConfig.path
          ? JSON.parse(readFileSync(miniConfig.path, "utf-8") || "{}")
          : Object.create(null);

        parseXml(relative(rootPath, filePath), dest, {
          isLowerCaseTag: true,
          useRootPath: true,
          sourceDir: src,
          cwd: rootPath,
          elementMappings,
        });
        vscode.window.showInformationMessage("转换成功！");
      } catch (e) {
        console.log(e);
        vscode.window.showInformationMessage("转换失败！");
      }
    },
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
