import { GraphQLClient } from "graphql-request";

const client = new GraphQLClient(`${process.env.GRAPHQL_API_URL}/v1/graphql`, {
  headers: {
    "x-hasura-admin-secret": process.env.GRAPHQL_ADMIN_SECRET!,
  },
});

export default client;
