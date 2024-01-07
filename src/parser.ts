import { Value } from "./types";

interface ParseOptions {
  delimiter?: string;
}

function parseValue(v: string): Value {
  v = v.toLowerCase().trim();

  if (v === "null" || v === "") {
    return null;
  }

  if (v === "true" || v === "false") {
    return v === "true";
  }

  if (!isNaN(+v)) {
    return +v;
  }

  return v;
}

function parseHeaders(line: string, opts: ParseOptions = {}): string[] {
  const delimiter = opts.delimiter ?? ",";
  return line.split(delimiter).map(header => header.trim());
}

interface ParseRowOptions {
  delimiter?: string;
  headers?: string[];
}

function parseRow<T extends string>(
  line: string,
  opts: { delimiter?: string; headers: T[] }
): Record<string, Value>;

function parseRow(line: string, opts?: { delimiter?: string }): Value[];

function parseRow(
  line: string,
  opts: ParseRowOptions = {}
): Record<string, Value> | Value[] {
  const delimiter = opts.delimiter ?? ",";
  const headers = opts.headers ?? [];
  const l = headers.length;

  let parsed = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)!;
  let row = {} as Record<string, Value>;

  if (l > 0) {
    for (let i = 0; i < l; i++) {
      let [h, v] = [headers[i], parsed[i]];

      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.substring(1, v.length - 1);
      }

      row[h] = parseValue(v);
    }

    return row;
  } else {
    return parsed.map(parseValue);
  }
}

/**
 * Function to get the values in a row for each header.
 * @param headers The headers to get values for.
 * @param entry The entry to get values from.
 * @returns The value in the row of the entry for each header.
 */
function getRowValuesFromHeaders(
  headers: string[],
  entry: Record<string, Value>,
  opts: ParseOptions = {}
): Value[] {
  const delimiter = opts.delimiter ?? ",";

  return headers.map(h =>
    entry[h] !== null
      ? entry[h]?.toString().includes(delimiter)
        ? `"${entry[h]}"`
        : entry[h]
      : "null"
  );
}

const parser = {
  parseValue,
  parseHeaders,
  parseRow,
  getRowValuesFromHeaders
};

export { parser };
