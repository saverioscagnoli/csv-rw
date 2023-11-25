import { existsSync, readFileSync, writeFileSync } from "fs";

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
  private storeItems: Entry<T>[];

  public constructor({ path, headers }: CSVOptions<T>) {
    this.path = path;
    this.headers = headers;
    this.storeItems = [];

    this.init();
  }

  private init(): void {
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
  public write(data: Entry<T> | Entry<T>[]): void {
    let r = Array.isArray(data) ? data : [data];
    let content = this.read();

    let entries = new Set(content.map(e => JSON.stringify(e)));
    let n = r.filter(row => !entries.has(JSON.stringify(row)));

    if (n.length > 0) {
      let lines = n.map(row => this.headers.map(h => row[h]).join(","));
      writeFileSync(this.path, "\n" + lines.join("\n"), { flag: "a" });
    }
  }

  /**
   * Function to find an entry in the CSV file based on a predicate function.
   * @param predicate A function that takes an entry and returns a boolean indicating whether the entry matches the condition.
   * @returns The first entry that satisfies the condition, or undefined if no such entry is found.
   */
  public find(predicate: (entry: Entry<T>) => boolean): Entry<T> | undefined {
    return this.read().find(predicate);
  }

  /**
   * Function to delete an entry in the CSV file based on a predicate function.
   * @param predicate A function that takes an entry and returns a boolean indicating whether the entry should be deleted.
   */
  public delete(predicate: (entry: Entry<T>) => boolean): void {
    let data = this.read();
    let index = data.findIndex(predicate);

    if (index !== -1) {
      data.splice(index, 1);
      this.clear();
      this.write(data);
    }
  }

  /**
   * Function to clear the CSV file.
   */
  public clear(): void {
    writeFileSync(this.path, this.headers.join(","));
  }

  /**
   * Function to store data inside the object, for later writing.
   * @see CSV.bulkWrite
   * @param data Data to be stored in the CSV file.
   */
  public store(...data: Entry<T>[]): void {
    this.storeItems.push(...data);
  }

  /**
   * Function to write the stored data to the CSV file.
   * @param reset Whether to reset the stored data after writing.
   */
  public bulkWrite(reset: boolean = true): void {
    this.write(this.storeItems);
    if (reset) this.storeItems = [];
  }
}

export { CSV, type CSVOptions };
