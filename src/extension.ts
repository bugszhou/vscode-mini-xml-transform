// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { format, parse, relative } from "path";
import * as vscode from "vscode";
import parseXml from "mini-xml-parser";

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
    (info) => {
      const rootPath = vscode.workspace.workspaceFolders?.[0].uri.path || "";
      const filePath = info.path || "";
      const fileObj = parse(filePath);

      if (!fileObj.ext || !SupportFileExt[fileObj.ext as any]) {
        vscode.window.showErrorMessage("不是小程序xml文件，暂不支持转换");
        return;
      }
      const allConfig = vscode.workspace.getConfiguration("mini-xml-transform");
      const src = allConfig.get("sourceFolderName") as string;

      fileObj.ext = ".axml";
      fileObj.base = `${fileObj.name}${fileObj.ext}`;

      const dest = format(fileObj);

      try {
        parseXml(relative(rootPath, filePath), dest, {
          isLowerCaseTag: false,
          useRootPath: true,
          sourceDir: src,
					cwd: rootPath,
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
