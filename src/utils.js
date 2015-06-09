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
