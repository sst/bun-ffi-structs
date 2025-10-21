import { ptr } from "bun:ffi"
import { dlopen } from "bun:ffi"

// Manual packing function to test Zig optional layout
export function packPersonWithOptional(data: {
  age: number
  optional_age: number | null
  height: number
  optional_height: number | null
  weight: number
  optional_weight: number | null
  name: string
  optional_name: string | null
}): ArrayBuffer {
  const buffer = new ArrayBuffer(80) // Size of PersonWithOptional
  const view = new DataView(buffer)
  const encoder = new TextEncoder()

  // Based on Zig layout from our analysis:
  // weight: offset 0 (f64)
  view.setFloat64(0, data.weight, true)

  // optional_weight: offset 8 (?f64)
  if (data.optional_weight !== null) {
    view.setFloat64(8, data.optional_weight, true)
    view.setUint8(16, 1) // flag = 1 for non-null
  } else {
    view.setFloat64(8, 0, true)
    view.setUint8(16, 0) // flag = 0 for null
  }

  // name: offset 24 ([]const u8) - slice (ptr, len)
  const nameBytes = encoder.encode(data.name)
  const namePtr = ptr(nameBytes)
  view.setBigUint64(24, BigInt(namePtr), true)
  view.setUint32(32, nameBytes.length, true)

  // optional_name: offset 40 (?[]const u8)
  if (data.optional_name !== null) {
    const optNameBytes = encoder.encode(data.optional_name)
    const optNamePtr = ptr(optNameBytes)
    view.setBigUint64(40, BigInt(optNamePtr), true)
    view.setUint32(48, optNameBytes.length, true)
    view.setUint8(56, 1) // flag = 1 for non-null
  } else {
    view.setBigUint64(40, 0n, true)
    view.setUint32(48, 0, true)
    view.setUint8(56, 0) // flag = 0 for null
  }

  // age: offset 56 (u32)
  view.setUint32(56, data.age, true)

  // optional_age: offset 60 (?u32)
  if (data.optional_age !== null) {
    view.setUint32(60, data.optional_age, true)
    view.setUint8(64, 1) // flag = 1 for non-null
  } else {
    view.setUint32(60, 0, true)
    view.setUint8(64, 0) // flag = 0 for null
  }

  // height: offset 68 (f32)
  view.setFloat32(68, data.height, true)

  // optional_height: offset 72 (?f32)
  if (data.optional_height !== null) {
    view.setFloat32(72, data.optional_height, true)
    view.setUint8(76, 1) // flag = 1 for non-null
  } else {
    view.setFloat32(72, 0, true)
    view.setUint8(76, 0) // flag = 0 for null
  }

  return buffer
}

console.log("=== Testing Manual Packing with Zig Unpacking ===\n")

// Test data with mixed null/non-null optionals
const testData = {
  age: 30,
  optional_age: null,
  height: 175.5,
  optional_height: 180.0,
  weight: 70.2,
  optional_weight: null,
  name: "Alice",
  optional_name: null,
}

console.log("Test data:", testData)

const buffer = packPersonWithOptional(testData)
console.log("Packed buffer size:", buffer.byteLength, "bytes")

// Print raw bytes for comparison
console.log("\nRaw bytes we're sending:")
const bytes = new Uint8Array(buffer)
for (let i = 0; i < bytes.length; i++) {
  if (i % 16 === 0) console.log(`\n  ${i.toString(16).padStart(4, "0")}:`)
  process.stdout.write(`${bytes[i]?.toString(16).padStart(2, "0")} `)
}
console.log("\n")

// Import the native library to call unpackTest
const native = dlopen("libnative.dylib", {
  unpackTest: {
    args: ["ptr"],
    returns: "void",
  },
})

// Send to Zig for unpacking
console.log("Sending to Zig for unpacking...")
const unpackFn = native.symbols.unpackTest
if (unpackFn) {
  unpackFn(ptr(buffer))
}

console.log("\n=== Test with all non-null optionals ===")

const testDataAll = {
  age: 30,
  optional_age: 25,
  height: 175.5,
  optional_height: 180.0,
  weight: 70.2,
  optional_weight: 75.5,
  name: "Alice",
  optional_name: "Bob",
}

console.log("Test data:", testDataAll)

const bufferAll = packPersonWithOptional(testDataAll)
console.log("Packed buffer size:", bufferAll.byteLength, "bytes")

// Print raw bytes for comparison
console.log("\nRaw bytes we're sending:")
const bytesAll = new Uint8Array(bufferAll)
for (let i = 0; i < bytesAll.length; i++) {
  if (i % 16 === 0) console.log(`\n  ${i.toString(16).padStart(4, "0")}:`)
  process.stdout.write(`${bytesAll[i]?.toString(16).padStart(2, "0")} `)
}
console.log("\n")

// Send to Zig for unpacking
console.log("Sending to Zig for unpacking...")
native.symbols.unpackTest(ptr(bufferAll))
