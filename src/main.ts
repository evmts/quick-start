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
`;
	const status = app.querySelector("#status")!;

	status.innerHTML = "Fetching block number...";

	document.querySelector("#blocknumber")!.innerHTML = `Fetching block number next step. For now let's check out which methods are on memory client:
<ul>
  ${Object.keys(memoryClient).map((key) => `<li>${key}</li>`)}
</ul>`;

	status.innerHTML = "Done";
}

runApp();
