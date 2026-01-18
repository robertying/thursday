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
    if (!token) return reject(new Error("No token provided to verify"));

    const verifyOnce = (secret: string, onFail?: (err: unknown) => void) => {
      jwt.verify(token, secret, { algorithms: ["HS512"] }, (err, decoded) => {
        if (!err && decoded) return resolve(decoded as JwtPayload);
        if (onFail) return onFail(err);
        return reject(err ?? new Error("JWT verification failed"));
      });
    };

    if (type === "access") {
      const secret = process.env.AUTH_ACCESS_TOKEN_SECRET!;
      return verifyOnce(secret);
    }

    const current = process.env.AUTH_REFRESH_TOKEN_SECRET!;
    const previous = process.env.AUTH_REFRESH_TOKEN_SECRET_PREV!;

    return verifyOnce(current, () => {
      return verifyOnce(previous);
    });
  });
};
