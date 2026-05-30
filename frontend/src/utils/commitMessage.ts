/** Apply {action} and {file} placeholders from the user's commit template. */
export function formatCommitMessage(
  template: string,
  action: string,
  file: string,
): string {
  return template.replace('{action}', action).replace('{file}', file).trim()
}
