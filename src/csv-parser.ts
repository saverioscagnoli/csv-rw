import { Value } from ".";

interface ParseHeaderOptions {
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

function parseHeaders(line: string, opts: ParseHeaderOptions = {}): string[] {
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
): Record<T, Value>;

function parseRow(line: string, opts?: { delimiter?: string }): Value[];

function parseRow(
  line: string,
  opts: ParseRowOptions = {}
): Record<string, Value> | Value[] {
  const delimiter = opts.delimiter ?? ",";
  const headers = opts.headers ?? [];
  const l = headers.length;

  let row = line.split(delimiter).map(e => e.trim());

  if (l > 0) {
    let obj = {} as Record<string, Value>;

    for (let i = 0; i < l; i++) {
      let [v, h] = [row[i], headers[i]];
      obj[h] = parseValue(v);
    }

    return obj;
  } else {
    return row.map(parseValue);
  }
}