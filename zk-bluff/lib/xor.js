const dec = "NOOR-SALISBURY"

export function encodeGameState(data) {
    const jsonString = JSON.stringify(data);
    const codeUnits = new TextEncoder().encode(jsonString);
    const scrambled = codeUnits.map((byte, i) => 
      byte ^ dec.charCodeAt(i % dec.length)
    );
    const binString = String.fromCharCode(...scrambled);
    return btoa(binString);
  };

export function decodeGameState(encodedData) {
    try {
      const binString = atob(encodedData);
      const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
      const unscrambled = bytes.map((byte, i) => 
        byte ^ dec.charCodeAt(i % dec.length)
      );
      const jsonString = new TextDecoder().decode(unscrambled);
      return JSON.parse(jsonString);
    } catch (e) {
      // invalid data - probably tampered with
      return null;
    }
  };