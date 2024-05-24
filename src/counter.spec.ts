import { expect, test } from "vitest";
import { createMemoryClient } from "tevm";

import { existsSync, rmSync } from "node:fs";
import { fsPrecompile } from "./fsPrecompile.js";

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
