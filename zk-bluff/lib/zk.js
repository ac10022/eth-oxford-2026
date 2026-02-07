async function loadPoseidon() {
  const mod = await import('circomlibjs');
  if (mod.buildPoseidon) {
    return await mod.buildPoseidon();
  }
  else {
    throw new Error('No usable Poseidon found in circomlibjs. Ensure you have a recent circomlibjs release that exports buildPoseidon.');
  }
}

function toBigIntArray(arr) {
  return arr.map(x => BigInt(x));
}

export async function poseidonHash(inputs) {
  const poseidon = await loadPoseidon();
  const bigs = toBigIntArray(inputs);
  // Reduce inputs iteratively to support arbitrary length hands.
  // Use the poseidon state parameter to fold inputs: state = poseidon([value], state)
  let state = undefined;
  for (const v of bigs) {
    state = poseidon([v], state);
  }
  const res = state;
  if (poseidon.F && typeof poseidon.F.toString === 'function') {
    return poseidon.F.toString(res);
  }
  // fallback u8->hex
  if (res && res.buffer) {
    return Buffer.from(res).toString('hex');
  }
  return String(res);
}

// generate a hand commitment from an array of card identifiers and a salt
export async function generateHandCommitment(cards, salt) {
  const inputs = [...cards, salt];
  return poseidonHash(inputs);
}

// normalize proof to JSON string for storage
export function serializeProof(proof) {
  return JSON.stringify(proof);
}

// parse proof from stored string
export function parseProof(proofString) {
  try {
    return JSON.parse(proofString);
  } catch (e) {
    return null;
  }
}
