const DIVIDER_LINE = 'log----';
const appConsole = console as any;

if (!appConsole.__neupConsoleDividerInstalled) {
  const baseLog = appConsole.log.bind(appConsole) as (...args: any[]) => void;
  const methods = ['log', 'info', 'warn', 'error', 'debug'];

  for (const method of methods) {
    const original = appConsole[method]?.bind(appConsole) as ((...args: any[]) => void) | undefined;
    if (!original) continue;

    appConsole[method] = (...args: any[]) => {
      original(...args);
      baseLog(DIVIDER_LINE);
      baseLog(DIVIDER_LINE);
    };
  }

  appConsole.__neupConsoleDividerInstalled = true;
}
