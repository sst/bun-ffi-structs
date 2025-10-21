const std = @import("std");

pub const Person = struct {
    age: u32,
    height: f32,
    weight: f64,
    name: []const u8,
};

pub const PersonWithOptional = struct {
    age: u32,
    optional_age: ?u32,
    height: f32,
    optional_height: ?f32,
    weight: f64,
    optional_weight: ?f64,
    name: []const u8,
    optional_name: ?[]const u8,
};

pub fn main() void {
    std.debug.print("=== Zig Internal Struct Layout ===\n\n", .{});

    std.debug.print("Regular Person:\n", .{});
    std.debug.print("  Size: {} bytes\n", .{@sizeOf(Person)});
    std.debug.print("  Alignment: {} bytes\n", .{@alignOf(Person)});
    std.debug.print("  Field offsets:\n", .{});
    std.debug.print("    age: {}\n", .{@offsetOf(Person, "age")});
    std.debug.print("    height: {}\n", .{@offsetOf(Person, "height")});
    std.debug.print("    weight: {}\n", .{@offsetOf(Person, "weight")});
    std.debug.print("    name: {}\n", .{@offsetOf(Person, "name")});

    std.debug.print("\nPersonWithOptional:\n", .{});
    std.debug.print("  Size: {} bytes\n", .{@sizeOf(PersonWithOptional)});
    std.debug.print("  Alignment: {} bytes\n", .{@alignOf(PersonWithOptional)});
    std.debug.print("  Field offsets:\n", .{});
    std.debug.print("    age: {}\n", .{@offsetOf(PersonWithOptional, "age")});
    std.debug.print("    optional_age: {}\n", .{@offsetOf(PersonWithOptional, "optional_age")});
    std.debug.print("    height: {}\n", .{@offsetOf(PersonWithOptional, "height")});
    std.debug.print("    optional_height: {}\n", .{@offsetOf(PersonWithOptional, "optional_height")});
    std.debug.print("    weight: {}\n", .{@offsetOf(PersonWithOptional, "weight")});
    std.debug.print("    optional_weight: {}\n", .{@offsetOf(PersonWithOptional, "optional_weight")});
    std.debug.print("    name: {}\n", .{@offsetOf(PersonWithOptional, "name")});
    std.debug.print("    optional_name: {}\n", .{@offsetOf(PersonWithOptional, "optional_name")});

    std.debug.print("\nSize difference: {} bytes\n", .{@sizeOf(PersonWithOptional) - @sizeOf(Person)});

    // Test with actual values
    const person = PersonWithOptional{
        .age = 30,
        .optional_age = null,
        .height = 175.5,
        .optional_height = 180.0,
        .weight = 70.2,
        .optional_weight = null,
        .name = "Alice",
        .optional_name = null,
    };

    std.debug.print("\nTest instance:\n", .{});
    std.debug.print("  age: {}\n", .{person.age});
    std.debug.print("  optional_age: {?}\n", .{person.optional_age});
    std.debug.print("  height: {}\n", .{person.height});
    std.debug.print("  optional_height: {?}\n", .{person.optional_height});
    std.debug.print("  weight: {}\n", .{person.weight});
    std.debug.print("  optional_weight: {?}\n", .{person.optional_weight});
    std.debug.print("  name: {s}\n", .{person.name});
    std.debug.print("  optional_name: {?s}\n", .{person.optional_name});

    // Print raw bytes
    std.debug.print("\n=== Raw Memory Layout ===\n", .{});
    const person_bytes = std.mem.asBytes(&person);
    std.debug.print("PersonWithOptional raw bytes ({} total):\n", .{person_bytes.len});
    for (person_bytes, 0..) |byte, i| {
        if (i % 16 == 0) std.debug.print("\n  {x:0>4}: ", .{i});
        std.debug.print("{x:0>2} ", .{byte});
    }
    std.debug.print("\n", .{});

    // Test with all non-null optionals
    const person_all = PersonWithOptional{
        .age = 30,
        .optional_age = 25,
        .height = 175.5,
        .optional_height = 180.0,
        .weight = 70.2,
        .optional_weight = 75.5,
        .name = "Alice",
        .optional_name = "Bob",
    };

    std.debug.print("\n=== All Non-Null Optionals ===\n", .{});
    const person_all_bytes = std.mem.asBytes(&person_all);
    std.debug.print("PersonWithOptional raw bytes ({} total):\n", .{person_all_bytes.len});
    for (person_all_bytes, 0..) |byte, i| {
        if (i % 16 == 0) std.debug.print("\n  {x:0>4}: ", .{i});
        std.debug.print("{x:0>2} ", .{byte});
    }
    std.debug.print("\n", .{});
}
