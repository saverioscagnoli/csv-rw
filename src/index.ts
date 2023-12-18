import {
  existsSync,
  readFileSync,
  writeFileSync,
  createReadStream,
  createWriteStream,
  unlinkSync,
  writeFile
} from "fs";
import split2 from "split2";

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

  /**
   * Function to initialize the CSV file.
   * @private this function is called in the constructor.
   * Creates the CSV file if it doesn't exist and writes the headers to it.
   */
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
      let first = true;

      reader.pipe(split2()).on("data", line => {
        let entry = {} as Entry<T>;
        line = line.split(this.delimiter);

        if (first) {
          first = false;
          return;
        }

        for (let i = 0; i < this.headers.length; i++) {
          let k = this.headers[i];
          let v: Value = line[i];

          if (!isNaN(+v!)) v = +v!;
          else if (v === "true" || v === "false") v = v === "true";
          else if (v === "null") v = null;

          entry[k] = v;
        }

        data.push(entry);
      });

      reader.on("close", () => res(data));
      reader.on("error", rej);
    });
  }

  /**
   * Function to write to the CSV file.
   * @param entries The single entry or array of entries to write to the CSV file.
   */
  public write(entries: Entry<T> | Entry<T>[]): Promise<void> {
    let writer = createWriteStream(this.path, { flags: "a" });

    return new Promise((res, rej) => {
      if (!Array.isArray(entries)) entries = [entries];

      let l = entries.length;

      for (let i = 0; i < l; i++) {
        let entry = entries[i];
        let values = Object.values(entry);
        writer.write("\n" + values.join(this.delimiter));
      }

      writer.close();

      writer.on("close", res);
      writer.on("error", rej);
    });
  }

  /**
   * Function to asynchronously clear the CSV file.
   */
  public clear(): Promise<void> {
    return new Promise((res, rej) => {
      writeFile(this.path, this.headers.join(this.delimiter), err => {
        if (err) rej(err);
        else res();
      });
    });
  }

  /**
   * Function to synchronously clear the CSV file.
   */
  public clearSync(): void {
    writeFileSync(this.path, this.headers.join(this.delimiter));
  }

  /**
   * Function to sore entries inside the CSV object.
   * @param entries The single entry or array of entries to store.
   */
  public store(entries: Entry<T> | Entry<T>[]): void {
    if (!Array.isArray(entries)) entries = [entries];

    this.stored.push(...entries);
  }

  /**
   * Function to bulk write the stored entries.
   */
  public bulkWrite(): Promise<void> {
    return this.write(this.stored);
  }

  /**
   * Function to find an entry in the CSV file.
   * @param fn find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, find immediately returns that element value. Otherwise, find returns undefined.
   * @returns A promise with the found entry or undefined if not found.
   * @see Array.prototype.find
   */
  public find(
    fn: (x: Entry<T>, i: number, obj: Entry<T>[]) => boolean
  ): Promise<Entry<T> | undefined> {
    return new Promise(async (res, rej) => {
      try {
        let data = await this.read();
        let entry = data.find(fn);
        res(entry);
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Function to find all entries in the CSV file based on a predicate.
   * @param fn  A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @returns A promise with an array of the found entries.
   * @see Array.prototype.filter
   */
  public findAll(
    fn: (x: Entry<T>, i: number, obj: Entry<T>[]) => boolean
  ): Promise<Entry<T>[]> {
    return new Promise(async (res, rej) => {
      try {
        let data = await this.read();
        let entries = data.filter(fn);
        res(entries);
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Function to sort the entries in the csv file based on a predicate.
   * @param fn Function used to determine the order of the elements. It is expected to return a negative value if the first argument is less than the second argument, zero if they're equal, and a positive value otherwise. If omitted, the elements are sorted in ascending, ASCII character order.
   * @param write A flag that determines whether to rewrite the CSV file with the sorted entries.
   * @returns A promise with an array of the sorted entries.
   * @see Array.prototype.sort
   */
  public sort(
    fn: (a: Entry<T>, b: Entry<T>) => number,
    write?: boolean
  ): Promise<Entry<T>[]> {
    return new Promise(async (res, rej) => {
      try {
        let data = await this.read();
        let entries = data.sort(fn);
        if (write) {
          await this.clear();
          await this.write(entries);
        }
        res(entries);
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   * Function to delete an entry in the CSV file.
   * @param fn find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, find immediately returns that element value. Otherwise, find returns undefined.
   * @returns A promise with a boolean indicating whether the entry was deleted or not.
   */
  public delete(
    fn: (x: Entry<T>, i: number, obj: Entry<T>[]) => boolean
  ): Promise<boolean> {
    return new Promise(async (res, rej) => {
      try {
        let data = await this.read();
        let entry = data.find(fn);

        if (!entry) {
          res(false);
          return;
        }

        let index = data.indexOf(entry);
        data.splice(index, 1);

        await this.clear();
        await this.write(data);
        res(true);
      } catch (err) {
        rej(err);
      }
    });
  }

  /**
   *
   * @param fn A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @returns A promise with the number of deleted entries.
   */
  public deleteAll(
    fn: (x: Entry<T>, i: number, obj: Entry<T>[]) => boolean
  ): Promise<number> {
    return new Promise(async (res, rej) => {
      try {
        let data = await this.read();
        let entries = data.filter(fn);

        if (entries.length === 0) {
          res(0);
          return;
        }

        entries.forEach(entry => {
          let index = data.indexOf(entry);
          data.splice(index, 1);
        });

        await this.clear();
        await this.write(data);
        res(entries.length);
      } catch (err) {
        rej(err);
      }
    });
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

  public toJson(output: string): Promise<void> {
    return new Promise(async (res, rej) => {
      let reader = createReadStream(this.path, "utf-8");
      let writer = createWriteStream(output);
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
            let v: Value = data[i];

            if (v.startsWith("'") && v.endsWith("'")) {
              v = v.slice(1, -1);
            }

            if (!isNaN(+v)) v = +v;
            else if (v === "true" || v === "false") v = v === "true";
            else if (v === "null") v = null;

            obj[h[i]] = v;
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

export { CSV, type CSVOptions };
