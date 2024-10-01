import express from "express";
import { APP_PORT, APP_CORS, AUTH_ISSUER, AUTH_AUDIENCE } from "./env";
import cors from "cors";
import inventory from './services/inventory/controller'
import {
  getInventory,
  patchInventory,
  postInventory,
} from "./services/inventory/inventory.service";
import * as OpenApiValidator from "express-openapi-validator";
import openApiSpec from "./api.json";
import course from "./services/courses/controller";
import ai from "./services/ai/controller";
import brand from "./services/brands/controller";
const { auth } = require("express-oauth2-jwt-bearer");
import db, { healthCheck } from "./db/db";
import disc from "./services/discs/controller";
import { requireOrgAuth } from "./middleware";
import sms from "./services/sms/controller";
import {
  getPhoneOptIns,
  handleTwilioSms,
  postSms,
  putPhoneOptIn,
} from "./services/sms/sms.service";
import web from "./services/web/controller";
import bodyParser from "body-parser";
import { vcard } from "./vcard";

import config from "./config";
import store from "./store";

import './lib'

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

const apiSpec = openApiSpec as any; // TODO: use yaml by path (best) or import (last)

/**
 * middleware that enforces in the {@link openApiSpec}
 */
const apiSpecMiddleware = [
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
    validateResponses: true,
  }),
  (err, req, res, next) => {
    console.error(err, "api spec error");
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  },
];

/**
 * middleware that requires a minimal valid auth token
 */
const requireLogin = auth({
  issuerBaseURL: AUTH_ISSUER,
  audience: AUTH_AUDIENCE,
});

/**
 * cors middleware
 */
app.use(
  cors({
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: [
        'http://localhost:3000',
        'https://discrescuenetwork.com',
        /\.discrescuenetwork\.com$/
    ],
    methods: ["GET", "POST", "PATCH"],
  })
);

app.get("/health-check", web.healthCheck);

app.get("/discs", ...apiSpecMiddleware, disc.findAll);

app.get("/brands", ...apiSpecMiddleware, brand.findAll);

app.get("/inventory", ...apiSpecMiddleware, inventory.findAll);
app.post("/inventory", requireLogin, ...apiSpecMiddleware, inventory.create);
app.patch(
  "/inventory/:itemId",
  requireLogin,
  requireOrgAuth(async (req) => {
    const item = await inventory.service.findById(parseInt(req.params.itemId))
    if (item)
        return item.orgCode
    return null
  }),
  ...apiSpecMiddleware,
  inventory.update
);

app.get("/courses", ...apiSpecMiddleware, course.findAll);

app.post("/ai/image", requireLogin, ...apiSpecMiddleware, ai.extractImageText);

app.get("/phone-opt-ins", sms.findAllPhoneOptIns);
app.post("/phone-opt-ins/twilio", ...apiSpecMiddleware, sms.handleTwilioSms);
app.get("/phone-opt-ins/twilio/vcf", async (req, res) => {
  res.setHeader("Content-Type", "text/vcard");
  res.send(vcard);
});
app.put("/phone-opt-ins", requireLogin, ...apiSpecMiddleware, sms.updatePhoneOptIn);
app.post("/sms", requireLogin, ...apiSpecMiddleware, sms.postSms);

app.listen(APP_PORT, async () => {
  await config.init()
  await store.init()
  return console.log(`Server listening @ http://localhost:${APP_PORT}`);
});
