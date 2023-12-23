import { describe, test, expect, afterAll } from "vitest";
import { readLines, readLinesSync } from "../../src/lib";
import { CSV } from "../../src";
import { randomUUID } from "crypto";
import { unlinkSync } from "fs";

describe("util functions", () => {
  test(
    "read-lines",
    async () => {
      const csv = new CSV({
        path: "test/utils/read-lines.csv",
        headers: ["id", "name", "age", "email", "phone"]
      });

      let entries = Array.from({ length: 1000 }, () => ({
        id: randomUUID(),
        name: randomUUID(),
        age: Math.floor(Math.random() * 100),
        email: randomUUID(),
        phone: randomUUID()
      }));

      await readLines(csv.getPath(), (line, i) => {
        if (i === 0) {
          expect(line).toEqual(csv.getHeaders().join(","));
        } else {
          expect(line).toEqual(Object.values(entries[i]).join(","));
        }
      });
    },
    { timeout: 0 }
  );

  test("read-lines-sync", () => {
    const csv = new CSV({
      path: "test/utils/read-lines-sync.csv",
      headers: ["id", "name", "age", "email", "phone"]
    });

    let entries = Array.from({ length: 1000 }, () => ({
      id: randomUUID(),
      name: randomUUID(),
      age: Math.floor(Math.random() * 100),
      email: randomUUID(),
      phone: randomUUID()
    }));

    readLinesSync(csv.getPath(), (line, i) => {
      if (i === 0) {
        expect(line).toEqual(csv.getHeaders().join(","));
      } else {
        expect(line).toEqual(Object.values(entries[i]).join(","));
      }
    });
  });

  afterAll(() => {
    unlinkSync("test/utils/read-lines.csv");
    unlinkSync("test/utils/read-lines-sync.csv");
  });
});
