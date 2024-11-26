export type JsonRpcResult<T> = {
  id: number;
  jsonrpc: string;
  result: T;
};
