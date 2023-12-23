import fs from "fs";
import rl from "readline";

async function readLines(
  path: string,
  cb: (line: string, i: number) => void,
  limit?: number
): Promise<void> {
  let reader = rl.createInterface({
    input: fs.createReadStream(path, "utf-8")
  });

  let i = 0;

  return new Promise((res, rej) => {
    reader.on("line", line => {
      cb(line, i);
      i++;
      if (limit && i >= limit) {
        reader.close();
        res();
      }
    });
    reader.on("close", res);
    reader.on("error", rej);
  });
}

function readLinesSync(
  path: string,
  cb: (line: string, i: number) => void,
  limit?: number
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
      if (limit && i >= limit) break;
    } else line += char;
  } while (read === readSize);
}

export { readLines, readLinesSync };
