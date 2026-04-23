"use strict";
const crypto = require("node:crypto");

const STORE_BODY = "solis_body";
const STORE_DATE = "solis_date";

function gmtDate() {
  return new Date().toUTCString();
}

function md5Base64(body) {
  return crypto.createHash("md5").update(body, "utf8").digest("base64");
}

function hmacSha1Base64(secret, message) {
  return crypto.createHmac("sha1", secret).update(message).digest("base64");
}

exports.plugin = {
  templateFunctions: [
    {
      // Used in the request body field. Stores the JSON so the other tags
      // can read it without the user repeating it.
      name: "solisBody",
      label: "Solis Body",
      description:
        "Set as the request body. Stores the value for solisMd5 and solisAuth.",
      args: [
        {
          type: "text",
          name: "body",
          label: "Request Body JSON",
          placeholder: '{"pageNo":1,"pageSize":10}',
          multiLine: true,
        },
      ],
      async onRender(ctx, args) {
        const body = String(args.values.body ?? "");
        await ctx.store.set(STORE_BODY, body);
        return body;
      },
    },
    {
      // Used for the Authorization header.
      // Evaluated first (A < D alphabetically) so it computes and stores
      // the date — solisDate then reads the same value.
      name: "solisAuth",
      label: "Solis Authorization",
      description:
        "Computes and stores the date, then returns the Authorization header value.",
      args: [
        {
          type: "text",
          name: "keyId",
          label: "Key ID",
          placeholder: "your-api-key-id",
        },
        {
          type: "text",
          name: "keySecret",
          label: "Key Secret",
          placeholder: "your-api-key-secret",
          password: true,
        },
        {
          type: "text",
          name: "path",
          label: "API Path",
          placeholder: "/v1/api/stationDetail",
        },
      ],
      async onRender(ctx, args) {
        const keyId = String(args.values.keyId ?? "");
        const keySecret = String(args.values.keySecret ?? "");
        const path = String(args.values.path ?? "");
        const body = (await ctx.store.get(STORE_BODY)) ?? "";

        // Compute date here and store it so solisDate returns the same value.
        const date = gmtDate();
        await ctx.store.set(STORE_DATE, date);

        const contentType = "application/json";
        const md5 = md5Base64(body);
        const stringToSign = ["POST", md5, contentType, date, path].join("\n");
        const sig = hmacSha1Base64(keySecret, stringToSign);

        return `API ${keyId}:${sig}`;
      },
    },
    {
      // Used for the Date header.
      // Reads the date that solisAuth already computed and stored.
      name: "solisDate",
      label: "Solis Date",
      description:
        "Returns the date used by solisAuth for signing. Evaluated after Authorization (D > A).",
      args: [],
      async onRender(ctx, _args) {
        return (await ctx.store.get(STORE_DATE)) ?? gmtDate();
      },
    },
    {
      // Used for the Content-MD5 header.
      name: "solisMd5",
      label: "Solis Content-MD5",
      description:
        "Returns Base64(MD5(body)) using the body stored by solisBody.",
      args: [],
      async onRender(ctx, _args) {
        const body = (await ctx.store.get(STORE_BODY)) ?? "";
        return md5Base64(body);
      },
    },
  ],
};
