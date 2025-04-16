// Windsurf Alternate File Plugin (TypeScript)
import * as fs from 'fs';
import * as path from 'path';

// This function will be registered as a Windsurf command
export async function openAlternateFile(context: any) {
  const projectionsPath = path.resolve(process.cwd(), 'projections.json');
  if (!fs.existsSync(projectionsPath)) {
    context.showError('projections.json not found in project root.');
    return;
  }
  const projections = JSON.parse(fs.readFileSync(projectionsPath, 'utf-8'));
  const activeFile = context.activeFilePath;
  if (!activeFile) {
    context.showError('No active file.');
    return;
  }
  const relPath = path.relative(process.cwd(), activeFile);
  let found = false;
  for (const [pattern, confRaw] of Object.entries(projections)) {
    const conf = confRaw as { alternate: string };
    const glob = pattern.replace('*', '(.*)');
    const match = relPath.match(new RegExp('^' + glob + '$'));
    if (match) {
      const stem = match[1];
      const altPattern = conf.alternate;
      const altPath = altPattern.replace('{}', stem);
      const absAltPath = path.resolve(process.cwd(), altPath);
      if (fs.existsSync(absAltPath)) {
        context.openFile(absAltPath);
      } else {
        context.showError(`Alternate file not found: ${altPath}`);
      }
      found = true;
      break;
    }
  }
  if (!found) {
    context.showError('No projection found for this file.');
  }
}

// Register the command (Windsurf plugin API example)
module.exports = {
  activate: (context: any) => {
    context.registerCommand('alternateFile.open', () => openAlternateFile(context));
  }
};
