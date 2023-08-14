import type { CodegenConfig } from "@graphql-codegen/cli";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [`${process.env.GRAPHQL_API_URL}/v1/graphql`]: {
        headers: {
          "x-hasura-admin-secret": process.env.GRAPHQL_ADMIN_SECRET,
        } as Record<string, string>,
      },
    },
  ],
  documents: "app/**/*.tsx",
  generates: {
    "gql/": {
      preset: "client",
      plugins: [],
    },
  },
  config: {
    scalars: {
      timestamptz: "string",
      uuid: "string",
    },
  },
};

export default config;
