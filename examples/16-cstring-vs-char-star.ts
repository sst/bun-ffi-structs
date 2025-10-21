import { defineStruct } from "../src/structs_ffi"

console.log("=== Example 16: cstring vs char* ===\n")

const CStringStruct = defineStruct([
  ["id", "u32"],
  ["name", "cstring"],
] as const)

const CharStarStruct = defineStruct([
  ["id", "u32"],
  ["nameLength", "u32", { lengthOf: "nameData" }],
  ["nameData", "char*"],
] as const)

console.log("1. cstring (null-terminated):")
const cstringData = {
  id: 1,
  name: "hello",
}

const cstringPacked = CStringStruct.pack(cstringData)
console.log("  Input:", cstringData)
console.log("  Packed size:", cstringPacked.byteLength, "bytes")
console.log("  Automatically adds null terminator")

console.log("\n2. char* (length-prefixed):")
const charStarData = {
  id: 2,
  nameData: "world",
}

const charStarPacked = CharStarStruct.pack(charStarData)
console.log("  Input:", charStarData)
console.log("  Packed size:", charStarPacked.byteLength, "bytes")
console.log("  Length stored separately in nameLength field")

console.log("\n✓ Use cstring for null-terminated, char* for length-prefixed strings!")

process.exit(0)
