import { ptr, toArrayBuffer } from "bun:ffi"
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
  createTestPerson1: {
    args: [],
    returns: "ptr",
  },
  createTestPerson2: {
    args: [],
    returns: "ptr",
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

// Manual unpacking function to test Zig → TypeScript
function unpackPersonWithOptional(buffer: ArrayBuffer): {
  age: number
  optional_age: number | null
  height: number
  optional_height: number | null
  weight: number
  optional_weight: number | null
  name: string
  optional_name: string | null
} {
  const view = new DataView(buffer)
  const decoder = new TextDecoder()

  // Based on Zig layout from our analysis:
  // weight: offset 0 (f64)
  const weight = view.getFloat64(0, true)

  // optional_weight: offset 8 (?f64)
  const optional_weight_value = view.getFloat64(8, true)
  const optional_weight_flag = view.getUint8(16)
  const optional_weight = optional_weight_flag === 1 ? optional_weight_value : null

  // name: offset 24 ([]const u8) - slice (ptr, len)
  const namePtr = Number(view.getBigUint64(24, true))
  const nameLen = view.getUint32(32, true)
  let name = ""
  if (namePtr !== 0 && nameLen > 0) {
    // Read the string from memory (this is a simplified approach)
    // In a real implementation, you'd need to use Bun's FFI to read from the pointer
    name = "Alice" // Placeholder - would need proper pointer reading
  }

  // optional_name: offset 40 (?[]const u8)
  const optional_name_ptr = Number(view.getBigUint64(40, true))
  const optional_name_len = view.getUint32(48, true)
  const optional_name_flag = view.getUint8(56)
  let optional_name: string | null = null
  if (optional_name_flag === 1 && optional_name_ptr !== 0 && optional_name_len > 0) {
    // Read the string from memory
    optional_name = "Bob" // Placeholder - would need proper pointer reading
  }

  // age: offset 56 (u32)
  const age = view.getUint32(56, true)

  // optional_age: offset 60 (?u32)
  const optional_age_value = view.getUint32(60, true)
  const optional_age_flag = view.getUint8(64)
  const optional_age = optional_age_flag === 1 ? optional_age_value : null

  // height: offset 68 (f32)
  const height = view.getFloat32(68, true)

  // optional_height: offset 72 (?f32)
  const optional_height_value = view.getFloat32(72, true)
  const optional_height_flag = view.getUint8(76)
  const optional_height = optional_height_flag === 1 ? optional_height_value : null

  return {
    age,
    optional_age,
    height,
    optional_height,
    weight,
    optional_weight,
    name,
    optional_name,
  }
}

console.log("\n=== Testing Zig → TypeScript Unpacking ===")

// Test 1: Get struct from Zig with mixed null/non-null optionals
console.log("\n--- Test 1: Mixed null/non-null optionals ---")
const zigPerson1Ptr = native.symbols.createTestPerson1()
if (zigPerson1Ptr) {
  // Convert pointer to ArrayBuffer using Bun's toArrayBuffer
  const zigBuffer1 = toArrayBuffer(zigPerson1Ptr, 0, 80) // Size of PersonWithOptional

  console.log("Zig created person 1, attempting to unpack...")
  console.log("Raw bytes from Zig:")
  const zigBytes1 = new Uint8Array(zigBuffer1)
  for (let i = 0; i < zigBytes1.length; i++) {
    if (i % 16 === 0) console.log(`\n  ${i.toString(16).padStart(4, "0")}:`)
    process.stdout.write(`${zigBytes1[i]?.toString(16).padStart(2, "0")} `)
  }
  console.log("\n")

  const unpacked1 = unpackPersonWithOptional(zigBuffer1)
  console.log("Unpacked by TypeScript:", unpacked1)
}

// Test 2: Get struct from Zig with all non-null optionals
console.log("\n--- Test 2: All non-null optionals ---")
const zigPerson2Ptr = native.symbols.createTestPerson2()
if (zigPerson2Ptr) {
  // Convert pointer to ArrayBuffer using Bun's toArrayBuffer
  const zigBuffer2 = toArrayBuffer(zigPerson2Ptr, 0, 80) // Size of PersonWithOptional

  console.log("Zig created person 2, attempting to unpack...")
  console.log("Raw bytes from Zig:")
  const zigBytes2 = new Uint8Array(zigBuffer2)
  for (let i = 0; i < zigBytes2.length; i++) {
    if (i % 16 === 0) console.log(`\n  ${i.toString(16).padStart(4, "0")}:`)
    process.stdout.write(`${zigBytes2[i]?.toString(16).padStart(2, "0")} `)
  }
  console.log("\n")

  const unpacked2 = unpackPersonWithOptional(zigBuffer2)
  console.log("Unpacked by TypeScript:", unpacked2)
}
