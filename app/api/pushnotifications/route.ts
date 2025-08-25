import { NextResponse } from "next/server";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export async function POST(req: Request) {
  const body = await req.json();

  const { payload, tokens } = body;
  if (!payload || !tokens) {
    return NextResponse.json({}, { status: 400 });
  }

  if (payload.version !== 1) {
    return NextResponse.json(
      { error: "Unsupported payload version" },
      { status: 400 },
    );
  }
  if (
    !Array.isArray(payload.notices) ||
    !Array.isArray(payload.assignments) ||
    !Array.isArray(payload.files) ||
    !Array.isArray(payload.grades)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (
    payload.notices.length === 0 &&
    payload.assignments.length === 0 &&
    payload.grades.length === 0 &&
    payload.files.length === 0
  ) {
    return NextResponse.json({ error: "Empty payload" }, { status: 400 });
  }

  if (!Array.isArray(tokens)) {
    return NextResponse.json({ error: "Invalid tokens" }, { status: 400 });
  }
  if (tokens.length === 0) {
    return NextResponse.json({ error: "Empty tokens" }, { status: 400 });
  }

  const expoTokens: string[] = [];
  for (const token of tokens) {
    const expoToken = `ExponentPushToken[${token}]`;
    if (!Expo.isExpoPushToken(expoToken)) {
      return NextResponse.json(
        { error: "Invalid Expo push token" },
        { status: 400 },
      );
    }
    expoTokens.push(expoToken);
  }

  const messages: ExpoPushMessage[] = [];
  for (const notice of payload.notices) {
    messages.push({
      to: expoTokens,
      title: "新通知",
      subtitle: notice.courseName,
      body: notice.title,
      data: notice,
      sound: "default",
      _contentAvailable: true,
    });
  }
  for (const assignment of payload.assignments) {
    messages.push({
      to: expoTokens,
      title: "新作业",
      subtitle: assignment.courseName,
      body: assignment.title,
      data: assignment,
      sound: "default",
      _contentAvailable: true,
    });
  }
  for (const file of payload.files) {
    messages.push({
      to: expoTokens,
      title: "新文件",
      subtitle: file.courseName,
      body: file.title,
      data: file,
      sound: "default",
      _contentAvailable: true,
    });
  }
  for (const grade of payload.grades) {
    messages.push({
      to: expoTokens,
      title: "成绩更新",
      subtitle: grade.courseName,
      body: grade.title,
      data: grade,
      sound: "default",
      _contentAvailable: true,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);

  const results = await Promise.allSettled(
    chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)),
  );
  if (results.every((result) => result.status === "rejected")) {
    return NextResponse.json(
      { error: "Failed to send push notifications" },
      { status: 500 },
    );
  }

  return NextResponse.json({});
}
