# Developer Guide

## Project Structure

- Monorepo management tool: [Turborepo](https://turbo.build/repo)
- Package manager: [pnpm](https://pnpm.io/)
- Database: [MongoDB](https://www.mongodb.com/)
- Logger: [OpenObserve](https://openobserve.ai/)

### Applications

Applications are located in the `./apps` directory.

- `web`: The web interface of Divine Bridge.
- `server`: The server that runs the Discord bot.
- `sls-ocr`: A serverless app that utilizes [tesseract](https://github.com/tesseract-ocr/tesseract) to perform OCR.
- `sls-backup`: A serverless app that backs up the database.
- `sls-check-membership`: A serverless app that removes expired memberships.

### Packages

Packages are located in the `./packages` directory.

- `@divine-bridge/eslint-config-custom`: Shared ESLint configuration of this project.
- `@divine-bridge/prettier-config-custom`: Shared Prettier configuration of this project.
- `@divine-bridge/common`: Shared components and utilities between applications.
- `@divine-bridge/ocr-service`: An OCR API wrapper specifically for recognizing and parsing the billing date of the screenshot of the YouTube membership page.
- `@divine-bridge/i18n`: Shared internationalization files between applications.
- `@divine-bridge/serverless-offline-lambda-function-urls`: A modified version of [serverless-offline-lambda-function-urls](https://www.npmjs.com/package/serverless-offline-lambda-function-urls) to support function URLs and hot-reloading in serverless-offline.

## Local Development

### Prerequisites

- `pnpm`
- `serverless` cli ([guide](https://www.serverless.com/framework/docs/getting-started))
- Node.js version: 20+
- You need to sign up for an [OpenObserve](https://cloud.openobserve.ai/) account to use the logger.

### Environment Variables

#### AWS Lambda Deployment

By default, this project deploys serverless apps to [AWS Lambda](https://aws.amazon.com/free). To deploy the apps, you need to register an AWS account and set up the AWS CLI. Please refer to the _To create, modify, or delete the access keys of another IAM user (console)_ section of the [official guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey) for more information.

Please refer to the `.aws.env.example` file, and create a `.aws.env` file in the root directory of this project. Then, run the following command:

```bash
pnpm aws:config
```

#### Web

Please refer to the `./apps/web/.env.example` file, and create a `.env.development.local` file in the `./apps/web` directory.

More information about the environment variables can be found in the [Next.js documentation](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables).

#### Server

Please refer to the `./apps/server/.env.example` file, and create a `.env` file in the `./apps/server` directory.

#### Serverless Apps

There are 3 serverless apps:

- `sls-ocr`
- `sls-backup`
- `sls-check-membership`

Please refer to the `./apps/sls-*/.env.example` files, and create a `.env.development.local` file for each app in the `./apps/sls-*` directory.

More information about the environment variables can be found in the [serverless-dotenv-plugin guide](https://github.com/neverendingqs/serverless-dotenv-plugin).

### OCR Service

In order to run the OCR tests, please refer to the `./packages/ocr-service/.env.test.example` file, and create a `.env.test.local` file in the `./packages/ocr-service` directory.

### Start the apps in development mode

Run the following commands:

```bash
pnpm install
pnpm run dev
```

### Caveats

- The `mongodump` binary downloaded in `sls-backup` might not be compatible with your system. The default `mongodump` binary is for AWS Lambda's environment. If you want to run the `sls-backup` app locally, you need to replace the `mongodump` binary with the one that is compatible with your system. Please take a look at `./apps/sls-backup/scripts/download-mongodump.ts` for more information.

## Deployment & Production

### Web

You need to specify production environment variables in the `.env.production.local` file in the `./apps/web` directory.

Run the following command to build and start the web app:

```bash
pnpm run build:web
pnpm run start:web
```

You can sign up for a [Vercel](https://vercel.com/) account and deploy the web app to Vercel.

The web app utilizes Next.js 13+ app directory and server actions, as a both-end solution. It does not interact with the server app directly. Thus, you can deploy the web app and the server app in completely different platforms.

### Server

The server app is a normal Node.js app. You can deploy it to any cloud service provider that supports Node.js.

Run the following command to build and start the server:

```bash
pnpm run build:server
pnpm run start:server
```

Due to Discord bot's limitation, you need to run the server app on a server that is always online.

### Serverless Apps

To deploy the serverless apps on AWS, make sure you have set up the AWS CLI in the prerequisites section.

Run the following command to deploy the serverless apps:

```bash
# To deploy `sls-ocr`
pnpm run deploy:sls-ocr

# To deploy `sls-backup`
pnpm run deploy:sls-backup

# To deploy `sls-check-membership`
pnpm run deploy:sls-check-membership
```

## Contribution

Pull requests are welcome.

### Internationalization (i18n)

This project uses [i18next](https://www.i18next.com/) for internationalization. The default language is `en-US`.

Currently, the following languages are supported:

- English (en-US)
- Traditional Chinese (zh-TW)

If you want to add a new language support, please modify the following files:

- New locale file should be added to `./packages/i18n/src/locales/[language].json`.
- Add the new language to the `supportedLocales` array in `./packages/i18n/src/constants.ts`.
- Add the new resource to the `resources` object in `./packages/i18n/src/index.ts`.

### OCR Service

This project supports billing date parsers for the following languages:

- English (eng)
- Simplified Chinese (chi_sim)
- Traditional Chinese (chi_tra)
- Japanese (jpn)
- German (deu)
- Filipino (fil)
- Indonesian (ind)
- Japanese (jpn)
- Korean (kor)
- Malay (msa)
- Thai (tha)
- Vietnamese (vie)

If you want to add a new language support, please refer to [Languages/Scripts supported in different versions of Tesseract](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html). Only the languages that are supported by Tesseract can be added.

And then, please modify the following files:

- Add a new file exporting a date parser `class`, which `implements` the `BillingDateParser`, in `./packages/ocr-service/src/parsers/[lang_code].ts`. Please make sure it correctly parses the billing date of the screenshot of the YouTube membership page.
- Export the class in `./packages/ocr-service/src/parsers/index.ts`.
- Import the class in `./packages/ocr-service/src/parsers.ts` and add it to the `billingDateParsers` object.
- Add testing image and script to `./packages/ocr-service/tests/ocr.test.ts`. Don't forget to run the tests to make sure the new parser works correctly.
