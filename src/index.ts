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

type Entry<T extends string> = Record<T, Value>;

class CSV<T extends string> {
  private path: string;
  private headers: T[];

  public constructor({ path, headers }: CSVOptions<T>) {
    this.path = path;
    this.headers = headers;

    this.init();
  }

  private init() {
    if (!existsSync(this.path) || readFileSync(this.path).length === 0) {
      writeFileSync(this.path, this.headers.join(","));
    }
  }

  /**
   * Function to read the CSV file.
   * @returns An array of objects, each object represents a row in the CSV file.
   */
  public read(): Entry<T>[] {
    let lines = readFileSync(this.path, "utf-8").split("\n");
    let data: Entry<T>[] = [];

    for (let i = 1; i < lines.length; i++) {
      let entry = {} as Entry<T>;
      let line = lines[i].split(",");

      for (let j = 0; j < this.headers.length; j++) {
        let key = this.headers[j];
        let value: Value = line[j];

        if (!isNaN(+value)) value = +value;
        if (value === "true" || value === "false") value = value === "true";

        entry[key] = value;
      }

      data.push(entry);
    }

    return data;
  }

  /**
   * Function to write to the CSV file.
   * @param data Data to be written to the CSV file.
   */
  public write(data: Entry<T> | Entry<T>[]) {
    let rows = Array.isArray(data) ? data : [data];
    let content = this.read();

    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      let line = this.headers.map(o => row[o]).join(",");

      if (!content.some(o => isDeepStrictEqual(o, row))) {
        writeFileSync(this.path, "\n" + line, { flag: "a" });
      }
    }
  }
}

export { CSV, type CSVOptions };
