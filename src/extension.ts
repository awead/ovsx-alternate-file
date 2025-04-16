import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('alternateFile.open', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      return;
    }
    const activeFile = vscode.workspace.asRelativePath(editor.document.uri.fsPath);
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const projectionsPath = path.join(rootPath, 'projections.json');
    if (!fs.existsSync(projectionsPath)) {
      vscode.window.showErrorMessage('projections.json not found in workspace root.');
      return;
    }
    const projections = JSON.parse(fs.readFileSync(projectionsPath, 'utf-8'));
    let found = false;
    for (const [pattern, confRaw] of Object.entries(projections)) {
      const conf = confRaw as { alternate: string };
      const glob = pattern.replace('*', '(.*)');
      const match = activeFile.match(new RegExp('^' + glob + '$'));
      if (match) {
        const stem = match[1];
        const altPattern = conf.alternate;
        const altPath = altPattern.replace('{}', stem);
        const absAltPath = path.join(rootPath, altPath);
        if (fs.existsSync(absAltPath)) {
          const doc = await vscode.workspace.openTextDocument(absAltPath);
          await vscode.window.showTextDocument(doc, { preview: false });
        } else {
          vscode.window.showErrorMessage(`Alternate file not found: ${altPath}`);
        }
        found = true;
        break;
      }
    }
    if (!found) {
      vscode.window.showErrorMessage('No projection found for this file.');
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
