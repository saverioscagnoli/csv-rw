import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { CSV } from "../dist";
import { afterAll, describe, expect, it } from "vitest";

describe("CSV", () => {
  it("Correctly read a .csv file", () => {
    const headers = [
      "Index",
      "Organization",
      "Id",
      "Name",
      "Website",
      "Country",
      "Description",
      "Founded",
      "Industry",
      "Number of employees"
    ];

    const csv100 = new CSV({ path: "test/100-lines.csv", headers });
    expect(csv100.read().length).toEqual(100);

    const csv1000 = new CSV({ path: "test/1000-lines.csv", headers });
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

  afterAll(() => {
    unlinkSync("test/test1.csv");
    unlinkSync("test/write.csv");
    unlinkSync("test/empty.csv");

    writeFileSync("test/empty.csv", "");
  });
});
