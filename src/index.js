/**
 * Bin file for executing pretty-generator.
 * Node API in api/node.js.
 */
import "source-map-support/register";

import { formatFile } from "./api/node";

const inputFile = process.argv[2];
try {
    if (!inputFile) {
        process.stderr.write("Missing file operand:\n");
        process.stderr.write("Usage: node ./lib/index.js FILE\n");
        process.exit(1);
    }

    process.stdout.write(formatFile(inputFile));
} catch (error) {
    error.message = `${inputFile}: ${error.message}`;
    throw error;
}
