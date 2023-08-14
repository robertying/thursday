import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export const encodeAccessToken = (user: { id: string; role: string }) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      {
        id: user.id,
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": [user.role],
          "x-hasura-default-role": user.role,
          "x-hasura-user-id": user.id,
          "x-hasura-user-realms": `{1}`,
        },
      },
      process.env.AUTH_ACCESS_TOKEN_SECRET!,
      {
        algorithm: "HS512",
        expiresIn: "1h",
      },
      (err, encoded) => {
        if (err || !encoded) {
          return reject(err);
        } else {
          return resolve(encoded);
        }
      },
    );
  });
};

export const verify = (token: string | null, type: "refresh" | "access") => {
  return new Promise<JwtPayload>((resolve, reject) => {
    if (!token) {
      return reject(new Error("No token provided to verify"));
    }
    jwt.verify(
      token,
      type === "access"
        ? process.env.AUTH_ACCESS_TOKEN_SECRET!
        : process.env.AUTH_REFRESH_TOKEN_SECRET!,
      { algorithms: ["HS512"] },
      (err, decoded) => {
        if (err || !decoded) {
          return reject(err);
        } else {
          return resolve(decoded as JwtPayload);
        }
      },
    );
  });
};
