import { existsSync, read, readFileSync, unlinkSync, writeFileSync } from "fs";
import { CSV } from "../dist";
import { afterAll, describe, expect, test } from "vitest";
import { randomUUID } from "crypto";

describe("CSV", () => {
  test("constructor", () => {
    const csv = new CSV({
      path: "test/constructor.csv",
      headers: ["id", "name", "age"],
      deletePrevious: true
    });

    expect(csv["path"]).toBe("test/constructor.csv");
    expect(csv["headers"]).toEqual(["id", "name", "age"]);
    expect(csv["delimiter"]).toBe(",");

    expect(existsSync("test/constructor.csv")).toBe(true);
  });

  test("write", async () => {
    const csv = new CSV({
      path: "test/write.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    await csv.write(entries);
    expect(existsSync("test/write.csv")).toBe(true);
    expect(readFileSync("test/write.csv").toString().split("\n").length).toBe(
      11
    );
  });

  test(
    "write large files",
    async () => {
      const csv = new CSV({
        path: "test/large-write.csv",
        headers: ["id", "name", "age", "email", "phone"]
      });

      let entries = Array.from({ length: 1000000 }, () => ({
        id: randomUUID(),
        name: randomUUID(),
        age: Math.floor(Math.random() * 100),
        email: randomUUID(),
        phone: randomUUID()
      }));

      await csv.write(entries);

      expect(await csv.read()).toEqual(entries);
    },
    { timeout: 0 }
  );

  test("read", async () => {
    const csv = new CSV({
      path: "test/read.csv",
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

  test("read empty", async () => {
    const csv = new CSV({
      path: "test/read-empty.csv",
      headers: ["id", "name", "age"]
    });

    let data = await csv.read();
    expect(data).toEqual([]);
  });

  test("clear", async () => {
    const csv = new CSV({
      path: "test/clear.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    await csv.write(entries);
    await csv.clear();

    expect(readFileSync("test/clear.csv").toString()).toBe("id,name,age");
    expect(await csv.read()).toEqual([]);
  });

  test("clear sync", async () => {
    const csv = new CSV({
      path: "test/clear-sync.csv",
      headers: ["id", "name", "age"]
    });

    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    await csv.write(entries);
    csv.clearSync();

    expect(readFileSync("test/clear-sync.csv").toString()).toBe("id,name,age");
    expect(await csv.read()).toEqual([]);
  });

  test("find", async () => {
    const csv = new CSV({
      path: "test/find.csv",
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
      path: "test/find-all.csv",
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

    await csv.bulkWrite();

    let entriesFound = await csv.findAll(x => x.age === 200);

    expect(entriesFound).toBeDefined();
    expect(entriesFound).toEqual([entry1, entry2]);
  });

  test("sort", async () => {
    const csv = new CSV({
      path: "test/sort.csv",
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
      path: "test/delete.csv",
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
      path: "test/delete-all.csv",
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

    await csv.bulkWrite();

    await csv.deleteAll(x => x.age === 200);

    expect(await csv.findAll(x => x.age === 200)).toEqual([]);
  });

  test("create csv from json", async () => {
    let entries = Array.from({ length: 10000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100)
    }));

    const csv = await CSV.fromJson(
      JSON.stringify(entries),
      "test/from-json.csv"
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
      path: "test/to-json.csv",
      headers: ["id", "name", "age"]
    });

    await csv.write(entries);

    await csv.toJson("test/to-json.json");

    expect(await csv.read()).toEqual(entries);
  });

  afterAll(() => {
    writeFileSync("test/constructor.csv", "");
    unlinkSync("test/write.csv");
    unlinkSync("test/read.csv");
    unlinkSync("test/large-write.csv");
    unlinkSync("test/read-empty.csv");
    unlinkSync("test/clear.csv");
    unlinkSync("test/clear-sync.csv");
    unlinkSync("test/find.csv");
    unlinkSync("test/find-all.csv");
    unlinkSync("test/sort.csv");
    unlinkSync("test/delete.csv");
    unlinkSync("test/delete-all.csv");
    unlinkSync("test/from-json.csv");
    unlinkSync("test/to-json.csv");
    unlinkSync("test/to-json.json");
  });
});
