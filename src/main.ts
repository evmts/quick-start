import { createMemoryClient, http } from "tevm";
import { optimism } from "tevm/common";
import { prefundedAccounts } from "tevm";
import { SimpleContract } from "tevm/contract";

console.log("accounts prefunded with 1000 eth", prefundedAccounts);

const app = document.querySelector("#app") as Element;

const memoryClient = createMemoryClient({
	common: optimism,
	fork: {
		// @warning we may face throttling using the public endpoint
		// In production apps consider using `loadBalance` and `rateLimit` transports
		transport: http("https://mainnet.optimism.io")({}),
	},
});

// addresses and abis must be as const for tevm types
const address = `0x${"0420".repeat(10)}` as const;
async function updateAccounts() {
	// we are setting throwOnFail to false because we expect this to throw an error from the account not existing
	const account = await memoryClient.tevmGetAccount({
		address,
		throwOnFail: false,
	});
	if (account.errors) {
		// this will error
		console.error("Unable to get account", account.errors);
		return;
	}
	console.log(account); // console log the account to get familiar with what properties are on it
	document.querySelector("#address")!.innerHTML = address;
	document.querySelector("#nonce")!.innerHTML = String(account.nonce);
	document.querySelector("#balance")!.innerHTML = String(account.balance);
}

async function runApp() {
	app.innerHTML = `<div id="status">initializing...</div>
<div id="blocknumber"></div>
<div>
  Address: <span id="address"></span>
</div>
<div>
  Nonce: <span id="nonce"></span>
</div>
<div>
  Balance: <span id="balance"></span>
</div>
<h1>Counter contract</h1>

<!-- Contract info -->
<table border="1" id="contractInfo">
    <thead>
        <tr id="contractInfoHeader">
            <!-- We will fill this in in js -->
        </tr>
    </thead>
    <tbody>
        <tr id="contractInfoRow">
            <!-- We will fill this in in js -->
        </tr>
    </tbody>
</table>
`;

	const status = app.querySelector("#status")!;

	status.innerHTML = "Fetching block number...";

	const blockNumber = await memoryClient.getBlockNumber();
	document.querySelector("#blocknumber")!.innerHTML =
		`ForkBlock: ${blockNumber}`;

	status.innerHTML = "Sending eth to account...";

	const callResult = await memoryClient.tevmCall({
		// this is the default `from` address so this line isn't actually necessary
		from: prefundedAccounts[0],
		to: address,
		value: 420n,
		createTransaction: true,
	});
	if (callResult.errors) throw new AggregateError(callResult.errors);

	status.innerHTML = "Mining block";

	const mineResult = await memoryClient.tevmMine();
	if (mineResult.errors) throw new AggregateError(mineResult.errors);
	console.log(mineResult.blockHashes);

	status.innerHTML = "Updating account...";
	await updateAccounts();

	const initialValue = 420n;
	const deployResult = await memoryClient.tevmDeploy({
		from: prefundedAccounts[0],
		abi: SimpleContract.abi,
		// make sure to use bytecode rather than deployedBytecode since we are deploying
		bytecode: SimpleContract.bytecode,
		args: [initialValue],
	});
	if (deployResult.errors) throw new AggregateError(deployResult.errors);

	status.innerHTML = `Mining contract deployment tx ${deployResult.txHash} for contract ${deployResult.createdAddress}...`;

	// remember to mine!
	await memoryClient.tevmMine();

	status.innerHTML = `updating ui to reflect newly mined tx`;

	// Pass in the contract address to updateAccounts
	// we will update this function to display contract info in next step
	await updateAccounts(deployResult.createdAddress);
	status.innerHTML = "done";
}

runApp();
