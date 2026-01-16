<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { authToken, isAuthenticated } from "$lib/stores";
	import { Chart, registerables } from "chart.js";

	Chart.register(...registerables);

	let tokenInput = "";
	let temperatureChart: Chart | null = null;
	let humidityChart: Chart | null = null;
  let lightChart: Chart | null = null;
	let temperatureCanvas: HTMLCanvasElement;
	let humidityCanvas: HTMLCanvasElement;
  let lightCanvas: HTMLCanvasElement;
	let pollInterval: NodeJS.Timeout;
	let error = "";

	async function login() {
		authToken.set(tokenInput);
		isAuthenticated.set(true);
		error = "";
		await fetchData();
	}

	function logout() {
		authToken.set("");
		isAuthenticated.set(false);
		tokenInput = "";
		if (pollInterval) clearInterval(pollInterval);
	}

	async function fetchData() {
		try {
			const response = await fetch("/api/data", {
				headers: {
					Authorization: `Bearer ${$authToken}`
				}
			});

			if (response.status === 401) {
				error = "Invalid token";
				logout();
				return;
			}

			if (!response.ok) {
				throw new Error("Failed to fetch data");
			}

			const result = await response.json();
			updateCharts(result.data);
			error = "";
		} catch (e) {
			error = "Error fetching data: " + (e as Error).message;
			console.error(e);
		}
	}

	function updateCharts(data: any[]) {
		const tempData = data.filter((d) => d.temperature !== null);
		const humidData = data.filter((d) => d.humidity !== null);
    const lightData = data.filter((d) => d.light !== null);

		const tempLabels = tempData.map((d) => new Date(d.time).toLocaleTimeString());
		const tempValues = tempData.map((d) => d.temperature);

		const humidLabels = humidData.map((d) => new Date(d.time).toLocaleTimeString());
		const humidValues = humidData.map((d) => d.humidity);

    const lightLabels = lightData.map((d) => new Date(d.time).toLocaleTimeString());
		const lightValues = lightData.map((d) => d.light);

		if (temperatureChart) {
			temperatureChart.data.labels = tempLabels;
			temperatureChart.data.datasets[0].data = tempValues;
			temperatureChart.update("none");
		} else if (temperatureCanvas) {
			temperatureChart = new Chart(temperatureCanvas, {
				type: "line",
				data: {
					labels: tempLabels,
					datasets: [
						{
							label: "Temperature in °C",
							data: tempValues,
							borderColor: "rgb(255, 99, 132)",
							backgroundColor: "rgba(255, 99, 132, 0.1)",
							tension: 0.4,
							fill: true
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					animation: false
				}
			});
		}

		if (humidityChart) {
			humidityChart.data.labels = humidLabels;
			humidityChart.data.datasets[0].data = humidValues;
			humidityChart.update("none");
		} else if (humidityCanvas) {
			humidityChart = new Chart(humidityCanvas, {
				type: "line",
				data: {
					labels: humidLabels,
					datasets: [
						{
							label: "Humidity in %",
							data: humidValues,
							borderColor: "rgb(54, 162, 235)",
							backgroundColor: "rgba(54, 162, 235, 0.1)",
							tension: 0.4,
							fill: true
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					animation: false
				}
			});
		}

    if (lightChart) {
			lightChart.data.labels = lightLabels;
			lightChart.data.datasets[0].data = lightValues;
			lightChart.update("none");
		} else if (lightCanvas) {
			lightChart = new Chart(lightCanvas, {
				type: "line",
				data: {
					labels: lightLabels,
					datasets: [
						{
							label: "Light in %",
							data: lightValues,
							borderColor: "rgb(255, 99, 132)",
							backgroundColor: "rgba(255, 99, 132, 0.1)",
							tension: 0.4,
							fill: true
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					animation: false
				}
			});
		}
	}

	onMount(() => {
		if ($isAuthenticated) {
			fetchData();
			pollInterval = setInterval(fetchData, 5000); // Poll every 5 seconds
		}
	});

	onDestroy(() => {
		if (pollInterval) clearInterval(pollInterval);
		if (temperatureChart) temperatureChart.destroy();
		if (humidityChart) humidityChart.destroy();
    if (lightChart) lightChart.destroy();
	});

	$: if ($isAuthenticated && !pollInterval) {
		pollInterval = setInterval(fetchData, 5000);
	}
</script>

<main>
	<h1>Environmental Monitoring Station</h1>

	{#if !$isAuthenticated}
		<div class="login-container">
			<h2>Login</h2>
			<input
				type="password"
				bind:value={tokenInput}
				placeholder="Enter authentication token"
				on:keydown={(e) => e.key === "Enter" && login()}
			/>
			<button on:click={login}>Login</button>
			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
	{:else}
		<div class="dashboard">
			<div class="header">
				<h2>Live Dashboard</h2>
				<button on:click={logout}>Logout</button>
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<div class="charts">
				<div class="chart-container">
					<h3>Temperature</h3>
					<canvas bind:this={temperatureCanvas}></canvas>
				</div>

				<div class="chart-container">
					<h3>Humidity</h3>
					<canvas bind:this={humidityCanvas}></canvas>
				</div>

        <div class="chart-container">
					<h3>Light</h3>
					<canvas bind:this={lightCanvas}></canvas>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    text-align: center;
    color: #333;
  }

  .login-container {
    max-width: 400px;
    margin: 4rem auto;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .login-container h2 {
    margin-top: 0;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    margin: 1rem 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  }

  button:hover {
    background-color: #0052a3;
  }

  .dashboard {
    margin-top: 2rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header h2 {
    margin: 0;
  }

  .last-update {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: #666;
  }

  .header button {
    width: auto;
    padding: 0.5rem 1.5rem;
  }

  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 2rem;
  }

  .chart-container {
    padding: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .chart-container h3 {
    margin-top: 0;
    color: #333;
  }

  canvas {
    max-height: 300px;
  }

  .error {
    color: #d32f2f;
    margin: 1rem 0;
    padding: 0.75rem;
    background-color: #ffebee;
    border-radius: 4px;
  }
</style>
