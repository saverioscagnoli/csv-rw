import { existsSync, readFileSync, writeFileSync } from "fs";
import { isDeepStrictEqual } from "util";

interface CSVOptions<T extends string> {
  /**
   * Path to the CSV file, if the file doesn't exist it will be created.
   */
  path: string;

  /**
   * Headers of the CSV file.
   */
  headers: T[];
}

type Value = string | number | boolean;

type ExtractValueType<T extends string> = T extends `b:${string}`
  ? boolean
  : T extends `n:${string}`
  ? number
  : T extends `s:${string}`
  ? string
  : Value;

type RemovePrefix<T> = T extends `${infer _}:${infer Rest}` ? Rest : T;

type Entry<T extends string> = {
  [K in T as RemovePrefix<K>]: ExtractValueType<K>;
};

class CSV<T extends string> {
  private path: string;
  private headers: T[];

  public constructor({ path, headers }: CSVOptions<T>) {
    this.path = path;
    this.headers = headers;

    this.init();
  }

  private init() {
    if (!existsSync(this.path)) {
      writeFileSync(this.path, this.headers.join(","));
    }
  }

  public read(): Entry<T>[] {
    let lines = readFileSync(this.path, "utf-8").split("\n");
    let headers = lines[0]?.split(",");
    let data: Entry<T>[] = [];

    for (let i = 1; i < lines.length; i++) {
      let values = lines[i]?.split(",");
      let entry = {} as Entry<T>;

      headers?.forEach((h, i) => {
        let k = h as RemovePrefix<T>;
        entry[k] = values?.[i] as Entry<T>[RemovePrefix<T>];
      });
      data.push(entry);
    }

    return data;
  }

  public write(data: Entry<T> | Entry<T>[]) {
    let rows = Array.isArray(data) ? data : [data];
    let content = this.read();

    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      let line = this.headers.map(o => row?.[o as RemovePrefix<T>]).join(",");

      if (content.every(o => !isDeepStrictEqual(o, row))) {
        writeFileSync(this.path, "\n" + line, { flag: "a" });
      }
    }
  }
}

export { CSV, type CSVOptions };
