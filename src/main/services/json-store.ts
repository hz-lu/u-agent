import fs from "node:fs";
import path from "node:path";

export class JsonStore<T> {
  constructor(
    private readonly file: string,
    private readonly defaults: T
  ) {}

  read(): T {
    try {
      if (!fs.existsSync(this.file)) return this.write(this.defaults);
      return { ...this.defaults, ...JSON.parse(fs.readFileSync(this.file, "utf8")) };
    } catch {
      return this.write(this.defaults);
    }
  }

  write(value: T): T {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    return value;
  }
}
