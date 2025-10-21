import { expect, describe, it } from "bun:test"
import { toArrayBuffer } from "bun:ffi"
import { defineStruct } from "../structs_ffi"

describe("string packing with graphemes and emojis", () => {
  it("should pack and unpack char* with byte length (not character count) for ASCII", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const testString = "Hello, World!"
    const packed = StringStruct.pack({ data: testString })
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked.length).toBe(BigInt(Buffer.byteLength(testString)))
    expect(unpacked.length).toBe(13n)
  })

  it("should pack and unpack char* with byte length for multi-byte UTF-8 characters", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const testString = "Café"
    const packed = StringStruct.pack({ data: testString })
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked.length).toBe(BigInt(Buffer.byteLength(testString)))
    expect(unpacked.length).toBe(5n)
    expect(testString.length).toBe(4)
  })

  it("should pack and unpack char* with byte length for emojis", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const testString = "Hello 🌍"
    const packed = StringStruct.pack({ data: testString })
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked.length).toBe(BigInt(Buffer.byteLength(testString)))
    expect(unpacked.length).toBe(10n)
    expect(testString.length).toBe(8)
  })

  it("should pack and unpack char* with byte length for multiple emojis", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const testString = "🌍🎉✨🚀"
    const packed = StringStruct.pack({ data: testString })
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked.length).toBe(BigInt(Buffer.byteLength(testString)))
    expect(unpacked.length).toBe(15n)
    expect(testString.length).toBe(7)
  })

  it("should pack and unpack char* with byte length for grapheme clusters", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const testString = "👨‍👩‍👧‍👦"
    const packed = StringStruct.pack({ data: testString })
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked.length).toBe(BigInt(Buffer.byteLength(testString)))
    expect(unpacked.length).toBe(25n)
  })

  it("should pack and unpack char* with byte length for combined diacritics", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const testString = "é"
    const testString2 = "e\u0301"
    const packed1 = StringStruct.pack({ data: testString })
    const packed2 = StringStruct.pack({ data: testString2 })
    const unpacked1 = StringStruct.unpack(packed1)
    const unpacked2 = StringStruct.unpack(packed2)

    expect(unpacked1.length).toBe(BigInt(Buffer.byteLength(testString)))
    expect(unpacked2.length).toBe(BigInt(Buffer.byteLength(testString2)))
    expect(unpacked1.length).toBe(2n)
    expect(unpacked2.length).toBe(3n)
  })

  it("should handle char* roundtrip with emojis using mapValue and reduceValue", () => {
    const StringStruct = defineStruct(
      [
        ["data", "char*"],
        ["length", "u64"],
      ] as const,
      {
        mapValue: (v: string) => ({
          data: v,
          length: Buffer.byteLength(v),
        }),
        reduceValue: (v: { data: number; length: bigint }) => {
          if (v.data === 0 || v.length === 0n) {
            return ""
          }
          // @ts-ignore - toArrayBuffer pointer type issue
          const buffer = toArrayBuffer(v.data, 0, Number(v.length))
          return new TextDecoder().decode(buffer)
        },
      },
    )

    const testString = "Hello, World! 🌍🎉✨"
    const packed = StringStruct.pack(testString)
    const unpacked = StringStruct.unpack(packed)

    expect(typeof unpacked).toBe("string")
    expect(unpacked).toBe(testString)
  })

  it("should handle char* with grapheme clusters in roundtrip", () => {
    const StringStruct = defineStruct(
      [
        ["data", "char*"],
        ["length", "u64"],
      ] as const,
      {
        mapValue: (v: string) => ({
          data: v,
          length: Buffer.byteLength(v),
        }),
        reduceValue: (v: { data: number; length: bigint }) => {
          if (v.data === 0 || v.length === 0n) {
            return ""
          }
          // @ts-ignore - toArrayBuffer pointer type issue
          const buffer = toArrayBuffer(v.data, 0, Number(v.length))
          return new TextDecoder().decode(buffer)
        },
      },
    )

    const testString = "👨‍👩‍👧‍👦🏳️‍🌈🇺🇸"
    const packed = StringStruct.pack(testString)
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked).toBe(testString)
  })

  it("should pack struct with multiple char* fields correctly", () => {
    const MultiStringStruct = defineStruct([
      ["field1", "char*"],
      ["length1", "u64", { lengthOf: "field1" }],
      ["field2", "char*"],
      ["length2", "u64", { lengthOf: "field2" }],
      ["field3", "char*"],
      ["length3", "u64", { lengthOf: "field3" }],
    ] as const)

    const packed = MultiStringStruct.pack({
      field1: "ASCII text",
      field2: "Emoji 🎉",
      field3: "Combined é",
    })
    const unpacked = MultiStringStruct.unpack(packed)

    expect(unpacked.length1).toBe(BigInt(Buffer.byteLength("ASCII text")))
    expect(unpacked.length2).toBe(BigInt(Buffer.byteLength("Emoji 🎉")))
    expect(unpacked.length3).toBe(BigInt(Buffer.byteLength("Combined é")))
  })

  it("should handle empty strings with char* and lengthOf", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const packed = StringStruct.pack({ data: "" })
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked.length).toBe(0n)
  })

  it("should handle null strings with char* and lengthOf", () => {
    const StringStruct = defineStruct([
      ["data", "char*", { optional: true }],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const packed = StringStruct.pack({ data: null })
    const unpacked = StringStruct.unpack(packed)

    expect(unpacked.length).toBe(0n)
  })

  it("should handle nested structs with char* and emojis", () => {
    const MessageStruct = defineStruct([
      ["content", "char*"],
      ["contentLength", "u64", { lengthOf: "content" }],
    ] as const)

    const ChatStruct = defineStruct([
      ["username", "cstring"],
      ["message", MessageStruct],
      ["timestamp", "u64"],
    ] as const)

    const packed = ChatStruct.pack({
      username: "Alice",
      message: {
        content: "Hello! 👋 How are you? 😊",
      },
      timestamp: 1234567890n,
    })
    const unpacked = ChatStruct.unpack(packed)

    expect(unpacked.message.contentLength).toBe(BigInt(Buffer.byteLength("Hello! 👋 How are you? 😊")))
    expect(unpacked.timestamp).toBe(1234567890n)
  })

  it("should pack multiple emoji strings with correct byte lengths", () => {
    const MultiStringStruct = defineStruct([
      ["str1", "char*"],
      ["len1", "u64", { lengthOf: "str1" }],
      ["str2", "char*"],
      ["len2", "u64", { lengthOf: "str2" }],
    ] as const)

    const packed = MultiStringStruct.pack({
      str1: "🌍",
      str2: "🎉",
    })
    const unpacked = MultiStringStruct.unpack(packed)

    expect(unpacked.len1).toBe(4n)
    expect(unpacked.len2).toBe(4n)
  })

  it("should verify byte length accuracy for complex unicode strings", () => {
    const StringStruct = defineStruct([
      ["data", "char*"],
      ["length", "u64", { lengthOf: "data" }],
    ] as const)

    const testCases = [
      { str: "Hello", expectedBytes: 5 },
      { str: "Café", expectedBytes: 5 },
      { str: "日本語", expectedBytes: 9 },
      { str: "🌍", expectedBytes: 4 },
      { str: "👨‍👩‍👧‍👦", expectedBytes: 25 },
      { str: "🏳️‍🌈", expectedBytes: 14 },
      { str: "Hello 🌍 World 🎉", expectedBytes: 21 },
    ]

    for (const { str, expectedBytes } of testCases) {
      const packed = StringStruct.pack({ data: str })
      const unpacked = StringStruct.unpack(packed)

      expect(unpacked.length).toBe(BigInt(expectedBytes))
      expect(Number(unpacked.length)).toBe(Buffer.byteLength(str))
    }
  })
})
