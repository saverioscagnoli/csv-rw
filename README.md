# CSV writer and parser

**With dynamic typing!** 🥳

![npm-badge](https://img.shields.io/npm/v/csv-rw)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com)

## Usage

To install the package, run the following command:

```
npm i csv-rw
```

### Example

```ts
import { CSV } from "csw-rw";

const csv = new CSV({ path: "path/to/file.csv", headers: ["name", "age"] });

// There's intellisense!
csv.write({ name: "John", age: 21 });

csv.write([
  { name: "Jane", age: 19 },
  { name: "Freddy", age: 45 }
]);

console.log(csv.read());

/* -> [
    { name: "John", age: 21 },
    { name: "Jane", age: 19 },
    { name: "Freddy", age: 45 }
] */
```

You must pass am object to the CSV class constructor, these are the properties on that object:

| option           | description                                                                            | type       | default |
| ---------------- | -------------------------------------------------------------------------------------- | ---------- | ------- |
| `path`           | Path to the CSV file, if the file doesn't exist it will be created.                    | `string`   | None    |
| `headers`        | The headers of the CSV file.                                                           | `string[]` | `[]`    |
| `deletePrevious` | If the path to the CSV file already exists, whether to delete it and create a new one. | `string`   | `false` |
| `delimiter`      | The delimiter that separates the value / headers                                       | `string`   | `,`     |

## Usage with types

By default, the value of each header is of type `Value`, which is `string | number | boolean | null`.
The default `Value` type can be overridden, by preixing the headers value in the constructor.

`s:...` -> `sting` <br />
`n:...` -> `number` <br />
`b:...` -> `boolean`

And you can make a header value optional by suffixing the value with `?`
By default, if the value is optional and not passed while writing to the csv file, it will default to `null`

### Example

```ts
import { CSV } from "csv-rw";

const csv = new CSV({
  path: "path/to/file.csv",
  headers: ["s:name", "n:age", "b:isAlive?"]
});

/**
 * Name - string
 * Age - number
 * isAlive - boolean | undefined
 */

csv.write({ name: "Jane", age: "Don't ask that to a lady!" });
/**
 *                         ↑
 * The typescript compiler will complain, as we are trying to
 * assign a string to a number
 */
```

### License

MIT License (c) 2023 Saverio Scagnoli
