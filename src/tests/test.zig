const std = @import("std");

pub const PersonWithOptional = struct {
    weight: f64,
    optional_weight: ?f64,
    name: []const u8,
    optional_name: ?[]const u8,
    age: u32,
    optional_age: ?u32,
    height: f32,
    optional_height: ?f32,
};

var test_person_1: PersonWithOptional = undefined;
var test_person_2: PersonWithOptional = undefined;
var test_person_3: PersonWithOptional = undefined;

export fn createTestPerson1() *anyopaque {
    test_person_1 = PersonWithOptional{
        .age = 30,
        .optional_age = null,
        .height = 175.5,
        .optional_height = 180.0,
        .weight = 70.2,
        .optional_weight = null,
        .name = "Alice",
        .optional_name = null,
    };

    return @as(*anyopaque, @ptrCast(&test_person_1));
}

export fn createTestPerson2() *anyopaque {
    test_person_2 = PersonWithOptional{
        .age = 30,
        .optional_age = 25,
        .height = 175.5,
        .optional_height = 180.0,
        .weight = 70.2,
        .optional_weight = 75.5,
        .name = "Alice",
        .optional_name = "Bob",
    };

    return @as(*anyopaque, @ptrCast(&test_person_2));
}

export fn createTestPerson3() *anyopaque {
    test_person_3 = PersonWithOptional{
        .age = 42,
        .optional_age = null,
        .height = 160.0,
        .optional_height = null,
        .weight = 65.5,
        .optional_weight = null,
        .name = "Charlie",
        .optional_name = null,
    };

    return @as(*anyopaque, @ptrCast(&test_person_3));
}

export fn validatePerson(ptr: *anyopaque, expected_age: u32, expected_optional_age: i64, expected_height: f32, expected_optional_height: f32, expected_weight: f64, expected_optional_weight: f64, expected_name_len: u64, expected_optional_name_len: u64) bool {
    const person = @as(*const PersonWithOptional, @ptrCast(@alignCast(ptr)));

    if (person.age != expected_age) return false;

    if (expected_optional_age == -1) {
        if (person.optional_age != null) return false;
    } else {
        if (person.optional_age) |opt_age| {
            if (opt_age != @as(u32, @intCast(expected_optional_age))) return false;
        } else {
            return false;
        }
    }

    const height_match = @abs(person.height - expected_height) < 0.01;
    if (!height_match) return false;

    if (expected_optional_height == -1) {
        if (person.optional_height != null) return false;
    } else {
        if (person.optional_height) |opt_h| {
            if (@abs(opt_h - expected_optional_height) >= 0.01) return false;
        } else {
            return false;
        }
    }

    const weight_match = @abs(person.weight - expected_weight) < 0.01;
    if (!weight_match) return false;

    if (expected_optional_weight == -1) {
        if (person.optional_weight != null) return false;
    } else {
        if (person.optional_weight) |opt_w| {
            if (@abs(opt_w - expected_optional_weight) >= 0.01) return false;
        } else {
            return false;
        }
    }

    if (person.name.len != expected_name_len) return false;
    if (expected_optional_name_len > 0) {
        if (person.optional_name) |opt_name| {
            if (opt_name.len != expected_optional_name_len) return false;
        } else {
            return false;
        }
    } else {
        if (person.optional_name != null) return false;
    }

    return true;
}

export fn getPersonAge(ptr: *anyopaque) u32 {
    const person = @as(*const PersonWithOptional, @ptrCast(@alignCast(ptr)));
    return person.age;
}

export fn getPersonOptionalAge(ptr: *anyopaque) i64 {
    const person = @as(*const PersonWithOptional, @ptrCast(@alignCast(ptr)));
    if (person.optional_age) |age| {
        return @as(i64, @intCast(age));
    }
    return -1;
}

export fn getPersonHeight(ptr: *anyopaque) f32 {
    const person = @as(*const PersonWithOptional, @ptrCast(@alignCast(ptr)));
    return person.height;
}

export fn getPersonWeight(ptr: *anyopaque) f64 {
    const person = @as(*const PersonWithOptional, @ptrCast(@alignCast(ptr)));
    return person.weight;
}

export fn getPersonNameLen(ptr: *anyopaque) u64 {
    const person = @as(*const PersonWithOptional, @ptrCast(@alignCast(ptr)));
    return person.name.len;
}
