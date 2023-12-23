import fs from "fs";
import rl from "readline";

interface readLinesOptions {
  /**
   * The number of lines to read.
   */
  limit?: number;
}

/**
 * Reads a file line by line.
 * @param path The path to the file.
 * @param cb The callback function to be called for each line.
 * @param opts.limit The number of lines to read.
 * @returns A promise that resolves when the file has been read
 */
async function readLines(
  path: string,
  cb: (line: string, i: number) => void,
  opts: readLinesOptions = {},
  onFinish?: (err?: Error) => void
): Promise<void> {
  let reader = rl.createInterface({
    input: fs.createReadStream(path, "utf-8")
  });

  let i = 0;

  return new Promise((res, rej) => {
    reader.on("line", line => {
      cb(line, i);
      i++;
      if (opts.limit && i >= opts.limit) {
        reader.close();
        res();
      }
    });

    reader.on("close", () => {
      res();
      onFinish?.();
    });
    
    reader.on("error", err => {
      rej(err);
      onFinish?.(err);
    });
  });
}

/**
 * Reads a file line by line.
 * @param path The path to the file.
 * @param cb The callback function to be called for each line.
 * @param opts.limit The number of lines to read.
 * @returns A promise that resolves when the file has been read
 */
function readLinesSync(
  path: string,
  cb: (line: string, i: number) => void,
  opts: readLinesOptions = {}
) {
  const readSize = 1;
  const newLineChar = "\n";

  let fd = fs.openSync(path, "r");
  let buffer = Buffer.alloc(readSize);
  let line = "";
  let newLine = false;
  let read: number;

  let i = 0;

  do {
    read = fs.readSync(fd, buffer, 0, readSize, null);
    let char = buffer.toString("utf-8", 0, read);
    if (char === newLineChar) {
      newLine = true;
      cb(line, i);
      line = "";
      i++;
      if (opts.limit && i >= opts.limit) break;
    } else line += char;
  } while (read === readSize);
}

export { readLines, readLinesSync };
