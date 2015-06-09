import fs from "fs";
import InputStream from "./InputStream";

export function isGreyspace(string) {
    if (string === "" ||
        string === " " ||
        string === "\n" ||
        /^\s*$/.test(string)) {
        return true;
    }

    let stream = new InputStream(string);

    while (!stream.atEnd()) {
        let consumed = stream.consume(/\s+/) ||
            stream.consume(/\/\/[^\n]*/) ||
            stream.consume(/\/\*[\W\S]*?\*\//);
        if (!consumed) return false;
    }

    return stream.atEnd();
}

let stream = fs.createWriteStream("", {
    fd: 3,
    encoding: "utf8"
});

function handleError(error) {
    if (error) {
        if (error.code === "EBADF") {
            stream = null;
        } else {
            throw error;
        }
    }
}

stream.on("error", handleError);

export function log(...messages) {
    if (!stream) return;

    stream.write(messages.join("") + "\n", "utf8", handleError);
}
