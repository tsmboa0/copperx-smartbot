export const NETWORK_NAMES: { [key: string]: string } = {
  "137": "Polygon",
  "42161": "Arbitrum",
  "8453": "Base",
};

export const getNetworkName = (networkId: string): string => {
  return NETWORK_NAMES[networkId] || networkId;
};
