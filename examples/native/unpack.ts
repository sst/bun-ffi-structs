import { ptr, toArrayBuffer } from "bun:ffi"
import { dlopen } from "bun:ffi"
import { defineStruct } from "../../src/structs_ffi"

const ZigSlice = defineStruct([
  ["ptr", "pointer"],
  ["len", "u64"],
])

function makeSlice(str: string | null) {
  if (str === null) {
    return { ptr: 0, len: 0 }
  }
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  return { ptr: ptr(bytes), len: bytes.length }
}

const PersonWithOptional = defineStruct(
  [
    ["weight", "f64"],
    ["optional_weight", "f64", { optional: true }],
    ["name", ZigSlice],
    ["optional_name", ZigSlice, { optional: true }],
    ["age", "u32"],
    ["optional_age", "u32", { optional: true }],
    ["height", "f32"],
    ["optional_height", "f32", { optional: true }],
  ],
  { useZigInternal: true },
)

console.log("=== Testing Manual Packing with Zig Unpacking ===\n")

// Test data with mixed null/non-null optionals
const testData = {
  age: 30,
  optional_age: null,
  height: 175.5,
  optional_height: 180.0,
  weight: 70.2,
  optional_weight: null,
  name: makeSlice("Alice"),
  optional_name: null,
}

console.log("Test data:", {
  age: testData.age,
  optional_age: testData.optional_age,
  height: testData.height,
  optional_height: testData.optional_height,
  weight: testData.weight,
  optional_weight: testData.optional_weight,
  name: "Alice",
  optional_name: testData.optional_name,
})

const buffer = PersonWithOptional.pack(testData)
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
  name: makeSlice("Alice"),
  optional_name: makeSlice("Bob"),
}

console.log("Test data:", {
  age: testDataAll.age,
  optional_age: testDataAll.optional_age,
  height: testDataAll.height,
  optional_height: testDataAll.optional_height,
  weight: testDataAll.weight,
  optional_weight: testDataAll.optional_weight,
  name: "Alice",
  optional_name: "Bob",
})

const bufferAll = PersonWithOptional.pack(testDataAll)
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

  const unpacked1 = PersonWithOptional.unpack(zigBuffer1)
  console.log("Unpacked by TypeScript:", {
    age: unpacked1.age,
    optional_age: unpacked1.optional_age,
    height: unpacked1.height,
    optional_height: unpacked1.optional_height,
    weight: unpacked1.weight,
    optional_weight: unpacked1.optional_weight,
    name: "Alice",
    optional_name: null,
  })
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

  const unpacked2 = PersonWithOptional.unpack(zigBuffer2)
  console.log("Unpacked by TypeScript:", {
    age: unpacked2.age,
    optional_age: unpacked2.optional_age,
    height: unpacked2.height,
    optional_height: unpacked2.optional_height,
    weight: unpacked2.weight,
    optional_weight: unpacked2.optional_weight,
    name: "Alice",
    optional_name: unpacked2.optional_name === null ? null : "Bob",
  })
}
