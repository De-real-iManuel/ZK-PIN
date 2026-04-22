const { buildPoseidon } = require("circomlibjs");

async function run() {
    const poseidon = await buildPoseidon();
    
    const pin = 5479; 
    const hash = poseidon([pin]);
    
    // IMPORTANT: .F.toObject converts the Uint8Array/Buffer 
    // into a single large Field element (BigInt).
    const hashString = poseidon.F.toObject(hash).toString();

    const input = {
        "pin": pin.toString(),
        "publicHash": hashString // This must match the name in your .circom file
    };

    console.log(JSON.stringify(input));
    process.exit(0);
}

run();