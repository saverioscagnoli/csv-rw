import {
  existsSync,
  readFileSync,
  writeFileSync,
  createReadStream,
  createWriteStream,
  unlinkSync
} from "fs";

interface CSVOptions<T extends string> {
  /**
   * Path to the CSV file, if the file doesn't exist it will be created.
   */
  path: string;

  /**
   * Headers of the CSV file.
   */
  headers?: T[];

  /**
   * If the path to the CSV file already exists, whether to delete it and create a new one.
   */
  deletePrevious?: boolean;

  /**
   * Delimiter of the CSV file.
   * @default ","
   */
  delimiter?: string;
}

type Value = string | number | boolean | null;

type Entry<T extends string> = Record<T, Value>;

/**
 * Represents a CSV file.
 * @template T The type of the headers in the CSV file.
 */
class CSV<T extends string> {
  private path: string;
  private headers: T[];
  private delimiter: string;
  private stored: Entry<T>[];

  public constructor({
    path,
    headers = [],
    deletePrevious = false,
    delimiter = ","
  }: CSVOptions<T>) {
    this.path = path;
    this.headers = headers;
    this.stored = [];
    this.delimiter = delimiter;

    if (deletePrevious && existsSync(this.path)) {
      unlinkSync(this.path);
    }

    this.init();
  }

  private init(): void {
    if (!existsSync(this.path) || readFileSync(this.path).length === 0) {
      writeFileSync(this.path, this.headers.join(this.delimiter));
    }
  }

  /**
   * Function to read the CSV file.
   * @returns A promise with an array of objects, each object represents a row in the CSV file.
   */
  public read(): Promise<Entry<T>[]> {
    let reader = createReadStream(this.path, "utf-8");
    let data: Entry<T>[] = [];

    return new Promise((res, rej) => {
      reader.on("data", chunk => {
        let lines = chunk.toString().split("\n");
        let l = lines.length;

        for (let i = 1; i < l; i++) {
          let line = lines[i].trim();
          data.push(this.parseLine(line));
        }
      });

      reader.on("end", () => res(data));
      reader.on("error", rej);
    });
  }

  /**
   * Function to parse a single line in the CSV file.
   * @param line the raw string
   * @returns A parsed Entry.
   */
  private parseLine(line: string): Entry<T> {
    return line.split(this.delimiter).reduce((acc, curr, i) => {
      acc[this.headers[i]] = curr;
      return acc;
    }, {} as Entry<T>);
  }

  /**
   * Function to write to the CSV file.
   * @param entries The single entry or array of entries to write to the CSV file.
   */
  public write(entries: Entry<T> | Entry<T>[]): Promise<void> {
    let writer = createWriteStream(this.path, { flags: "a" });

    return new Promise((res, rej) => {
      writer.on("ready", () => {
        if (!Array.isArray(entries)) entries = [entries];

        let l = entries.length;

        for (let i = 0; i < l; i++) {
          let entry = entries[i];
          let values = Object.values(entry);
          writer.write("\n" + values.join(this.delimiter));
        }

        writer.end();
      });

      writer.on("finish", res);
      writer.on("error", rej);
    });
  }
}

export { CSV, type CSVOptions };
