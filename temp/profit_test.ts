
function calculateProfit(prediction: "BULLISH" | "BEARISH", amount: number, leverage: number, entryPrice: number, closePrice: number) {
    console.log(`\nScenario: ${prediction} Bet $${amount} x${leverage}`);
    console.log(`Entry: ${entryPrice}, Close: ${closePrice}`);

    // Logic from context/game-context.tsx
    const isBullish = closePrice > entryPrice;
    const won = (prediction === "BULLISH" && isBullish) || (prediction === "BEARISH" && !isBullish);

    if (!won) {
        console.log("Result: ERROR - Simulation expects a WIN for profit testing");
        return 0;
    }

    const priceChangePct = ((closePrice - entryPrice) / entryPrice) * (prediction === "BULLISH" ? 1 : -1);
    console.log(`Price Change %: ${(priceChangePct * 100).toFixed(6)}%`);

    let winningsRaw = 0;
    if (leverage > 1) {
        // --- NEW LOGIC WITH BOOST ---
        const PROFIT_BOOST_FACTOR = 5.0; // The boost we added!

        const rawProfit = amount * priceChangePct * leverage * PROFIT_BOOST_FACTOR;
        winningsRaw = amount + rawProfit;

        const roi = (rawProfit / amount) * 100;
        console.log(`Raw Profit (Boosted 5x): $${rawProfit.toFixed(4)}`);
        console.log(`ROI: ${roi.toFixed(2)}%`);
    } else {
        winningsRaw = amount;
    }

    console.log(`Total Payout: $${winningsRaw.toFixed(4)}`);
    return winningsRaw;
}

console.log("--- VERIFYING 5x PROFIT BOOST ---");

// Simulation 1: Small Move (0.01%) - with 300x
// Expected: 0.01% * 300 = 3% raw. With 5x boost -> 15% ROI
calculateProfit("BULLISH", 10, 300, 50000, 50005);

// Simulation 2: Small Move (0.01%) - with 1000x
// Expected: 0.01% * 1000 = 10% raw. With 5x boost -> 50% ROI
calculateProfit("BULLISH", 10, 1000, 50000, 50005);

// Simulation 3: Volatile move (0.1%) - 300x
// Expected: 0.1% * 300 = 30% raw. With 5x boost -> 150% ROI
calculateProfit("BULLISH", 10, 300, 50000, 50050); 
