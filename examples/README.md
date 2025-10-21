# bun-ffi-structs Examples

This directory contains standalone runnable examples demonstrating different features of the bun-ffi-structs library.

## Running Examples

Run any example with Bun:

```bash
bun run examples/01-basic-primitives.ts
```

## Example Index

- **01-basic-primitives.ts** - All primitive types (u8, u16, u32, u64, f32, f64, bool_u32, etc.)
- **02-enums.ts** - Enum definitions with different base types
- **03-nested-structs.ts** - Inline nested struct composition
- **04-arrays.ts** - Arrays of primitives and enums with `lengthOf` fields
- **05-defaults-optional.ts** - Default values and optional fields
- **06-transforms.ts** - Struct-level `mapValue` and `reduceValue` transforms
- **07-validation.ts** - Field validation functions
- **08-alloc-struct.ts** - Pre-allocating structs with `allocStruct` and array sub-buffers
- **09-struct-arrays.ts** - Arrays of structs (packing only)
- **10-complex-webgpu.ts** - Complex WebGPU-style nested structures
- **11-object-pointers.ts** - Using `objectPtr<T>()` for objects with `.ptr` property
- **12-object-pointer-arrays.ts** - Arrays of object pointers
- **13-nested-as-pointer.ts** - Nested structs as separate allocations with `asPointer: true`
- **14-field-transforms.ts** - Field-level `packTransform` and `unpackTransform`
- **15-pack-into.ts** - Zero-copy writes with `packInto` at specific offsets
- **16-cstring-vs-char-star.ts** - Difference between null-terminated and length-prefixed strings
- **17-condition-fields.ts** - Conditional field inclusion with `condition` option

## Limitations

- Unpacking arrays of structs is not yet implemented (see examples 09, 10)
- Unpacking arrays of primitives is not yet implemented (see example 04)
- Unpacking object pointers returns the raw pointer value, not the reconstructed object
