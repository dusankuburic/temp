export interface JwtPayload {
  unique_name: string;
  nameid: string;
  role: string;
  nbf: number;
  exp: number;
  iat: number;
}
