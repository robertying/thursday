import "./markdown.css";

export default function MarkdownLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="py-16 px-6 prose-img:my-2">{children}</main>;
}
