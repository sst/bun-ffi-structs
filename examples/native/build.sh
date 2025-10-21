#!/bin/bash

# Build the Zig dynamic library
zig build-lib lib.zig -dynamic -femit-bin=libnative.dylib

echo "Built libnative.dylib"