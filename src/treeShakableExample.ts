import { expect, it } from "vitest";
import { optimism } from "tevm/common";
import { SimpleContract } from "tevm/contract";
import { transports } from "@tevm/test-utils";
import { createClient } from "viem";
import { createTevmTransport } from "tevm/memory-client";
import { tevmContract } from "tevm";
import { tevmSetAccount } from "tevm/memory-client";
import {
	getEnsAddress,
	getTransactionReceipt,
	mine,
	sendTransaction,
} from "viem/actions";
import { PREFUNDED_ACCOUNTS, type Address } from "tevm";

it("uses tree shakable api to make a contract call", async () => {
	/**
	 * Viem clients support tree shakable actions with a plain client
	 * By using createTevmTransport, you can use tree shakable actions
	 * Including tevm specific actions like tevmContract, tevmSetAccount, etc
	 */
	const client = createClient({
		transport: createTevmTransport({
			fork: { transport: transports.optimism },
		}),
		chain: optimism,
	});

	// use any viem tree shakable action witht he client
	const vitalikAddress = await getEnsAddress(client, { name: "vitalik.eth" });

	// Use tree shakable tevm actions like tevmSetAccount to modify the vm state
	const contract = SimpleContract.withAddress(`0x${"1234".repeat(10)}`);
	await tevmSetAccount(client, {
		address: contract.address,
		deployedBytecode: SimpleContract.deployedBytecode,
	});

	// use tree shakable tevm call actions like tevmContract to interact with the evm
	// with features such as automatic account impersonation
	const result = await tevmContract(client, {
		...contract.write.set(42n),
		from: vitalikAddress as Address,
		createTransaction: true,
	});
	expect(result).toBeDefined();
	expect(result.rawData).toBeDefined();

	// use wallet actions too
	const hash = await sendTransaction(client, {
		account: PREFUNDED_ACCOUNTS[9],
		to: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
		value: 1000000000000000000n,
	});

	await mine({ ...client, mode: "anvil" }, { blocks: 1 });

	const receipt = await getTransactionReceipt(client, { hash });

	console.log(receipt);
});
