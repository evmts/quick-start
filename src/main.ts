import { createMemoryClient, http } from "tevm";
import { optimism } from "tevm/common";

const app = document.querySelector("#app") as Element;

const memoryClient = createMemoryClient({
	common: optimism,
	fork: {
		// @warning we may face throttling using the public endpoint
		// In production apps consider using `loadBalance` and `rateLimit` transports
		transport: http("https://mainnet.optimism.io")({}),
	},
});

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
	status.innerHTML = "Done";
}

runApp();
