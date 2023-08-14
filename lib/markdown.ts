import { unified } from "unified";
import markdown from "remark-parse";
import externalLinks from "remark-external-links";
import remark2rehype from "remark-rehype";
import raw from "rehype-raw";
import slug from "rehype-slug";
import stringify from "rehype-stringify";
import sanitize from "rehype-sanitize";

export const markdownToHtml = async (markdownString: string) => {
  const file = await unified()
    .use(markdown)
    .use(externalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(slug)
    .use(raw)
    .use(stringify)
    .use(sanitize)
    .process(markdownString);
  return file.toString();
};
