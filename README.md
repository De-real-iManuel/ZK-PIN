# 🔐 Zero-Knowledge PIN Verification — A Beginner's Guide

> **"I know the PIN. I can prove it. But I will never tell you what it is."**
>
> That sentence sounds like a riddle, but it's the entire idea behind Zero-Knowledge Proofs — and by the end of this guide, you'll understand exactly how it works.

---

## 📖 Table of Contents

1. [What is a Zero-Knowledge Proof?](#1-what-is-a-zero-knowledge-proof)
2. [The Real-World Analogy](#2-the-real-world-analogy)
3. [How This Project Works](#3-how-this-project-works)
4. [Key Concepts You'll Learn](#4-key-concepts-youll-learn)
   - [Circuits](#41-circuits)
   - [Signals](#42-signals)
   - [Constraints](#43-constraints)
   - [Hashing with Poseidon](#44-hashing-with-poseidon)
   - [The Witness](#45-the-witness)
   - [The Proof](#46-the-proof)
   - [The Trusted Setup](#47-the-trusted-setup)
5. [Project Structure](#5-project-structure)
6. [Prerequisites](#6-prerequisites)
7. [Step-by-Step Walkthrough](#7-step-by-step-walkthrough)
8. [Understanding the Circuit Code](#8-understanding-the-circuit-code)
9. [Common Mistakes & What They Mean](#9-common-mistakes--what-they-mean)
10. [Going Further](#10-going-further)

---

## 1. What is a Zero-Knowledge Proof?

A **Zero-Knowledge Proof (ZKP)** is a cryptographic method that lets one party (the **Prover**) convince another party (the **Verifier**) that they know a secret — without revealing the secret itself.

Three properties must hold:

| Property | What it means |
|---|---|
| **Completeness** | If the prover knows the secret, they can always produce a valid proof |
| **Soundness** | If the prover does NOT know the secret, they cannot fake a valid proof |
| **Zero-Knowledge** | The verifier learns absolutely nothing about the secret itself |

Think of it like this: you want to prove you know the answer to a puzzle without showing the answer. ZKPs make that mathematically possible.

---

## 2. The Real-World Analogy

Imagine a **smart door lock**. The door doesn't store your PIN in plain text — that would be a security disaster. Instead, it stores a **hash** of your PIN (a scrambled, one-way fingerprint).

When you enter your PIN:
1. The door hashes what you typed
2. It compares that hash to the stored one
3. If they match — door opens

**The problem:** The door still *sees* your PIN when you type it. Someone watching could steal it.

**The ZK solution:** Instead of sending your PIN, you send a **cryptographic proof** that says:

> *"I know a number that, when hashed with Poseidon, produces exactly this public hash — and that number is between 0 and 9999."*

The door verifies the proof. The door never sees your PIN. Nobody watching learns anything.

That is exactly what this project implements.

---

## 3. How This Project Works

This project uses **Groth16**, one of the most popular ZK proof systems, built on top of **circom** (a circuit compiler) and **snarkjs** (a JavaScript ZK toolkit).

The flow looks like this:

```
Your Secret PIN
      │
      ▼
 [Circuit] ──── Constraints ────► R1CS (math rules)
      │
      ▼
 [Witness] ──── Your private values that satisfy the circuit
      │
      ▼
 [Groth16 Prover] ──── Uses witness + proving key ────► Proof
      │
      ▼
 [Verifier] ──── Uses proof + public inputs ────► ✅ Valid or ❌ Invalid
```

The verifier only ever sees:
- The **public hash** (which was already public)
- The **proof** (which reveals nothing about the PIN)

---

## 4. Key Concepts You'll Learn

### 4.1 Circuits

In ZK, a **circuit** is not an electrical circuit — it's a mathematical description of a computation. You write it in a language called **circom**.

A circuit defines:
- What inputs it takes (public and private)
- What computations happen
- What constraints must be satisfied

If all constraints are satisfied, a valid proof can be generated. If even one constraint fails, proof generation is impossible.

Think of constraints like equations that must all be true at the same time.

### 4.2 Signals

Signals are the variables inside a circom circuit. There are three kinds:

| Signal type | Keyword | Who sees it? |
|---|---|---|
| Private input | `signal input` (default) | Only the prover |
| Public input | `signal input` + declared in `main` | Everyone |
| Output | `signal output` | Everyone |

In this project:
- `pin` is **private** — only you know it
- `publicHash` is **public** — the door (verifier) knows it
- `isValid` is the **output** — always `1` if the proof is valid

### 4.3 Constraints

Constraints are the rules your circuit enforces. In circom, you write them with `===` (not `==`).

```circom
hasher.out === publicHash;
```

This line doesn't just *check* equality — it **enforces** it at the mathematical level. If `hasher.out` doesn't equal `publicHash`, the circuit is unsatisfiable and no proof can be generated. There is no way to cheat this.

The `<==` operator both assigns a value AND creates a constraint in one step:

```circom
hasher.inputs[0] <== pin;
```

### 4.4 Hashing with Poseidon

Regular hash functions like SHA-256 are terrible inside ZK circuits — they create millions of constraints and make proofs huge and slow.

**Poseidon** is a hash function designed specifically for ZK circuits. It's:
- ZK-friendly (very few constraints)
- Collision-resistant (you can't find two inputs with the same hash)
- One-way (you can't reverse a hash to find the input)

This project uses `Poseidon(1)` — a Poseidon hasher that takes exactly 1 input.

```circom
component hasher = Poseidon(1);
hasher.inputs[0] <== pin;
// hasher.out is now the Poseidon hash of pin
```

### 4.5 The Witness

The **witness** is the full set of all signal values — both public and private — that satisfy the circuit. It's like the "solution" to the circuit's equations.

The witness is generated by running the circuit with your actual inputs. It is **never shared** with the verifier. The prover uses it internally to generate the proof.

```
witness = { pin: 5479, publicHash: 1067...329, isValid: 1, ... }
```

### 4.6 The Proof

The **proof** is a small set of elliptic curve points (just a few hundred bytes) that mathematically guarantees:

> *"I ran the circuit with a valid witness. All constraints were satisfied. I'm not telling you the private inputs."*

The verifier can check this proof in milliseconds without knowing anything about your PIN.

### 4.7 The Trusted Setup

Groth16 requires a one-time **trusted setup** ceremony to generate proving and verification keys. This involves:

1. **Powers of Tau** — a universal ceremony (the `.ptau` files in this project). These are reusable across many circuits.
2. **Circuit-specific setup** — generates a `.zkey` file tied to your specific circuit.

The "trusted" part means: if the people running the ceremony destroyed their secret randomness (called "toxic waste"), the system is secure. This project uses a pre-generated `.ptau` file for learning purposes.

---

## 5. Project Structure

```
zk-project/
│
├── circuits/
│   └── pin_verify.circom       # The ZK circuit — the heart of the project
│
├── inputs/
│   └── input.json              # Public + private inputs for proof generation
│
├── keys/                       # Proving key and verification key (generated)
│
├── proofs/                     # Generated proof and public signals (generated)
│
├── scripts/
│   └── get_hash.js             # Helper: compute Poseidon hash of any PIN
│
├── generate_input.js           # Generates input.json with correct hash
├── 12_final.ptau               # Powers of Tau file (trusted setup, phase 1)
├── .env.example                # Template for your secret PIN config
└── package.json
```

---

## 6. Prerequisites

Before you start, make sure you have:

- **Node.js** v16 or higher — [nodejs.org](https://nodejs.org)
- **circom** compiler — [installation guide](https://docs.circom.io/getting-started/installation/)
- **snarkjs** — install globally with:

```bash
npm install -g snarkjs
```

- Project dependencies:

```bash
npm install
```

---

## 7. Step-by-Step Walkthrough

Follow these steps in order. Each one builds on the last.

---

### Step 1 — Choose your PIN and generate the public hash

Your PIN is private. But the verifier needs to know its *hash* upfront. Run:

```bash
node generate_input.js
```

This outputs a JSON object like:

```json
{
  "pin": "5479",
  "publicHash": "10670799150889704118736431061025753054539694058229167625650253199017622372329"
}
```

Copy this into `inputs/input.json`. The `publicHash` is what the "door" (verifier) will store publicly.

> 💡 **Why does the hash look like a huge number?** Poseidon operates inside a finite field — a mathematical space with a fixed maximum number. All values in ZK circuits are field elements, which look like very large integers.

---

### Step 2 — Compile the circuit

```bash
circom circuits/pin_verify.circom --r1cs --wasm --sym -o build
```

This produces:
- `build/pin_verify.r1cs` — the circuit as a system of math equations (Rank-1 Constraint System)
- `build/pin_verify_js/` — WebAssembly code to compute the witness
- `build/pin_verify.sym` — symbol map for debugging

> 💡 **What is R1CS?** Every constraint in your circuit gets converted into a matrix equation of the form `A · B = C`. The entire circuit becomes a system of these equations. This is the mathematical backbone of Groth16.

---

### Step 3 — Generate the witness

```bash
node build/pin_verify_js/generate_witness.js build/pin_verify_js/pin_verify.wasm inputs/input.json witness.wtns
```

This runs your circuit with the actual inputs and produces `witness.wtns` — the complete assignment of all signals.

> 💡 **If this step fails**, it means your inputs don't satisfy the circuit constraints. For example, if your `publicHash` doesn't match the Poseidon hash of your `pin`, the circuit will reject it here — before any proof is even attempted.

---

### Step 4 — Trusted setup (circuit-specific)

```bash
snarkjs groth16 setup build/pin_verify.r1cs 12_final.ptau keys/pin_verify_0000.zkey
```

Then contribute randomness (even for local testing, this step is required):

```bash
snarkjs zkey contribute keys/pin_verify_0000.zkey keys/pin_verify_final.zkey --name="local test" -v
```

Export the verification key:

```bash
snarkjs zkey export verificationkey keys/pin_verify_final.zkey keys/verification_key.json
```

> 💡 **What is the `.zkey` file?** It contains the proving key (used to generate proofs) and the verification key (used to verify them). It's mathematically bound to your specific circuit — a `.zkey` from a different circuit won't work here.

---

### Step 5 — Generate the proof

```bash
snarkjs groth16 prove keys/pin_verify_final.zkey witness.wtns proofs/proof.json proofs/public.json
```

This produces:
- `proofs/proof.json` — the actual ZK proof (3 elliptic curve points)
- `proofs/public.json` — the public inputs/outputs (just the hash and `isValid`)

Open `proofs/proof.json` — it will look something like:

```json
{
  "pi_a": ["1234..."],
  "pi_b": [["5678...", "9012..."], ...],
  "pi_c": ["3456..."],
  "protocol": "groth16"
}
```

This is your proof. It contains zero information about your PIN.

---

### Step 6 — Verify the proof

```bash
snarkjs groth16 verify keys/verification_key.json proofs/public.json proofs/proof.json
```

You should see:

```
[INFO]  snarkJS: OK!
```

That's it. The verifier confirmed you know a PIN that hashes to the public hash — without ever learning the PIN.

---

## 8. Understanding the Circuit Code

Let's walk through `circuits/pin_verify.circom` line by line:

```circom
pragma circom 2.0.0;
```
Declares the circom version. Always include this.

```circom
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
```
Imports reusable circuit components from circomlib — the standard library of ZK building blocks.

```circom
template PinVerify() {
    signal input pin;        // Private: only the prover knows this
    signal input publicHash; // Public: the verifier knows this
    signal output isValid;   // Output: will be 1 if proof is valid
```
Defines the circuit's interface. `pin` is private by default. `publicHash` is declared public in the `main` component below.

```circom
    component rangeCheck = LessThan(14);
    rangeCheck.in[0] <== pin;
    rangeCheck.in[1] <== 10000;
    rangeCheck.out === 1;
```
Enforces that `pin < 10000` (i.e., it's a valid 4-digit PIN). Without this, someone could use any number as a "PIN". The `14` means the comparator uses 14-bit arithmetic, which is enough to represent numbers up to 16383.

```circom
    component hasher = Poseidon(1);
    hasher.inputs[0] <== pin;
```
Creates a Poseidon hasher with 1 input and feeds the PIN into it.

```circom
    hasher.out === publicHash;
```
The critical constraint: the hash of the private PIN must equal the public hash. This is the entire security guarantee of the circuit.

```circom
    isValid <== 1;
}
```
Sets the output to 1. Since this line is only reachable if all previous constraints passed, `isValid = 1` means everything checked out.

```circom
component main {public [publicHash]} = PinVerify();
```
Instantiates the circuit and declares `publicHash` as a public input. Everything not listed here is private.

---

## 9. Common Mistakes & What They Mean

| Error | What went wrong |
|---|---|
| `Error: Assert Failed` during witness generation | Your inputs don't satisfy a constraint — likely the hash doesn't match the PIN |
| `Error: Not all inputs have been set` | You're missing a required input in `input.json` |
| `snarkjs: Invalid proof` during verification | The proof was generated with different inputs than the public signals |
| `circom: signal not used` warning | You declared a signal but never constrained it — it won't be enforced |
| Proof verifies but output is wrong | You may have assigned a signal without constraining it (`=` vs `<==`) |

> ⚠️ **The most common beginner mistake:** Using `<--` (assignment only) instead of `<==` (assignment + constraint). If you only assign without constraining, a malicious prover can put any value there and still generate a valid proof.

---

## 10. Going Further

Once you're comfortable with this project, here are natural next steps:

- **Multi-digit PIN as array** — instead of one number, prove knowledge of a 4-element array where each element is 0–9
- **Export a Solidity verifier** — run `snarkjs zkey export solidityverifier` to get a smart contract that verifies proofs on-chain
- **Nullifiers** — add a nullifier to prevent the same proof from being used twice (important for on-chain use)
- **Merkle tree membership** — prove your PIN is in a set of valid PINs without revealing which one
- **Learn more ZK theory** — [ZKProof.org](https://zkproof.org), [0xparc.org](https://0xparc.org), [zk-learning.org](https://zk-learning.org)

---

## Glossary

| Term | Plain English |
|---|---|
| **Circuit** | A mathematical description of a computation with enforced rules |
| **Signal** | A variable inside a circuit |
| **Constraint** | A rule that must be true — if it fails, no proof is possible |
| **Witness** | The full set of private + public values that satisfy the circuit |
| **Proof** | A small piece of data that proves the witness exists, without revealing it |
| **Trusted Setup** | A one-time ceremony to generate the cryptographic keys for a circuit |
| **R1CS** | Rank-1 Constraint System — the math format circuits compile to |
| **Poseidon** | A ZK-friendly hash function |
| **Groth16** | A ZK proof system known for tiny proof sizes and fast verification |
| **Prover** | The party who knows the secret and generates the proof |
| **Verifier** | The party who checks the proof without learning the secret |
| **Field element** | A number within the finite mathematical space ZK circuits operate in |
| **Toxic waste** | The secret randomness from the trusted setup — must be destroyed |

---

*Built for learning. Break it, modify it, understand it.*
