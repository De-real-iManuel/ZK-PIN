pragma circom 2.0.0;

// We include the Poseidon library for hashing
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template PinVerify() {
    // 1. SIGNALS
    signal input pin;          // Private: The 4-digit witness
    signal input publicHash;   // Public: What the door knows
    signal output isValid;     // 1 if they match

    // 2. CONSTRAINTS & LOGIC
    // First, let's ensure the PIN is actually 4 digits (0 - 9999)
    component rangeCheck = LessThan(14); // 14 bits is enough for 9999
    rangeCheck.in[0] <== pin;
    rangeCheck.in[1] <== 10000;
    rangeCheck.out === 1;

    // 3. HASHING
    // We initialize Poseidon with 1 input (our pin)
    component hasher = Poseidon(1);
    hasher.inputs[0] <== pin;

    // 4. THE FINAL MATCH
    // We force the output of the hasher to equal the publicHash
    // If they don't match, the proof generation will fail!
    hasher.out === publicHash;
    
    isValid <== 1;
}

// We define which input is public. 'pin' is private by default.
component main {public [publicHash]} = PinVerify();