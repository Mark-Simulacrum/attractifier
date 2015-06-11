import fs from "fs";
import InputStream from "./InputStream";

export function isGreyspace(string) {
    if (string === "" ||
        string === " " ||
        string === "\n" ||
        /^\s*$/.test(string)) {
        return true;
    }

    if (string === undefined || string === null)
        throw new Error("passed undefined or null to isGreyspace");

    let stream = new InputStream(string);

    while (!stream.atEnd()) {
        let consumed = stream.consume(/\s+/) ||
            stream.consume(/\/\/[^\n]*/) ||
            stream.consume(/\/\*[\W\S]*?\*\//);
        if (!consumed) return false;
    }

    return stream.atEnd();
}

export function log(...messages) {
    let data = messages.join(" ") + "\n";
    try {
        fs.writeSync(3, data);
    } catch (error) {
        if (error.code === "EBADF") {
            return;
        } else {
            throw error;
        }
    }
}
