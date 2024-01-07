import { existsSync, read, readFileSync, unlinkSync, writeFileSync } from "fs";
import { CSV } from "../../dist";
import { afterAll, describe, expect, test } from "vitest";
import { randomUUID } from "crypto";

const rng = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]) => arr[rng(0, arr.length - 1)];

describe("CSV", () => {
  test("constructor", () => {
    const csv = new CSV({
      path: "test/csv/constructor.csv",
      headers: ["id", "name", "age"],
      deletePrevious: true
    });

    expect(csv["path"]).toBe("test/csv/constructor.csv");
    expect(csv["headers"]).toEqual(["id", "name", "age"]);
    expect(csv["delimiter"]).toBe(",");

    expect(existsSync("test/csv/constructor.csv")).toBe(true);
  });

  test("write", async () => {
    const csv = new CSV({
      path: "test/csv/write.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    await csv.write(entries);
    expect(existsSync("test/csv/write.csv")).toBe(true);
    expect(
      readFileSync("test/csv/write.csv").toString().split("\n").length
    ).toBe(11);
  });

  let largeEntries = Array.from({ length: 1000000 }, () => ({
    id: randomUUID(),
    name: randomUUID(),
    age: Math.floor(Math.random() * 100),
    email: randomUUID(),
    phone: randomUUID()
  }));

  test(
    "write large files",
    async () => {
      const csv = new CSV({
        path: "test/csv/large-write.csv",
        headers: ["id", "name", "age", "email", "phone"]
      });

      await csv.write(largeEntries);

      expect(await csv.read()).toEqual(largeEntries);
    },
    { timeout: 0 }
  );

  let entriesWithDelimiter = Array.from({ length: 10 }, () => ({
    id: ["a", "1", "g", ",", "d", "$", "&"]
      .map((_, __, arr) => pick(arr))
      .join(""),
    name: ["a", "1", "g", ",", "d", "$", "&"]
      .map((_, __, arr) => pick(arr))
      .join(""),
    age: Math.floor(Math.random() * 100)
  }));

  test("write delimiter", async () => {
    const csv = new CSV({
      path: "test/csv/write-delimiter.csv",
      headers: ["id", "name", "age"]
    });

    await csv.write(entriesWithDelimiter);
    expect(
      readFileSync("test/csv/write-delimiter.csv").toString().split("\n").length
    ).toBe(11);
  });

  test("read", async () => {
    const csv = new CSV({
      path: "test/csv/read.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    await csv.write(entries);

    let data = await csv.read();
    expect(data).toEqual(entries);
  });

  test("read large file", async () => {
    const csv = new CSV({
      path: "test/csv/large-write.csv",
      headers: ["id", "name", "age", "email", "phone"]
    });

    let data = await csv.read();
    expect(data).toEqual(largeEntries);
  });

  test("read delimiter", async () => {
    const csv = new CSV({
      path: "test/csv/write-delimiter.csv",
      headers: ["id", "name", "age"]
    });

    let data = await csv.read();
    expect(data).toEqual(entriesWithDelimiter);
  });

  test("read empty", async () => {
    const csv = new CSV({
      path: "test/csv/read-empty.csv",
      headers: ["id", "name", "age"]
    });

    let data = await csv.read();
    expect(data).toEqual([]);
  });

  test("clear", async () => {
    const csv = new CSV({
      path: "test/csv/clear.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    await csv.write(entries);
    await csv.clear();

    expect(readFileSync("test/csv/clear.csv").toString()).toBe("id,name,age");
    expect(await csv.read()).toEqual([]);
  });

  test("find", async () => {
    const csv = new CSV({
      path: "test/csv/find.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    let toFind = entries[Math.floor(Math.random() * entries.length)].id;

    await csv.write(entries);

    let entry = await csv.find(x => x.id === toFind);
    expect(entry).toBeDefined();
    expect(entry?.id).toBe(toFind);
  });

  test("find-all", async () => {
    const csv = new CSV({
      path: "test/csv/find-all.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    let entry1 = { id: randomUUID(), name: randomUUID(), age: 200 };
    let entry2 = { id: randomUUID(), name: randomUUID(), age: 200 };

    csv.store(entries.slice(0, 3789));
    csv.store(entry1);
    csv.store(entries.slice(3789, 4500));
    csv.store(entry2);
    csv.store(entries.slice(4500));

    await csv.flush();

    let entriesFound = await csv.filter(x => x.age === 200);

    expect(entriesFound).toBeDefined();
    expect(entriesFound).toEqual([entry1, entry2]);
  });

  test("sort", async () => {
    const csv = new CSV({
      path: "test/csv/sort.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    await csv.write(entries);

    let sorted = entries.sort((a, b) => a.age - b.age);

    expect(await csv.sort((a, b) => +a.age! - +b.age!)).toEqual(sorted);
  });

  test("delete", async () => {
    const csv = new CSV({
      path: "test/csv/delete.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    let toDelete = entries[Math.floor(Math.random() * entries.length)].id;

    await csv.write(entries);
    await csv.delete(x => x.id === toDelete);

    expect(await csv.find(x => x.id === toDelete)).toBeUndefined();
  });

  test("delete all", async () => {
    const csv = new CSV({
      path: "test/csv/delete-all.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    let entry1 = { id: randomUUID(), name: randomUUID(), age: 200 };
    let entry2 = { id: randomUUID(), name: randomUUID(), age: 200 };

    csv.store(entries.slice(0, 3412));
    csv.store(entry1);
    csv.store(entries.slice(3412, 3463));
    csv.store(entry2);
    csv.store(entries.slice(3463));

    await csv.flush();

    await csv.deleteAll(x => x.age === 200);

    expect(await csv.filter(x => x.age === 200)).toEqual([]);
  });

  test("create csv from json", async () => {
    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    const csv = await CSV.fromJson(
      JSON.stringify(entries),
      "test/csv/from-json.csv"
    );

    expect(await csv.read()).toEqual(entries);
  });

  test("to json", async () => {
    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    const csv = new CSV({
      path: "test/csv/to-json.csv",
      headers: ["id", "name", "age"]
    });

    await csv.write(entries);

    await csv.toJson("test/csv/to-json.json");

    expect(await csv.read()).toEqual(entries);
  });

  afterAll(() => {
    writeFileSync("test/csv/constructor.csv", "");
    unlinkSync("test/csv/write.csv");
    unlinkSync("test/csv/read.csv");
    unlinkSync("test/csv/large-write.csv");
    unlinkSync("test/csv/write-delimiter.csv");
    unlinkSync("test/csv/read-empty.csv");
    unlinkSync("test/csv/clear.csv");
    unlinkSync("test/csv/find.csv");
    unlinkSync("test/csv/find-all.csv");
    unlinkSync("test/csv/sort.csv");
    unlinkSync("test/csv/delete.csv");
    unlinkSync("test/csv/delete-all.csv");
    unlinkSync("test/csv/from-json.csv");
    unlinkSync("test/csv/to-json.csv");
    unlinkSync("test/csv/to-json.json");
  });
});
