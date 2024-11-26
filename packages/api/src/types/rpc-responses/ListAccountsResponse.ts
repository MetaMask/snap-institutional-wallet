interface AccountWithMetadata {
  address: string
  name: string
  tags: [{ name: string; value: string }]
  metadata: { active: boolean; deleted: boolean; isContract: boolean }
}

export type ListAccountsResponse = AccountWithMetadata[]
