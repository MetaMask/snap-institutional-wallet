export interface GetSignedMessageLinkResponse {
  signedMessageId: string
  url: string
  text: string
  action: string
  showLink: boolean
  ethereum?: {
    accounts: string[]
    chainId: string[]
  }
}
