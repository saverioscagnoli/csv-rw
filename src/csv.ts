import fs from "fs";
import split2 from "split2";
import { parser } from "./parser";
import { Entry } from "./types";

interface CSVOptions<T extends string> {
  /**
   * The path to the CSV file.
   */
  path: string;

  /**
   * The delimiter to use when parsing the CSV file.
   */
  delimiter?: string;

  /**
   * The headers to use when parsing the CSV file.
   */
  headers?: T[];

  /**
   * If the path already exists, delete it before instantiating.
   */
  deletePrevious?: boolean;
}

class CSV<T extends string> {
  private path: string;
  private delimiter: string;
  private headers: T[];
  private stored: Entry<T>[];

  public constructor(opts: CSVOptions<T>) {
    this.path = opts.path;
    this.delimiter = opts.delimiter ?? ",";
    this.headers = this.stripHeaders(opts.headers ?? []);
    this.stored = [];

    this.init();
  }

  /**
   * Function to strip the headers of any prefixes or suffixes used for typing.
   * @param headers The array of headers to use when parsing the CSV file.
   * @private
   */
  private stripHeaders(headers: T[]): T[] {
    if (!headers || headers.length === 0) return [];

    let stripped = headers
      .map(h => h.replace(/^(n|b|s):|\?$/g, ""))
      .map(h => h.trim()) as T[];

    let l = stripped.length;

    for (let i = 0; i < l; i++) {
      let h = stripped[i];
      let match = h.match(/[^0-9a-z]/i);

      if (match) {
        throw new Error(
          `Invalid header: "${h}". Header must be alphanumeric. Found invalid charater "${match[0]}".`
        );
      }
    }

    return stripped;
  }

  /**
   * Function to initialize the CSV file.
   * It will create the file if it doesn't exist, and write the headers to it.
   * @private
   */
  private init(): void {
    if (!fs.existsSync(this.path)) {
      fs.writeFileSync(this.path, this.headers.join(this.delimiter));
    }
  }

  /**
   * Function to asynchronously read the CSV file.
   * @returns A promise that resolves to an array of entries.
   */
  public async read(): Promise<Entry<T>[]> {
    let reader = fs.createReadStream(this.path, "utf-8");

    return new Promise((res, rej) => {
      let entries: Entry<T>[] = [];
      let isHeaders = true;

      reader.pipe(split2()).on("data", (line: string) => {
        // Skip the headers.
        if (isHeaders) {
          isHeaders = false;
          return;
        }

        // Parse the row.
        let row = parser.parseRow(line, {
          delimiter: this.delimiter,
          headers: this.headers
        });

        // Push the row to the entries array.
        entries.push(row as Entry<T>);
      });

      reader.on("close", () => res(entries));
      reader.on("error", err => rej(err));
    });
  }

  /**
   * Function to asynchronously write to the CSV file.
   * @param entries The entries to write to the CSV file.
   * @returns A promise that resolves when the write is complete.
   */
  public async write(entries: Entry<T>[]): Promise<void> {
    let writer = fs.createWriteStream(this.path, { flags: "a" });

    return new Promise((res, rej) => {
      let l = entries.length;

      for (let i = 0; i < l; i++) {
        let entry = entries[i];
        let values = parser
          .getRowValuesFromHeaders(this.headers, entry)
          .map(v => v ?? "null");

        writer.write("\n" + values.join(this.delimiter));
      }

      writer.close();

      writer.on("close", () => res());
      writer.on("error", err => rej(err));
    });
  }

  /**
   * Function to store entries in memory.
   * @param entries The entries to store in memory.
   */
  public store(entries: Entry<T>[]): void {
    this.stored.push(...entries);
  }

  /**
   * Function to flush the stored entries to the CSV file.
   */
  public async flush() {
    await this.write(this.stored);
    this.stored = [];
  }
}

const csv = new CSV({
  path: "data.csv",
  headers: ["name", "n:age", "b:isAlive?"]
});

export { CSV };
