export type ChainId =
  | '0x1'
  | '0x89'
  | '0x4268'
  | '0xe705'
  | '0xe708'
  | '0x13882'
  | '0xaa36a7';

export const chains: Record<ChainId, string> = {
  '0x1': 'mainnet',
  '0x89': 'polygon',
  '0x4268': 'holesky',
  '0xe705': 'linea-sepolia',
  '0xe708': 'linea-mainnet',
  '0x13882': 'polygon-amoy',
  '0xaa36a7': 'sepolia',
};

// Use the infura API to get transaction count for the nonce
export const getTransactionCount = async (
  address: string,
  chainId: ChainId,
) => {
  const infuraId = process.env.INFURA_PROJECT_ID;
  if (!infuraId) {
    throw new Error('INFURA_PROJECT_ID is not set');
  }

  const rpcUrl = `https://${chains[chainId]}.infura.io/v3/${infuraId}`;

  const payload = {
    method: 'eth_getTransactionCount',
    params: [address, 'pending'],
    id: 1,
    jsonrpc: '2.0',
  };
  const response = await fetch(rpcUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();

  return data.result;
};
