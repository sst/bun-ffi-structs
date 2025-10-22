import { beforeAll, describe, expect, it } from "bun:test"
import { dlopen, ptr, toArrayBuffer } from "bun:ffi"
import { execSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"
import { defineStruct } from "../structs_ffi"

const testDir = __dirname
const libPath = join(testDir, "libtest.dylib")

let native: any

beforeAll(() => {
  console.log(`Building native library at ${libPath}...`)
  const zigFile = join(testDir, "test.zig")

  if (!existsSync(zigFile)) {
    throw new Error(`test.zig not found at ${zigFile}`)
  }

  execSync(`zig build-lib ${zigFile} -dynamic -femit-bin=${libPath}`, {
    cwd: testDir,
    stdio: "inherit",
  })

  if (!existsSync(libPath)) {
    throw new Error(`Failed to build native library at ${libPath}`)
  }

  console.log(`Native library built successfully`)

  native = dlopen(libPath, {
    createTestPerson1: {
      args: [],
      returns: "ptr",
    },
    createTestPerson2: {
      args: [],
      returns: "ptr",
    },
    createTestPerson3: {
      args: [],
      returns: "ptr",
    },
    validatePerson: {
      args: ["ptr", "u32", "i64", "f32", "f32", "f64", "f64", "u64", "u64"],
      returns: "bool",
    },
    getPersonAge: {
      args: ["ptr"],
      returns: "u32",
    },
    getPersonOptionalAge: {
      args: ["ptr"],
      returns: "i64",
    },
    getPersonHeight: {
      args: ["ptr"],
      returns: "f32",
    },
    getPersonWeight: {
      args: ["ptr"],
      returns: "f64",
    },
    getPersonNameLen: {
      args: ["ptr"],
      returns: "u64",
    },
  })
})

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

describe("useZigInternal flag with native Zig interop", () => {
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

  describe("TypeScript → Zig (pack then unpack by Zig)", () => {
    it("should pack data with mixed null/non-null optionals correctly for Zig", () => {
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
      expect(buffer.byteLength).toBe(PersonWithOptional.size)

      const isValid = native.symbols.validatePerson(ptr(buffer), 30, -1, 175.5, 180.0, 70.2, -1, 5, 0)
      expect(isValid).toBe(true)
    })

    it("should pack data with all non-null optionals correctly for Zig", () => {
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
      expect(buffer.byteLength).toBe(PersonWithOptional.size)

      const isValid = native.symbols.validatePerson(ptr(buffer), 30, 25, 175.5, 180.0, 70.2, 75.5, 5, 3)
      expect(isValid).toBe(true)
    })

    it("should pack data with all null optionals correctly for Zig", () => {
      const testData = {
        age: 42,
        optional_age: null,
        height: 160.0,
        optional_height: null,
        weight: 65.5,
        optional_weight: null,
        name: makeSlice("Charlie"),
        optional_name: null,
      }

      const buffer = PersonWithOptional.pack(testData)
      expect(buffer.byteLength).toBe(PersonWithOptional.size)

      const isValid = native.symbols.validatePerson(ptr(buffer), 42, -1, 160.0, -1, 65.5, -1, 7, 0)
      expect(isValid).toBe(true)
    })
  })

  describe("Zig → TypeScript (unpack Zig-created structs)", () => {
    it("should unpack Zig struct with mixed null/non-null optionals", () => {
      const zigPersonPtr = native.symbols.createTestPerson1()
      expect(zigPersonPtr).not.toBe(0n)

      const zigBuffer = toArrayBuffer(zigPersonPtr as any, 0, PersonWithOptional.size)
      const unpacked = PersonWithOptional.unpack(zigBuffer)

      expect(unpacked.age).toBe(30)
      expect(unpacked.optional_age).toBe(null)
      expect(unpacked.height).toBeCloseTo(175.5, 1)
      expect(unpacked.optional_height).toBeCloseTo(180.0, 1)
      expect(unpacked.weight).toBeCloseTo(70.2, 1)
      expect(unpacked.optional_weight).toBe(null)
      expect(Number(unpacked.name.len)).toBe(5)
      expect(unpacked.optional_name?.ptr).toBe(0)
      expect(Number(unpacked.optional_name?.len)).toBe(0)
    })

    it("should unpack Zig struct with all non-null optionals", () => {
      const zigPersonPtr = native.symbols.createTestPerson2()
      expect(zigPersonPtr).not.toBe(0n)

      const zigBuffer = toArrayBuffer(zigPersonPtr as any, 0, PersonWithOptional.size)
      const unpacked = PersonWithOptional.unpack(zigBuffer)

      expect(unpacked.age).toBe(30)
      expect(unpacked.optional_age).toBe(25)
      expect(unpacked.height).toBeCloseTo(175.5, 1)
      expect(unpacked.optional_height).toBeCloseTo(180.0, 1)
      expect(unpacked.weight).toBeCloseTo(70.2, 1)
      expect(unpacked.optional_weight).toBeCloseTo(75.5, 1)
      expect(Number(unpacked.name.len)).toBe(5)
      expect(Number(unpacked.optional_name?.len)).toBe(3)
    })

    it("should unpack Zig struct with all null optionals", () => {
      const zigPersonPtr = native.symbols.createTestPerson3()
      expect(zigPersonPtr).not.toBe(0n)

      const zigBuffer = toArrayBuffer(zigPersonPtr as any, 0, PersonWithOptional.size)
      const unpacked = PersonWithOptional.unpack(zigBuffer)

      expect(unpacked.age).toBe(42)
      expect(unpacked.optional_age).toBe(null)
      expect(unpacked.height).toBeCloseTo(160.0, 1)
      expect(unpacked.optional_height).toBe(null)
      expect(unpacked.weight).toBeCloseTo(65.5, 1)
      expect(unpacked.optional_weight).toBe(null)
      expect(Number(unpacked.name.len)).toBe(7)
      expect(unpacked.optional_name?.ptr).toBe(0)
      expect(Number(unpacked.optional_name?.len)).toBe(0)
    })
  })

  describe("Round-trip: TypeScript → Zig → TypeScript", () => {
    it("should preserve data through pack → Zig validation → unpack", () => {
      const originalData = {
        age: 33,
        optional_age: 28,
        height: 182.3,
        optional_height: 185.0,
        weight: 78.5,
        optional_weight: 80.0,
        name: makeSlice("David"),
        optional_name: makeSlice("Eve"),
      }

      const packed = PersonWithOptional.pack(originalData)

      const isValid = native.symbols.validatePerson(ptr(packed), 33, 28, 182.3, 185.0, 78.5, 80.0, 5, 3)
      expect(isValid).toBe(true)

      const unpacked = PersonWithOptional.unpack(packed)
      expect(unpacked.age).toBe(33)
      expect(unpacked.optional_age).toBe(28)
      expect(unpacked.height).toBeCloseTo(182.3, 1)
      expect(unpacked.optional_height).toBeCloseTo(185.0, 1)
      expect(unpacked.weight).toBeCloseTo(78.5, 1)
      expect(unpacked.optional_weight).toBeCloseTo(80.0, 1)
      expect(Number(unpacked.name.len)).toBe(5)
      expect(Number(unpacked.optional_name?.len)).toBe(3)
    })
  })
})
