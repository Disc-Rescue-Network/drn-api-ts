# drn-api-ts

This is the Disc Rescue Network API.

## Local Development

Install with `yarn`

Run with `yarn start`

## Deployment

Github Actions are used to deploy branches master and development on AWS EC2 instance

## Environment Variables

This app will throw an error and notify you of missing environment variables. The current required are:

- `APP_PORT` = API port to serve on
- `APP_CORS` = This API CORS, can be a comma separated list
- `DB_HOST` = Database host to connect to
- `DB_USER` = Database user to use
- `DB_PASSWORD` = Database user password
- `DB_NAME` = The database name to query on
- `DB_DIALECT` = The database to use
- `AUTH_ISSUER` = issuer of auth bearer tokens
- `AUTH_AUDIENCE` = AUD for auth bearer token validation
- `TWILIO_SID` = Twilio SID from account details in login
- `TWILIO_AUTH_TOKEN` = Twilio Auth Token from account details in login
- `TWILIO_SEND_FROM` = the Twilio number to send messages from
- `TWILIO_WEBHOOK_URL` = the Twilio webhook url where new messages get POSTed to on this API
- `TWILIO_VCF_URL` = where the VCard is served from
- `TWILIO_MESSAGING_SID` = MGXXXXXXXXXX

## Code Architecture

### [/src](/src)

`server.ts` is the main entry point for starting the http server.

`web/index.ts` is the web request handler/listener that registers routes for different services.

### [/src/services](/src/services)

Services is where the app routes requests to be handled. Within services is subdirectores for domains, and each domain can have subdomains.

This includes:

- #### [inventory](/src/services/inventory)

  Found disc inventory

- #### [sms](/src/services/sms)

  Opt in/out and twilio messaging functions

- #### [discs](/src/services/disc)

  Disc golf disc mold types

- #### [brands](/src/services/brand)

  Disc golf disc brands

- #### [courses](/src/services/course)

  Disc golf courses related to inventory in the system

- #### [ai](/src/services/ai)

  Google Vision for text detection with confidence scores

  _note: this relies on a google-credentials.json being in the same directory_

### [/src/db](/src/store)

This is the directory where all storage initialization and connections are maintained. Uses [Sequelize](https://www.npmjs.com/package/zzzql) ORM.
