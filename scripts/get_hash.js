const { buildPoseidon } = require("circomlibjs"); // You'll need: npm install circomlibjs

async function run() {
    const poseidon = await buildPoseidon();
    const hash = poseidon([5479]); // Your 4-digit PIN
    console.log("Poseidon Hash:", hash.toString());
}
run();