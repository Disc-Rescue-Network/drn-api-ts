import http from "http";

import express, { NextFunction } from "express";
import helmet from "helmet";
import logger from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import { apiReference } from "@scalar/express-api-reference";

import { SuccessResponse, ResponseData } from "../lib/service-response";
import oapi, { errorHandler as oapiErrorHandler } from "../lib/openapi";

import defaultErrorHandler from "./error";
import storeErrorHandler from "../store/error";

import course from "../services/course";
import inventory from "../services/inventory";
import brand from "../services/brand";
import disc from "../services/disc";
import sms from "../services/sms";
import ai from "../services/ai";
import notification from "../services/notification";
import ticket from "../services/ticket";

import healthCheck from "./healthcheck";

import socket from "./socket";

export class Web {
  private app: express.Application;

  async init(server: http.Server) {
    this.app = express();

    this.addMany([
      compression(),
      logger("dev"),
      bodyParser.json({ limit: "5mb" }),
      bodyParser.urlencoded({ extended: true }),
      helmet({
        contentSecurityPolicy: {
          directives: {
            "script-src": [
              "'self'",
              "cdnjs.cloudflare.com",
              "cdn.jsdelivr.net",
              "'unsafe-inline'",
              "'unsafe-eval'",
            ],
          },
        },
      }),
      cors({
        allowedHeaders: ["Content-Type", "Authorization"],
        origin: [
          "http://localhost:3000",
          "http://localhost:3001",
          /\.discrescuenetwork\.com$/,
        ],
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      }),
    ]);

    this.app.get("/health-check", healthCheck);

    this.app.get(
      "/docs",
      apiReference({
        theme: "default",
        spec: {
          url: "/openapi.json",
        },
      })
    );

    await socket.init(server);

    disc.init();
    brand.init();
    course.init();
    inventory.init();
    sms.init();
    ai.init();
    notification.init();
    ticket.init();

    this.add(oapi);

    this.add(socket.router, socket.basePath);
    this.add(disc.router, disc.basePath);
    this.add(brand.router, brand.basePath);
    this.add(course.router, course.basePath);
    this.add(inventory.router, inventory.basePath);
    this.add(sms.router, sms.basePath);
    this.add(ai.router, ai.basePath);
    this.add(notification.router, notification.basePath);
    this.add(ticket.router, ticket.basePath);

    this.add(storeErrorHandler);
    this.add(oapiErrorHandler);
    this.add(defaultErrorHandler);

    express.response.success = async function (
      dataOrPromise: Promise<ResponseData | undefined> | ResponseData,
      next: NextFunction
    ) {
      let result: ResponseData;

      if (dataOrPromise instanceof Promise) {
        try {
          result = await dataOrPromise;
        } catch (err) {
          return next(err);
        }
      } else result = dataOrPromise;

      if (typeof result === "string")
        return this.json(new SuccessResponse(undefined, result));

      this.json(new SuccessResponse(result));
    };

    return this;
  }

  public add(middleware: any, basePath?: string) {
    if (basePath) return this.app.use(basePath, middleware);

    this.app.use(middleware);
  }

  public addMany(middlewares: any[]) {
    middlewares.forEach((mw) => {
      this.app.use(mw);
    });
  }

  public getRequestListener() {
    return this.app;
  }
}

export default new Web();
