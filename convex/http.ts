import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * Public streaming endpoint for Convex Storage files.
 * Allows permanent resolution of images and videos via:
 * https://<deployment>.convex.site/api/storage/<storageId>
 */
http.route({
  pathPrefix: "/api/storage/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { pathname } = new URL(request.url);
    const storageId = pathname.replace(/^\/api\/storage\//, "").split("?")[0].trim();
    if (!storageId) {
      return new Response("Missing storage ID", { status: 400 });
    }

    try {
      const blob = await ctx.storage.get(storageId as any);
      if (!blob) {
        return new Response("File not found in storage", { status: 404 });
      }

      return new Response(blob, {
        status: 200,
        headers: new Headers({
          "Content-Type": blob.type || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        }),
      });
    } catch {
      return new Response("Error retrieving file", { status: 500 });
    }
  }),
});

export default http;
