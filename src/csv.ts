import fs from "fs";
import split2 from "split2";
import { parser } from "./parser";
import { Entry } from "./types";
import { readLinesSync } from "./lib";

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

    this.init(opts.deletePrevious ?? false);
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
  private init(deletePrevious: boolean): void {
    let headers = this.getHeaders();
    if (!fs.existsSync(this.path)) {
      fs.writeFileSync(this.path, headers.join(this.delimiter));
    } else {
      if (deletePrevious) {
        fs.unlinkSync(this.path);
        fs.writeFileSync(this.path, headers.join(this.delimiter));
      }

      if (this.getHeaders().length === 0) {
        readLinesSync(
          this.path,
          line => {
            this.headers = line.split(this.delimiter) as T[];
          },
          1
        );
      }
    }
  }

  /**
   * Function to get the headers of the csv file.
   */
  public getHeaders(): T[] {
    return this.headers;
  }

  /**
   * Function to get the path of the csv file.
   */
  public getPath(): string {
    return this.path;
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
          headers: this.getHeaders()
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
  public async write(entries: Entry<T>[] | Entry<T>): Promise<void> {
    if (!Array.isArray(entries)) entries = [entries];
    let writer = fs.createWriteStream(this.path, { flags: "a" });
    let arr = entries as Entry<T>[];

    return new Promise((res, rej) => {
      let l = arr.length;

      for (let i = 0; i < l; i++) {
        let entry = arr[i];
        let values = parser
          .getRowValuesFromHeaders(this.getHeaders(), entry)
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
  public store(entries: Entry<T>[] | Entry<T>): void {
    if (!Array.isArray(entries)) entries = [entries];
    this.stored.push(...entries);
  }

  /**
   * Function to flush the stored entries to the CSV file.
   */
  public async flush() {
    await this.write(this.stored);
    this.stored = [];
  }

  /**
   * Function to clear the CSV file.
   */
  public async clear(): Promise<void> {
    return new Promise((res, rej) => {
      fs.writeFile(this.path, this.getHeaders().join(this.delimiter), err => {
        if (err) rej(err);
        else res();
      });
    });
  }

  /**
   * Function to find an entry in the CSV file.
   * @param fn find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, find immediately returns that element value. Otherwise, find returns undefined.
   * @returns A promise with the found entry or undefined if not found.
   * @see Array.prototype.find
   */
  public async find(
    fn: (x: Entry<T>, i: number, obj: Entry<T>[]) => boolean
  ): Promise<Entry<T> | undefined> {
    let entries = await this.read();
    return entries.find(fn);
  }

  /**
   * Function to filter entries in the CSV file based on a predicate.
   * @param fn  A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @returns A promise with an array of the found entries.
   * @see Array.prototype.filter
   */
  public async filter(
    fn: (x: Entry<T>, i: number, obj: Entry<T>[]) => boolean
  ) {
    let entries = await this.read();
    return entries.filter(fn);
  }

  /**
   * Function to sort the entries in the csv file based on a predicate.
   * @param fn Function used to determine the order of the elements. It is expected to return a negative value if the first argument is less than the second argument, zero if they're equal, and a positive value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
   * @param write A flag that determines whether to rewrite the CSV file with the sorted entries.
   * @returns A promise with an array of the sorted entries.
   * @see Array.prototype.sort
   */
  public async sort(fn: (a: Entry<T>, b: Entry<T>) => number, write?: boolean) {
    let entries = await this.read();
    entries.sort(fn);

    if (write) await this.write(entries);
    return entries;
  }

  /**
   * Function to map the entries in the CSV file based on a predicate.
   * @see Array.prototype.map
   * @param fn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
   * @returns A promise with an array of the mapped entries.
   */
  public async map<U>(
    fn: (x: Entry<T>, i: number, obj: Entry<T>[]) => U
  ): Promise<U[]> {
    let entries = await this.read();
    return entries.map(fn);
  }

  /**
   * Function do delete an entry from the CSV file.
   * @param indexOrFn The index of the entry to delete or a function that returns true if the entry should be deleted.
   */
  public async delete(
    indexOrFn: ((x: Entry<T>, i: number, obj: Entry<T>[]) => boolean) | number
  ) {
    let entries = await this.read();
    let index = indexOrFn as number;

    if (typeof indexOrFn === "function") {
      index = entries.findIndex(indexOrFn);
    }

    if (index === -1) return;

    entries.splice(index, 1);

    await this.clear();
    await this.write(entries);
  }

  public async deleteAll(
    indexesOrFn?:
      | ((x: Entry<T>, i: number, obj: Entry<T>[]) => boolean)
      | number[]
  ) {
    let entries = await this.read();
    let indexes = indexesOrFn as number[];

    if (typeof indexesOrFn === "function") {
      indexes = entries.map((e, i) => (indexesOrFn as Function)(e, i, entries));
    }

    if (indexes.length === 0) return;

    let l = indexes.length;
    let deleted = 0;

    for (let i = 0; i < l; i++) {
      let index = indexes[i] - deleted;
      entries.splice(index, 1);
      deleted++;
    }

    await this.clear();
    await this.write(entries);
  }

  /**
   * Function that returns a new CSV object from a JSON string / file.
   * @param pathOrJson Path to the JSON file or the JSON string.
   * @param output Path to the CSV file to write to.
   */
  public static async fromJson<T extends string>(json: string, output: string) {
    let data = JSON.parse(json);
    let headers = Object.keys(data[0]);

    let csv = new CSV({ path: output, headers: headers as T[] });
    await csv.write(data);

    return csv;
  }

  /**
   * Converts the CSV file to a JSON file.
   * @param output Path to the JSON file to write to.
   */
  public toJson(output: string): Promise<void> {
    return new Promise(async (res, rej) => {
      let reader = fs.createReadStream(this.path, "utf-8");
      let writer = fs.createWriteStream(output);
      let lp = (await this.read()).length;

      let h: string[] = [];
      let f = true;

      writer.write("[");

      reader.pipe(split2()).on("data", (line: string) => {
        let obj: { [key: string]: unknown } = {};
        let data = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        if (f) {
          h = data;
          f = false;
        } else {
          let l = h.length;

          for (let i = 0; i < l; i++) {
            let v = data[i];

            obj[h[i]] = parser.parseValue(v);
          }

          writer.write(JSON.stringify(obj));

          if (lp > 1) writer.write(",\n");
          lp--;
        }
      });

      reader.on("error", rej);
      reader.on("close", () => {
        writer.write("]");
        writer.close();
        res();
      });
    });
  }
}

const csv = new CSV({
  path: "test/sasa.csv"
});

export { CSV };
