import { expect, describe, it } from "bun:test"
import { defineEnum, defineStruct } from "../structs_ffi"

describe("packList", () => {
  it("should pack a list of simple structs into a single buffer", () => {
    const TestStruct = defineStruct([
      ["x", "f32"],
      ["y", "f32"],
    ] as const)

    const objects = [
      { x: 1.0, y: 2.0 },
      { x: 3.0, y: 4.0 },
      { x: 5.0, y: 6.0 },
    ]

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 3)

    const view = new DataView(buffer)
    expect(view.getFloat32(0, true)).toBeCloseTo(1.0)
    expect(view.getFloat32(4, true)).toBeCloseTo(2.0)
    expect(view.getFloat32(8, true)).toBeCloseTo(3.0)
    expect(view.getFloat32(12, true)).toBeCloseTo(4.0)
    expect(view.getFloat32(16, true)).toBeCloseTo(5.0)
    expect(view.getFloat32(20, true)).toBeCloseTo(6.0)
  })

  it("should pack an empty list into an empty buffer", () => {
    const TestStruct = defineStruct([
      ["value", "u32"],
      ["flag", "bool_u32"],
    ] as const)

    const buffer = TestStruct.packList([])

    expect(buffer.byteLength).toBe(0)
  })

  it("should pack a single item list", () => {
    const TestStruct = defineStruct([
      ["a", "u32"],
      ["b", "u32"],
    ] as const)

    const buffer = TestStruct.packList([{ a: 42, b: 84 }])

    expect(buffer.byteLength).toBe(TestStruct.size)

    const view = new DataView(buffer)
    expect(view.getUint32(0, true)).toBe(42)
    expect(view.getUint32(4, true)).toBe(84)
  })

  it("should pack structs with different primitive types", () => {
    const TestStruct = defineStruct([
      ["u8Val", "u8"],
      ["u32Val", "u32"],
      ["f64Val", "f64"],
    ] as const)

    const objects = [
      { u8Val: 255, u32Val: 0xdeadbeef, f64Val: 3.14159 },
      { u8Val: 128, u32Val: 0xcafebabe, f64Val: 2.71828 },
    ]

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 2)

    const view = new DataView(buffer)
    expect(view.getUint8(0)).toBe(255)
    expect(view.getUint32(4, true)).toBe(0xdeadbeef)
    expect(view.getFloat64(8, true)).toBeCloseTo(3.14159)
    expect(view.getUint8(TestStruct.size)).toBe(128)
    expect(view.getUint32(TestStruct.size + 4, true)).toBe(0xcafebabe)
    expect(view.getFloat64(TestStruct.size + 8, true)).toBeCloseTo(2.71828)
  })

  it("should pack structs with enums", () => {
    const ColorEnum = defineEnum({
      RED: 0,
      GREEN: 1,
      BLUE: 2,
    })

    const TestStruct = defineStruct([
      ["id", "u32"],
      ["color", ColorEnum],
    ] as const)

    const objects = [
      { id: 1, color: "RED" as const },
      { id: 2, color: "GREEN" as const },
      { id: 3, color: "BLUE" as const },
    ]

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 3)

    const view = new DataView(buffer)
    expect(view.getUint32(0, true)).toBe(1)
    expect(view.getUint32(4, true)).toBe(0)
    expect(view.getUint32(8, true)).toBe(2)
    expect(view.getUint32(12, true)).toBe(1)
    expect(view.getUint32(16, true)).toBe(3)
    expect(view.getUint32(20, true)).toBe(2)
  })

  it("should pack structs with nested inline structs", () => {
    const InnerStruct = defineStruct([
      ["x", "f32"],
      ["y", "f32"],
    ] as const)

    const OuterStruct = defineStruct([
      ["id", "u32"],
      ["position", InnerStruct],
    ] as const)

    const objects = [
      { id: 1, position: { x: 1.0, y: 2.0 } },
      { id: 2, position: { x: 3.0, y: 4.0 } },
    ]

    const buffer = OuterStruct.packList(objects)

    expect(buffer.byteLength).toBe(OuterStruct.size * 2)

    const view = new DataView(buffer)
    expect(view.getUint32(0, true)).toBe(1)
    expect(view.getFloat32(4, true)).toBeCloseTo(1.0)
    expect(view.getFloat32(8, true)).toBeCloseTo(2.0)
    expect(view.getUint32(12, true)).toBe(2)
    expect(view.getFloat32(16, true)).toBeCloseTo(3.0)
    expect(view.getFloat32(20, true)).toBeCloseTo(4.0)
  })

  it("should pack structs with optional fields using defaults", () => {
    const TestStruct = defineStruct([
      ["required", "u32"],
      ["optional", "u32", { optional: true, default: 42 }],
    ] as const)

    const objects = [{ required: 1 }, { required: 2, optional: 100 }, { required: 3 }]

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 3)

    const view = new DataView(buffer)
    expect(view.getUint32(0, true)).toBe(1)
    expect(view.getUint32(4, true)).toBe(42)
    expect(view.getUint32(8, true)).toBe(2)
    expect(view.getUint32(12, true)).toBe(100)
    expect(view.getUint32(16, true)).toBe(3)
    expect(view.getUint32(20, true)).toBe(42)
  })

  it("should apply mapValue transformation to each item", () => {
    const TestStruct = defineStruct([["value", "u32"]] as const, {
      mapValue: (input: { doubled: number }) => ({ value: input.doubled * 2 }),
    })

    const objects = [{ doubled: 10 }, { doubled: 20 }, { doubled: 30 }]

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 3)

    const view = new DataView(buffer)
    expect(view.getUint32(0, true)).toBe(20)
    expect(view.getUint32(4, true)).toBe(40)
    expect(view.getUint32(8, true)).toBe(60)
  })

  it("should validate each item in the list", () => {
    const TestStruct = defineStruct([
      [
        "value",
        "u32",
        {
          validate: (value, fieldName) => {
            if (value > 100) {
              throw new Error(`${fieldName} must be <= 100`)
            }
          },
        },
      ],
    ] as const)

    const validObjects = [{ value: 10 }, { value: 50 }, { value: 100 }]

    expect(() => TestStruct.packList(validObjects)).not.toThrow()

    const invalidObjects = [{ value: 10 }, { value: 150 }, { value: 50 }]

    expect(() => TestStruct.packList(invalidObjects)).toThrow("value must be <= 100")
  })

  it("should handle large lists efficiently", () => {
    const TestStruct = defineStruct([
      ["index", "u32"],
      ["value", "f64"],
    ] as const)

    const objects = Array.from({ length: 1000 }, (_, i) => ({
      index: i,
      value: Math.random() * 1000,
    }))

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 1000)

    const view = new DataView(buffer)
    for (let i = 0; i < 1000; i++) {
      const offset = i * TestStruct.size
      expect(view.getUint32(offset, true)).toBe(i)
    }
  })

  it("should pack structs with booleans", () => {
    const TestStruct = defineStruct([
      ["flag8", "bool_u8"],
      ["flag32", "bool_u32"],
    ] as const)

    const objects = [
      { flag8: true, flag32: false },
      { flag8: false, flag32: true },
      { flag8: true, flag32: true },
    ]

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 3)

    const view = new DataView(buffer)
    expect(view.getUint8(0)).toBe(1)
    expect(view.getUint32(4, true)).toBe(0)
    expect(view.getUint8(TestStruct.size)).toBe(0)
    expect(view.getUint32(TestStruct.size + 4, true)).toBe(1)
    expect(view.getUint8(TestStruct.size * 2)).toBe(1)
    expect(view.getUint32(TestStruct.size * 2 + 4, true)).toBe(1)
  })

  it("should pack complex structs with multiple nested levels", () => {
    const ColorStruct = defineStruct([
      ["r", "u8"],
      ["g", "u8"],
      ["b", "u8"],
      ["a", "u8"],
    ] as const)

    const ChunkStruct = defineStruct([
      ["text", "cstring"],
      ["fg", ColorStruct, { optional: true }],
      ["bg", ColorStruct, { optional: true }],
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
        text: "World",
        fg: { r: 0, g: 255, b: 0, a: 255 },
      },
    ]

    const buffer = ChunkStruct.packList(chunks)

    expect(buffer.byteLength).toBe(ChunkStruct.size * 2)
  })

  it("should pack structs with bigint values", () => {
    const TestStruct = defineStruct([
      ["id", "u32"],
      ["timestamp", "u64"],
    ] as const)

    const objects = [
      { id: 1, timestamp: 1234567890n },
      { id: 2, timestamp: 9876543210n },
      { id: 3, timestamp: 5555555555n },
    ]

    const buffer = TestStruct.packList(objects)

    expect(buffer.byteLength).toBe(TestStruct.size * 3)

    const view = new DataView(buffer)
    expect(view.getUint32(0, true)).toBe(1)
    expect(view.getBigUint64(8, true)).toBe(1234567890n)
    expect(view.getUint32(16, true)).toBe(2)
    expect(view.getBigUint64(24, true)).toBe(9876543210n)
    expect(view.getUint32(32, true)).toBe(3)
    expect(view.getBigUint64(40, true)).toBe(5555555555n)
  })

  it("should throw error for missing required fields in any item", () => {
    const TestStruct = defineStruct([
      ["required1", "u32"],
      ["required2", "u32"],
    ] as const)

    const objects = [{ required1: 1, required2: 2 }, { required1: 3 } as any, { required1: 4, required2: 5 }]

    expect(() => TestStruct.packList(objects)).toThrow(
      "Packing non-optional field 'required2' at index 1 but value is undefined",
    )
  })

  it("should be equivalent to manual loop with packInto", () => {
    const TestStruct = defineStruct([
      ["a", "u32"],
      ["b", "f32"],
    ] as const)

    const objects = [
      { a: 1, b: 1.5 },
      { a: 2, b: 2.5 },
      { a: 3, b: 3.5 },
    ]

    const bufferFromPackList = TestStruct.packList(objects)

    const bufferFromManual = new ArrayBuffer(TestStruct.size * objects.length)
    const view = new DataView(bufferFromManual)
    for (let i = 0; i < objects.length; i++) {
      TestStruct.packInto(objects[i]!, view, i * TestStruct.size)
    }

    expect(bufferFromPackList.byteLength).toBe(bufferFromManual.byteLength)

    const viewFromPackList = new Uint8Array(bufferFromPackList)
    const viewFromManual = new Uint8Array(bufferFromManual)

    for (let i = 0; i < viewFromPackList.length; i++) {
      expect(viewFromPackList[i]).toBe(viewFromManual[i])
    }
  })

  it("should work with pack options including validation hints", () => {
    let capturedHints: any[] = []

    const TestStruct = defineStruct([
      [
        "value",
        "u32",
        {
          validate: (value, fieldName, options) => {
            capturedHints.push(options.hints)
            if (options.hints?.strict && value === 0) {
              throw new Error("Zero not allowed in strict mode")
            }
          },
        },
      ],
    ] as const)

    const objects = [{ value: 1 }, { value: 2 }, { value: 3 }]

    capturedHints = []
    TestStruct.packList(objects, { validationHints: { strict: false } })

    expect(capturedHints).toHaveLength(3)
    expect(capturedHints.every((h) => h?.strict === false)).toBe(true)

    const objectsWithZero = [{ value: 0 }, { value: 1 }]

    expect(() => TestStruct.packList(objectsWithZero, { validationHints: { strict: true } })).toThrow(
      "Zero not allowed in strict mode",
    )
  })
})
