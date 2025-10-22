import { describe, expect, test } from "bun:test"
import { defineStruct } from "../structs_ffi"
import { ptr } from "bun:ffi"

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

describe("Zig Internal Optional Layout", () => {
  test("should match Zig struct size and offsets", () => {
    const description = PersonWithOptional.describe()

    expect(PersonWithOptional.size).toBe(80)
    expect(PersonWithOptional.align).toBe(8)

    const fieldsByName = new Map(description.map((f) => [f.name, f]))

    expect(fieldsByName.get("weight")?.offset).toBe(0)
    expect(fieldsByName.get("optional_weight")?.offset).toBe(8)
    expect(fieldsByName.get("name")?.offset).toBe(24)
    expect(fieldsByName.get("optional_name")?.offset).toBe(40)
    expect(fieldsByName.get("age")?.offset).toBe(56)
    expect(fieldsByName.get("optional_age")?.offset).toBe(60)
    expect(fieldsByName.get("height")?.offset).toBe(68)
    expect(fieldsByName.get("optional_height")?.offset).toBe(72)
  })

  test("should pack mixed null/non-null optionals correctly", () => {
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

    const buffer = PersonWithOptional.pack(testData)
    expect(buffer.byteLength).toBe(80)

    const bytes = new Uint8Array(buffer)

    expect(bytes[16]).toBe(0)
    expect(bytes[64]).toBe(0)
    expect(bytes[76]).toBe(1)

    const view = new DataView(buffer)
    expect(view.getFloat64(0, true)).toBeCloseTo(70.2, 1)
    expect(view.getFloat64(8, true)).toBeCloseTo(0, 1)
    expect(view.getUint8(16)).toBe(0)

    expect(view.getUint32(56, true)).toBe(30)
    expect(view.getUint32(60, true)).toBe(0)
    expect(view.getUint8(64)).toBe(0)

    expect(view.getFloat32(68, true)).toBeCloseTo(175.5, 1)
    expect(view.getFloat32(72, true)).toBeCloseTo(180.0, 1)
    expect(view.getUint8(76)).toBe(1)
  })

  test("should pack all non-null optionals correctly", () => {
    const testData = {
      age: 30,
      optional_age: 25,
      height: 175.5,
      optional_height: 180.0,
      weight: 70.2,
      optional_weight: 75.5,
      name: makeSlice("Alice"),
      optional_name: makeSlice("Bob"),
    }

    const buffer = PersonWithOptional.pack(testData)
    expect(buffer.byteLength).toBe(80)

    const bytes = new Uint8Array(buffer)

    expect(bytes[16]).toBe(1)
    expect(bytes[64]).toBe(1)
    expect(bytes[76]).toBe(1)

    const view = new DataView(buffer)
    expect(view.getFloat64(0, true)).toBeCloseTo(70.2, 1)
    expect(view.getFloat64(8, true)).toBeCloseTo(75.5, 1)
    expect(view.getUint8(16)).toBe(1)

    expect(view.getUint32(56, true)).toBe(30)
    expect(view.getUint32(60, true)).toBe(25)
    expect(view.getUint8(64)).toBe(1)

    expect(view.getFloat32(68, true)).toBeCloseTo(175.5, 1)
    expect(view.getFloat32(72, true)).toBeCloseTo(180.0, 1)
    expect(view.getUint8(76)).toBe(1)
  })

  test("should unpack mixed null/non-null optionals correctly", () => {
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

    const buffer = PersonWithOptional.pack(testData)
    const unpacked = PersonWithOptional.unpack(buffer)

    expect(unpacked.age).toBe(30)
    expect(unpacked.optional_age).toBe(null)
    expect(unpacked.height).toBeCloseTo(175.5, 1)
    expect(unpacked.optional_height).toBeCloseTo(180.0, 1)
    expect(unpacked.weight).toBeCloseTo(70.2, 1)
    expect(unpacked.optional_weight).toBe(null)
  })

  test("should unpack all non-null optionals correctly", () => {
    const testData = {
      age: 30,
      optional_age: 25,
      height: 175.5,
      optional_height: 180.0,
      weight: 70.2,
      optional_weight: 75.5,
      name: makeSlice("Alice"),
      optional_name: makeSlice("Bob"),
    }

    const buffer = PersonWithOptional.pack(testData)
    const unpacked = PersonWithOptional.unpack(buffer)

    expect(unpacked.age).toBe(30)
    expect(unpacked.optional_age).toBe(25)
    expect(unpacked.height).toBeCloseTo(175.5, 1)
    expect(unpacked.optional_height).toBeCloseTo(180.0, 1)
    expect(unpacked.weight).toBeCloseTo(70.2, 1)
    expect(unpacked.optional_weight).toBeCloseTo(75.5, 1)
  })

  test("should handle packList with zig optionals", () => {
    const testData = [
      {
        age: 30,
        optional_age: null,
        height: 175.5,
        optional_height: 180.0,
        weight: 70.2,
        optional_weight: null,
        name: makeSlice("Alice"),
        optional_name: null,
      },
      {
        age: 25,
        optional_age: 20,
        height: 165.0,
        optional_height: 170.0,
        weight: 60.0,
        optional_weight: 65.0,
        name: makeSlice("Bob"),
        optional_name: makeSlice("Charlie"),
      },
    ]

    const buffer = PersonWithOptional.packList(testData)
    expect(buffer.byteLength).toBe(160)

    const unpacked = PersonWithOptional.unpackList(buffer, 2)
    expect(unpacked.length).toBe(2)

    expect(unpacked[0]?.age).toBe(30)
    expect(unpacked[0]?.optional_age).toBe(null)
    expect(unpacked[0]?.optional_weight).toBe(null)

    expect(unpacked[1]?.age).toBe(25)
    expect(unpacked[1]?.optional_age).toBe(20)
    expect(unpacked[1]?.optional_weight).toBeCloseTo(65.0, 1)
  })
})
