export interface GetSignedMessageByIdResponse {
  address: string
  signature: string | null
  status: {
    finished: boolean
    signed: boolean
    success: boolean
    displayText: string
  }
}
