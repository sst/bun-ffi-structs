const std = @import("std");

pub const Person = extern struct {
    age: u32,
    height: f32,
    weight: f64,
    name: [*:0]const u8,
};

export fn get_age(person: *const Person) u32 {
    return person.age;
}

export fn get_height(person: *const Person) f32 {
    return person.height;
}

export fn get_weight(person: *const Person) f64 {
    return person.weight;
}

export fn get_name(person: *const Person) [*:0]const u8 {
    return person.name;
}

export fn calculate_bmi(person: *const Person) f32 {
    const height_m = person.height / 100.0;
    return @as(f32, @floatCast(person.weight / (height_m * height_m)));
}

// Test struct with optionals for unpacking
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

export fn unpackTest(ptr: *anyopaque) void {
    const person = @as(*const PersonWithOptional, @ptrCast(@alignCast(ptr)));

    std.debug.print("=== Zig Unpack Test Results ===\n", .{});
    std.debug.print("age: {}\n", .{person.age});
    std.debug.print("optional_age: {?}\n", .{person.optional_age});
    std.debug.print("height: {}\n", .{person.height});
    std.debug.print("optional_height: {?}\n", .{person.optional_height});
    std.debug.print("weight: {}\n", .{person.weight});
    std.debug.print("optional_weight: {?}\n", .{person.optional_weight});
    std.debug.print("name: {s}\n", .{person.name});
    std.debug.print("optional_name: {?s}\n", .{person.optional_name});

    // Print raw bytes for comparison
    const bytes = std.mem.asBytes(person);
    std.debug.print("\nRaw bytes received:\n", .{});
    for (bytes, 0..) |byte, i| {
        if (i % 16 == 0) std.debug.print("\n  {x:0>4}: ", .{i});
        std.debug.print("{x:0>2} ", .{byte});
    }
    std.debug.print("\n", .{});
}
