import { expect, test } from "vitest";
import { createMemoryClient } from "tevm";

import { existsSync, rmSync } from "node:fs";
import { fsPrecompile } from "./fsPrecompile.js";

// To get rid of the red underline for this import you must use the local typescript version
// https://code.visualstudio.com/docs/typescript/typescript-compiling#_using-the-workspace-version-of-typescript
// > Typescript: Select Typescript version: Use Workspace Version
import { WriteHelloWorld } from "../contracts/WriteHelloWorld.s.sol";

test("Call precompile from solidity script", async () => {
	const client = createMemoryClient({
		/**
		 * THis precompile allows our solidity script to use `fs.writeFile` to write to the filesystem
		 */
		customPrecompiles: [fsPrecompile.precompile()],
		loggingLevel: "trace",
	});

	/**
	 * `tevmScript` runs arbitrary solidity scripts on the memory client
	 */
	await client.tevmContract({
		/**
		 * Tevm scripts when imported with the tevm compiler provide a stramlined dev experience where contract building happens directly via a
		 * javascript import.
		 */
		...WriteHelloWorld.script().write.hello(fsPrecompile.contract.address),
		throwOnFail: false,
	});

	// test the solidity script wrote to the filesystem
	expect(existsSync("test.txt")).toBe(true);

	rmSync("test.txt");
});
