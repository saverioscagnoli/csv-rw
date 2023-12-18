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

### License

MIT License (c) 2023 Saverio Scagnoli
