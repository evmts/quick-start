import { Address, createMemoryClient, http } from "tevm";
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
// const address = `0x${"0420".repeat(10)}` as const;
async function updateAccounts(address: Address) {
	const account = await memoryClient.tevmGetAccount({
		address,
		throwOnFail: false,
	});
	if (account.errors) throw account.errors;
	console.log(account); // console log the account to get familiar with what properties are on it
	document.querySelector("#address")!.innerHTML = address;
	document.querySelector("#nonce")!.innerHTML = String(account.nonce);
	document.querySelector("#balance")!.innerHTML = String(account.balance);

	// Update contract account info
	const contractAccount = await memoryClient.tevmGetAccount({
		address,
		throwOnFail: false,
		returnStorage: true,
	});
	if (contractAccount.errors) throw contractAccount.errors;

	const header = document.querySelector("#contractInfoHeader")!;
	const info = document.querySelector("#contractInfoRow")!;

	header.innerHTML = `<tr>Address</tr>
  <tr>deplyedBytecode</tr>
  ${Object.keys(contractAccount.storage ?? []).map(
		(storageSlot) => `<tr>${storageSlot}</tr>`,
	)}
  `;

	info.innerHTML = `<tr>${contractAccount.address}</tr>
  <tr>${contractAccount.deployedBytecode}</tr>
  ${Object.values(contractAccount.storage ?? []).map(
		(storageValue) => `<tr>${storageValue}</tr>`,
	)}
  `;
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

	status.innerHTML = "Initializing memory client...";
	// this isn't necessary to explicitly await readyness as other actions will wait for it implicitly
	await memoryClient.tevmReady();

	status.innerHTML = "Fetching block number...";

	const blockNumber = await memoryClient.getBlockNumber();
	document.querySelector("#blocknumber")!.innerHTML =
		`ForkBlock: ${blockNumber}`;

	const initialValue = 420n;
	const deployResult = await memoryClient.tevmDeploy({
		from: prefundedAccounts[0],
		abi: SimpleContract.abi,
		// make sure to use bytecode rather than deployedBytecode since we are deploying
		bytecode: SimpleContract.bytecode,
		args: [initialValue],
	});
	if (deployResult.errors) throw deployResult.errors;

	status.innerHTML = `Mining contract deployment tx ${deployResult.txHash} for contract ${deployResult.createdAddress}...`;

	// remember to mine!
	await memoryClient.tevmMine();

	status.innerHTML = `updating ui to reflect newly mined tx ${deployResult.txHash} deploying contract ${deployResult.createdAddress}...`;

	const deployedContract = SimpleContract.withAddress(
		deployResult.createdAddress as Address,
	);

	status.innerHTML = "Querying contract with tevmContract...";

	const contractResult = await memoryClient.tevmContract(
		deployedContract.read.get(),
	);
	if (contractResult.errors) throw contractResult.errors;
	console.log(contractResult.rawData); // returns the raw data returned by evm
	console.log(contractResult.data); // returns the decoded data. Should be the initial value we set
	console.log(contractResult.executionGasUsed); // returns the execution gas used (won't include the data cost or base fee)
	// console log the entire result to become familiar with what all gets returned

	const newValue = 10_000n;
	status.innerHTML = `Current value ${contractResult.data}. Changing value to ${newValue}`;

	// just like tevmCall we can write with `createTransaction: true`
	// remember the default `from` address is `prefundedAccounts[0]` when not specified!
	const writeResult = await memoryClient.tevmContract({
		createTransaction: "on-success",
		...deployedContract.write.set(newValue),
	});

	status.innerHTML = `Current value ${contractResult.data}. Changing value to ${newValue}. Mining tx ${writeResult.txHash}`;

	// remember to mine
	const mineResult = await memoryClient.tevmMine();

	// feel free to double check the value actually changed by calling tevmContract again!

	status.innerHTML = `Value changed in block ${mineResult.blockHashes?.join(
		",",
	)}. Updating storage in html...`;

	// now let's refresh the account information to update storage
	await updateAccounts(deployResult.createdAddress as Address);
	status.innerHTML = "done";
}

runApp();
