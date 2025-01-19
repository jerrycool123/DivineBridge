import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import * as tar from 'tar';

// ? Note: you might need to download your platform-specific version of mongodump in order to do local testing
// ? Here: https://www.mongodb.com/download-center/database-tools/releases/archive
const FILE_NAME = 'mongodb-database-tools-amazon2-x86_64-100.9.4';
const DOWNLOAD_URL = `https://fastdl.mongodb.org/tools/db/${FILE_NAME}.tgz`;
const parentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const download = async () => {
  const tgzPath = path.join(parentDir, `${FILE_NAME}.tgz`);
  const finalPath = path.join(parentDir, 'mongodump');
  if (
    await fsp
      .stat(finalPath)
      .then(() => true)
      .catch(() => false)
  ) {
    console.log('mongodump already exists');
    return;
  }

  console.log(`Downloading ${FILE_NAME}.tgz...`);
  const res = await fetch(DOWNLOAD_URL);
  if (res.body === null) {
    throw new Error('No body');
  }

  await pipeline(Readable.fromWeb(res.body as ReadableStream), fs.createWriteStream(tgzPath));
  console.log('Download complete');

  console.log(`Extracting mongodump from ${FILE_NAME}.tgz...`);

  await pipeline(
    fs.createReadStream(tgzPath),
    zlib.createGunzip(),
    tar.extract({
      cwd: parentDir,
      onentry: (entry) => {
        if (entry.path === `${FILE_NAME}/bin/mongodump`) {
          entry.pipe(fs.createWriteStream(finalPath, { mode: 0o755 }));
        } else {
          entry.resume();
        }
      },
    }),
  );

  console.log('Extract complete');

  // Remove the tgz file and the extracted directory
  await fsp.unlink(tgzPath);
  await fsp.rm(path.join(parentDir, FILE_NAME), { recursive: true });
};

await download();

export {};
