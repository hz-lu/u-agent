import fs from "node:fs";
import path from "node:path";
export class JsonStore {
    file;
    defaults;
    constructor(file, defaults) {
        this.file = file;
        this.defaults = defaults;
    }
    read() {
        try {
            if (!fs.existsSync(this.file))
                return this.write(this.defaults);
            return { ...this.defaults, ...JSON.parse(fs.readFileSync(this.file, "utf8")) };
        }
        catch {
            return this.write(this.defaults);
        }
    }
    write(value) {
        fs.mkdirSync(path.dirname(this.file), { recursive: true });
        fs.writeFileSync(this.file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
        return value;
    }
}
