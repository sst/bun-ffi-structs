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
