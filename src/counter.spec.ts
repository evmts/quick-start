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
		customPrecompiles: [fsPrecompile.precompile()],
		loggingLevel: "trace",
	});

	await client.tevmScript({
		...WriteHelloWorld.write.write(fsPrecompile.contract.address),
		throwOnFail: false,
	});

	expect(existsSync("test.txt")).toBe(true);

	rmSync("test.txt");
});
