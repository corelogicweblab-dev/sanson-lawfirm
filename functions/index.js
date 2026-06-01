/**
 * Same-origin API proxy: browser calls sansonlawfirm.web.app/api/*
 * instead of cross-site onrender.com (avoids NetworkError / tracker blocking).
 */
const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const RENDER_API =
  process.env.RENDER_API_URL || "https://sanson-lawfirm.onrender.com";

const app = express();
app.use(
  createProxyMiddleware({
    target: RENDER_API,
    changeOrigin: true,
    proxyTimeout: 120_000,
    timeout: 120_000,
    onProxyReq(proxyReq, req) {
      if (req.headers["x-forwarded-host"]) {
        proxyReq.setHeader("x-forwarded-host", req.headers["x-forwarded-host"]);
      }
    },
  })
);

exports.apiProxy = onRequest(
  {
    region: "asia-southeast1",
    timeoutSeconds: 120,
    memory: "256MiB",
    invoker: "public",
  },
  app
);
