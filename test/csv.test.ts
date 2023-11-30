import { read, readFileSync, unlinkSync, writeFileSync } from "fs";
import { CSV } from "../dist";
import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "crypto";

const headers = [
  "Index",
  "Organization Id",
  "Id",
  "Name",
  "Website",
  "Country",
  "Description",
  "Founded",
  "Industry",
  "Number of employees"
];

describe("CSV", () => {
  it("Correctly read a .csv file", () => {
    const csv100 = new CSV<(typeof headers)[number]>({
      path: "test/100-lines.csv"
    });
    expect(csv100.read().length).toEqual(100);

    const csv1000 = new CSV<(typeof headers)[number]>({
      path: "test/1000-lines.csv"
    });
    expect(csv1000.read().length).toEqual(1000);
  });

  it("Create a .csv file with only the headers", () => {
    const csv = new CSV({ path: "test/test1.csv", headers: ["name", "age"] });

    expect(csv.read()).toEqual([]);
  });

  it("Handle .csv files with no headers", () => {
    const csv = new CSV({
      path: "test/empty.csv",
      headers: ["will", "be", "inserted"]
    });

    expect(readFileSync("test/empty.csv", "utf-8")).toEqual("will,be,inserted");
  });

  it("Handle writing to a .csv file", () => {
    const csv = new CSV({ path: "test/write.csv", headers: ["name", "age"] });

    csv.write({ name: "John", age: 20 });

    expect(csv.read()).toEqual([{ name: "John", age: 20 }]);

    csv.write({ name: "Jane", age: 21 });

    expect(csv.read()).toEqual([
      { name: "John", age: 20 },
      { name: "Jane", age: 21 }
    ]);

    csv.write({ name: "John", age: 20 });

    expect(csv.read()).toEqual([
      { name: "John", age: 20 },
      { name: "Jane", age: 21 }
    ]);

    csv.write({ age: 35, name: "Nancy" });

    expect(csv.read()).toEqual([
      { name: "John", age: 20 },
      { name: "Jane", age: 21 },
      { name: "Nancy", age: 35 }
    ]);
  });

  it("clearing the .csv file", async () => {
    const csv = new CSV({ path: "test/clear.csv", headers: ["name", "age"] });

    for (let i = 0; i < 20; i++) {
      csv.write({ name: randomUUID(), age: Math.floor(Math.random() * 100) });
    }

    csv.clear();
    expect(csv.read()).toEqual([]);
  });

  it("Handle the find function", () => {
    const csv = new CSV({ path: "test/find.csv", headers: ["name", "age"] });

    csv.write({ name: "John", age: 20 });
    csv.write({ name: "Jane", age: 21 });
    csv.write({ name: "Nancy", age: 35 });

    expect(csv.find(o => o.name === "John")).toEqual({ name: "John", age: 20 });
    expect(csv.find(o => o.age === 21)).toEqual({ name: "Jane", age: 21 });
    expect(csv.find(o => o.name === "Nancy")).toEqual({
      name: "Nancy",
      age: 35
    });
    expect(csv.find(o => o.name === "Bob")).toEqual(undefined);
  });

  it("Handle the delete function", () => {
    const csv = new CSV({ path: "test/delete.csv", headers: ["name", "age"] });

    csv.write({ name: "John", age: 20 });
    csv.write({ name: "Jane", age: 21 });
    csv.write({ name: "Nancy", age: 35 });

    csv.delete(o => o.name === "John");
    expect(csv.read()).toEqual([
      { name: "Jane", age: 21 },
      { name: "Nancy", age: 35 }
    ]);

    csv.delete(o => o.age === 21);
    expect(csv.read()).toEqual([{ name: "Nancy", age: 35 }]);

    csv.delete(o => o.name === "Nancy");
    expect(csv.read()).toEqual([]);
  });

  it("Handle finding in very large .csv files", () => {
    const csv = new CSV<(typeof headers)[number]>({
      path: "test/large.csv",
      headers
    });
    expect(csv.find(o => o["Organization Id"] === "7D0AAbbCE3F2f4f")).toEqual({
      Index: 1455766,
      "Organization Id": "7D0AAbbCE3F2f4f",
      Id: "Abbott LLC",
      Name: "http://www.beck.org/",
      Website: "Swaziland",
      Country: "Mandatory well-modulated frame",
      Description: 2000,
      Founded: "Higher Education / Acadamia",
      Industry: 9320,
      "Number of employees": undefined
    });
  });

  it("Correctly stores data and bulkwrites it", () => {
    const csv = new CSV({ path: "test/store.csv", headers: ["name", "age"] });

    csv.store({ name: "John", age: 20 });
    expect(csv["stored"]).toEqual([{ name: "John", age: 20 }]);

    csv.store({ name: "Jane", age: 21 });
    expect(csv["stored"]).toEqual([
      { name: "John", age: 20 },
      { name: "Jane", age: 21 }
    ]);

    csv.store({ name: "Nancy", age: 35 });
    expect(csv["stored"]).toEqual([
      { name: "John", age: 20 },
      { name: "Jane", age: 21 },
      { name: "Nancy", age: 35 }
    ]);

    csv.bulkWrite();
  });

  it("Correctly writes data to the .csv file", () => {
    const csv = new CSV({ path: "test/store.csv", headers: ["name", "age"] });

    expect(csv.read()).toEqual([
      { name: "John", age: 20 },
      { name: "Jane", age: 21 },
      { name: "Nancy", age: 35 }
    ]);
  });

  it("Correctly bulk writes large amount of data", () => {
    const csv = new CSV({ path: "test/bulk.csv", headers: ["name", "age"] });

    for (let i = 0; i < 1000000; i++) {
      csv.store({ name: randomUUID(), age: Math.floor(Math.random() * 100) });
    }

    csv.bulkWrite();

    expect(csv.read().length).toEqual(1000000);
    expect(csv["stored"].length).toEqual(0);
  });

  it("Correctly converts csv to json", async () => {
    const csv = new CSV({ path: "test/json-test1.csv" });
    await csv.toJson("test/json-test1.json");

    let json = readFileSync("test/json-test1.json", "utf-8");

    expect(JSON.parse(json)).toEqual([
      { string: "Sera", bool: true, number: 42, null: null },
      { string: "aaa", bool: false, number: 4, null: null },
      { string: "bbb", bool: true, number: 4535, null: null },
      { string: "ccc", bool: true, number: 2e3, null: null },
      { string: "ddd", bool: false, number: 27.5, null: null }
    ]);

    const csv2 = new CSV({ path: "test/json-test2.csv" });
    await csv2.toJson("test/json-test2.json");
  });

  afterAll(() => {
    unlinkSync("test/test1.csv");
    unlinkSync("test/write.csv");
    unlinkSync("test/empty.csv");
    unlinkSync("test/clear.csv");
    unlinkSync("test/find.csv");
    unlinkSync("test/delete.csv");
    unlinkSync("test/store.csv");
    unlinkSync("test/bulk.csv");
    unlinkSync("test/json-test1.json");

    writeFileSync("test/empty.csv", "");
  });
});
