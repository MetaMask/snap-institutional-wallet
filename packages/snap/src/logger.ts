/**
 * A simple logger utility that provides methods for logging messages at different levels.
 *
 * @namespace logger
 */

const logger = {
  log: (...args: any[]) =>
    console.log(
      '[Custodial snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  info: (...args: any[]) =>
    console.info(
      '[Custodial snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  warn: (...args: any[]) =>
    console.warn(
      '[Custodial snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  error: (...args: any[]) =>
    console.error(
      '[Custodial snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
  debug: (...args: any[]) =>
    console.debug(
      '[Custodial snap]',
      ...args.map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
      ),
    ),
};

export default logger;
