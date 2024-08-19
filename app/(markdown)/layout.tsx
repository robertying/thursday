import "@primer/css/dist/primitives.css";
import "@primer/css/dist/color-modes.css";
import "@primer/css/dist/base.css";
import "@primer/css/dist/markdown.css";
import "./markdown.css";

export default function MarkdownLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="py-16 px-6 prose-img:my-2">{children}</main>;
}
