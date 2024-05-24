import { createMemoryClient } from "tevm";
import { Counter } from "../contracts/Counter.s.sol";
import { test, expect } from "vitest";

test("scripting", () => {
	// let's just throw on fail since we are just playing with scripts not building a production app
	const memoryClient = createMemoryClient();

	const scriptResult = memoryClient.tevmScript(Counter.read.count());

	expect(scriptResult).toMatchInlineSnapshot(`Promise {}`);
});
