export const TRANSACTION_TYPES = {
  LEGACY: '0',
  EIP1559: '2',
} as const;

export const ERROR_MESSAGES = {
  ACCOUNT_NOT_FOUND: (id: string) => `Account '${id}' not found`,
  REQUEST_NOT_FOUND: (id: string) => `Request '${id}' not found`,
  TRANSACTION_NOT_FOUND: (id: string) => `Transaction '${id}' not found`,
} as const;
