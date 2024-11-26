type AccountWithMetadata = {
  address: string;
  name: string;
  tags: [{ name: string; value: string }];
};

export type ECA1ListAccountsResponse = AccountWithMetadata[];
