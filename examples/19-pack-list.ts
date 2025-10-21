import { defineStruct } from "../src/structs_ffi"

console.log("=== Example 19: packList for Efficient Batch Packing ===\n")

const RGBAStruct = defineStruct([
  ["r", "u8"],
  ["g", "u8"],
  ["b", "u8"],
  ["a", "u8"],
] as const)

const StyledChunkStruct = defineStruct([
  ["text", "cstring"],
  ["fg", RGBAStruct, { optional: true }],
  ["bg", RGBAStruct, { optional: true }],
  ["attributes", "u32", { optional: true, default: 0 }],
] as const)

const chunks = [
  {
    text: "Hello",
    fg: { r: 255, g: 0, b: 0, a: 255 },
    bg: { r: 0, g: 0, b: 0, a: 255 },
    attributes: 1,
  },
  {
    text: " World",
    fg: { r: 0, g: 255, b: 0, a: 255 },
    attributes: 0,
  },
  {
    text: "!",
    fg: { r: 0, g: 0, b: 255, a: 255 },
    bg: { r: 255, g: 255, b: 0, a: 255 },
  },
]

console.log("Packing 3 styled text chunks...\n")

const buffer = StyledChunkStruct.packList(chunks)

console.log("✓ Packed", chunks.length, "chunks into", buffer.byteLength, "bytes")
console.log("  Struct size:", StyledChunkStruct.size, "bytes")
console.log("  Expected size:", StyledChunkStruct.size * chunks.length, "bytes")

console.log("\nCompare packList vs manual loop:\n")

console.log("  OLD WAY (manual loop):")
console.log("  ```typescript")
console.log("  const buffer = new ArrayBuffer(StyledChunkStruct.size * chunks.length)")
console.log("  const view = new DataView(buffer)")
console.log("  for (let i = 0; i < chunks.length; i++) {")
console.log("    StyledChunkStruct.packInto(chunks[i], view, i * StyledChunkStruct.size)")
console.log("  }")
console.log("  ```")

console.log("\n  NEW WAY (packList):")
console.log("  ```typescript")
console.log("  const buffer = StyledChunkStruct.packList(chunks)")
console.log("  ```")

console.log("\n=== Another Example: Particle System ===\n")

const Vec3Struct = defineStruct([
  ["x", "f32"],
  ["y", "f32"],
  ["z", "f32"],
] as const)

const ParticleStruct = defineStruct([
  ["id", "u32"],
  ["position", Vec3Struct],
  ["velocity", Vec3Struct],
  ["lifetime", "f32", { default: 1.0 }],
] as const)

const particles = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  position: { x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 },
  velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
  lifetime: Math.random() * 5,
}))

const particleBuffer = ParticleStruct.packList(particles)

console.log("✓ Packed", particles.length, "particles into", particleBuffer.byteLength, "bytes")
console.log("  Struct size:", ParticleStruct.size, "bytes per particle")
console.log("  Average packing time: ~", (particleBuffer.byteLength / particles.length).toFixed(2), "bytes/particle")

console.log("\n=== Performance Benefits ===\n")
console.log("• Single buffer allocation instead of multiple allocations")
console.log("• Simpler, more readable code")
console.log("• Automatic validation for all items")
console.log("• Consistent with pack() and packInto() API")
console.log("• No manual offset calculations needed")
