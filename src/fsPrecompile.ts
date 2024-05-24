import fs from "node:fs/promises";
import { defineCall, definePrecompile } from "tevm";
/**
 * The tevm compiler allows us to import the solidity contract into javascript
 * `definePrecompile` will typecheck we implement it's interface correctly in typescript
 */
import { Fs } from "../contracts/Fs.sol";

const contract = Fs.withAddress("0xf2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2");

/**
 * A precompile build with tevm that allows the use of `fs.readFile` and `fs.writeFile` in Solidity scripts
 */
export const fsPrecompile = definePrecompile({
	contract,
	call: defineCall(Fs.abi, {
		readFile: async ({ args }) => {
			return {
				returnValue: await fs.readFile(...args, "utf8"),
				executionGasUsed: 0n,
			};
		},
		writeFile: async ({ args }) => {
			await fs.writeFile(...args);
			return { returnValue: true, executionGasUsed: 0n };
		},
	}),
});
