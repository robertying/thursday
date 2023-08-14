import { markdownToHtml } from "lib/markdown";

export const metadata = {
  title: "learnX Companion - 清华大学网络学堂 App 助手",
  description:
    "清华大学网络学堂 App 助手，为 learnX 提供个性化的推送通知支持。",
};

const LearnXCompanion: React.FC = async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/robertying/learnX-companion/main/README.md",
    {
      next: {
        revalidate: 24 * 60 * 60, // 24h
      },
    },
  );
  const md = await response.text();

  const html = await markdownToHtml(md);
  const content = html
    .replace(
      /(src|href)="(?!https:|http:|#)(.*?)"/gi,
      `$1="https://cdn.jsdelivr.net/gh/robertying/learnX-companion@main/$2"`,
    )
    .replace(/href="#(.*?)"/gi, `href="#user-content-$1"`);

  return (
    <article
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default LearnXCompanion;
