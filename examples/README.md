# bun-ffi-structs Examples

This directory contains standalone runnable examples demonstrating different features of the bun-ffi-structs library.

## Running Examples

Run any example with Bun:

```bash
bun run examples/01-basic-primitives.ts
```

Run all examples:

```bash
./examples/run-all.sh
```

## Limitations

- Unpacking arrays of structs is not yet implemented (see examples 09, 10)
- Unpacking arrays of primitives is not yet implemented (see example 04)
- Unpacking object pointers returns the raw pointer value, not the reconstructed object
