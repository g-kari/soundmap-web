import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  // TODO: Convert this route to use D1 instead of Prisma
  throw new Response("This feature is being migrated to Cloudflare D1. Coming soon!", { status: 503 });
}
