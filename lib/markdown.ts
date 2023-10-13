import { unified } from "unified";
import { Schema, defaultSchema } from "hast-util-sanitize";
import markdown from "remark-parse";
import remark2rehype from "remark-rehype";
import raw from "rehype-raw";
import slug from "rehype-slug";
import externalLinks from "rehype-external-links";
import stringify from "rehype-stringify";
import sanitize from "rehype-sanitize";

const schema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    h2: ["id", ["className", "sr-only"]],
  },
};

export const markdownToHtml = async (markdownString: string) => {
  const file = await unified()
    .use(markdown)
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(raw)
    .use(slug)
    .use(externalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] })
    .use(stringify)
    .use(sanitize, schema)
    .process(markdownString);
  return file.toString();
};
