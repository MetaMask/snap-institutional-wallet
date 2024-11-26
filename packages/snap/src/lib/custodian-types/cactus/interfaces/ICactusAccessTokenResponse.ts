export type ICactusAccessTokenResponse = {
  jwt: string;
  error: {
    message: string;
    code: number;
  };
};
