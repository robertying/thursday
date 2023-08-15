import "./app.css";

export const metadata = {
  title: {
    default: "星期四 Thursday",
    template: "%s｜星期四 Thursday",
  },
  description: "星期四大学信息化建设推进计划。",
  applicationName: "Thursday",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-cmn-Hans">
      <body
        data-color-mode="auto"
        data-light-theme="light"
        data-dark-theme="dark"
        className="mx-auto prose dark:prose-invert prose-lg sm:prose-lg md:prose-lg lg:prose-lg xl:prose-xl 2xl:prose-xl"
      >
        {children}
      </body>
    </html>
  );
}
