/**
 * A simple logger utility that provides methods for logging messages at different levels.
 *
 * @namespace logger
 */

const logger = {
  log: (...args: any[]) =>
    console.log(
      '[Institutional snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  info: (...args: any[]) =>
    console.info(
      '[Institutional snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  warn: (...args: any[]) =>
    console.warn(
      '[Institutional snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  error: (...args: any[]) => {
    console.error(
      '[Institutional snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    );
    console.error(args);
  },
  debug: (...args: any[]) =>
    console.debug(
      '[Institutional snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
};

export default logger;
