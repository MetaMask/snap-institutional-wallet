export type JsonRpcResult<ResultType> = {
  id: number;
  jsonrpc: string;
  result: ResultType;
};
