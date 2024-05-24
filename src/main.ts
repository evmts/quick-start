import { createMemoryClient, http } from "tevm";
import { optimism } from "tevm/common";
import { prefundedAccounts } from "tevm";

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
`;
	const status = app.querySelector("#status")!;

	status.innerHTML = "Fetching block number...";
	const blockNumber = await memoryClient.getBlockNumber();
	document.querySelector("#blocknumber")!.innerHTML =
		`ForkBlock: ${blockNumber}`;

	status.innerHTML = "Setting account...";
	const setAccountResult = await memoryClient.tevmSetAccount({
		address,
		balance: 420n,
		throwOnFail: false,
	});
	if (setAccountResult.errors) console.error(setAccountResult.errors);

	status.innerHTML = "Updating account...";
	await updateAccounts();

	status.innerHTML = "done";
}

runApp();
