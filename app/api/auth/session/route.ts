import { NextResponse } from "next/server";
import { encodeAccessToken, verify } from "lib/jwt";

export async function POST(req: Request) {
  let refreshToken: unknown;
  try {
    refreshToken = ((await req.json()) ?? {}).refreshToken;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof refreshToken !== "string" || !refreshToken) {
    return NextResponse.json(
      { error: "Missing refresh token" },
      { status: 422 },
    );
  }

  try {
    const { id } = await verify(refreshToken, "refresh");
    if (id !== process.env.LEARNX_USER_ID) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await encodeAccessToken({
      id,
      role: "learnx",
    });
    return NextResponse.json({
      accessToken,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
