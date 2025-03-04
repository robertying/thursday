import "./app.css";
import BreadCrumbs from "components/Breadcrumbs";

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
      >
        <div className="mx-auto prose dark:prose-invert prose-base sm:prose-lg md:prose-lg lg:prose-lg xl:prose-xl 2xl:prose-xl">
          <BreadCrumbs />
          {children}
        </div>
      </body>
    </html>
  );
}
