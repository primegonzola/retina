struct CameraUniform {
    position: vec4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct PointLightUniform {
    color: vec4<f32>,
    position: vec4<f32>,
    normal: vec4<f32>,
    options1: vec4<f32>,
    options2: vec4<f32>,
    options3: vec4<f32>,
};

struct Light {
    info: vec4<f32>,
    color: vec4<f32>,
    position: vec4<f32>,
    direction: vec4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    shadow: vec4<f32>,
    padding2: vec4<f32>,
    padding3: vec4<f32>,
    padding4: vec4<f32>,
}

struct LightUniform {
    color: vec4<f32>,
    position: vec4<f32>,
    direction: vec4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    pcount: vec4<f32>,
    points: array<PointLightUniform, RETINA_MAX_POINT_LIGHT_COUNT>,
};

struct LightInfo {
    counts: vec4<f32>,
    directionals: array<Light, RETINA_MAX_DIRECTIONAL_LIGHT_COUNT>,
    spots: array<Light, RETINA_MAX_SPOT_LIGHT_COUNT>,
    points: array<Light, RETINA_MAX_POINT_LIGHT_COUNT>,
    areas: array<Light, RETINA_MAX_AREA_LIGHT_COUNT>,
}

struct ModelUniform {
    world: mat4x4<f32>,
    normal: mat4x4<f32>,
};

struct PropertiesUniform {
    conditions: vec4<f32>,
    color: vec4<f32>,
    specular: vec4<f32>,
    opacity: f32,
};

struct TextureUniform {
    offset: vec2<f32>,
    scale: vec2<f32>,
};

struct LightContribution {
    ambient: vec3<f32>,
    diffuse: vec3<f32>,
    specular: vec3<f32>,
    shadow: f32
};

// camera uniform
@group(0) @binding(0)
var<uniform> camera: CameraUniform;

// model uniform
@group(1) @binding(0)
var<uniform> model: ModelUniform;

// material uniform
@group(2) @binding(0)
var<uniform> properties: PropertiesUniform;
@group(2) @binding(1)
var<uniform> albedo_map: TextureUniform;
@group(2) @binding(2)
var albedo_texture: texture_2d<f32>;
@group(2) @binding(3)
var albedo_sampler: sampler;

// light uniform
@group(3) @binding(0)
var<uniform> light: LightUniform;
@group(3) @binding(1)
var<uniform> info: LightInfo;
@group(3) @binding(2)
var shadow_sampler: sampler_comparison;
@group(3) @binding(3)
var shadow_directional_atlas: texture_depth_2d_array;
@group(3) @binding(4)
var shadow_textures: texture_depth_cube_array;

struct VertexShaderInput {
  @location(0) position: vec3<f32>,
  @location(1) texel: vec2<f32>,
  @location(2) normal: vec3<f32>
}

struct VertexShaderOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texel: vec2<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) wposition: vec3<f32>,
}

struct FragmentShaderOutput {
  @location(0) color: vec4f
}

//
// converter from [-1, 1] to [0, 1] with y being inverted
// nxy = sxy * vec2(0.5, -0.5) + vec2(0.5, 0.5)
// we only convert xy because we don't want z to change
//
const depth_map_convertor = mat4x4<f32>(0.5, 0.0, 0.0, 0.0, 0.0, -0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.5, 0.0, 1.0);
// const texUnitConverter = mat4x4<f32>(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

const screen_space_convertor = mat4x4<f32>(0.5, 0.0, 0.0, 0.0, 0.0, -0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.5, 0.0, 1.0);
// const texUnitConverter = mat4x4<f32>(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

@vertex
fn vertex_main(input: VertexShaderInput) -> VertexShaderOutput {
    var output: VertexShaderOutput;

    // precalculate world position
    let world = model.world * vec4<f32>(input.position.xyz, 1.0);
    let position = camera.projection * camera.view * world;

    // prepare output
    output.texel = input.texel;
    output.normal = normalize(model.normal * vec4<f32>(input.normal, 1.0)).xyz;
    output.position = position;
    output.wposition = world.xyz;

    // all done
    return output;
}

fn calculate_template(
    surface_position: vec3<f32>,
    surface_normal: vec3<f32>,
    surface_color: vec3<f32>,
    surface_texel: vec2<f32>,
    view_position: vec3<f32>,
    view_direction: vec3<f32>,
    light_position: vec3<f32>,
    light_direction: vec3<f32>,
    light_color: vec3<f32>,
) -> f32 {
    return 0.0;
}

// 
// calculate the directional shadow component suing provided light and shadow atlas
//
// resouces: 
// https://learn.microsoft.com/en-us/windows/win32/dxtecharts/common-techniques-to-improve-shadow-depth-maps
// https://github.com/walbourn/directx-sdk-samples/blob/main/CascadedShadowMaps11/CascadedShadowsManager.cpp
// https://github.com/JoeyDeVries/LearnOpenGL/blob/master/src/8.guest/2021/2.csm/10.shadow_mapping.fs
fn calculate_directional_shadow_component(
    shadow_atlas: texture_depth_2d_array,
    shadow_sampler: sampler_comparison,
    shadow_index: i32,
    shadow_position: vec3<f32>,
    shadow_offset: f32,
    shadow_samples: f32,
    shadow_bias: f32,
    surface_normal: vec3<f32>,
    light_direction: vec3<f32>,
) -> f32 {
    //
    // Percentage-closer filtering. Sample texels in the region
    // to smooth the result.
    //
    var cb = max(0.05 * (1.0 - dot(surface_normal, -light_direction)), shadow_bias);
    var shadow_amount = 0.0;
    var shadow_dimensions = textureDimensions(shadow_atlas, 0);

    var offset = shadow_offset;
    var samples = shadow_samples;

    for (var x = -offset; x < offset; x += offset / (samples * 0.5)) {
        for (var y = -offset; y < offset; y += offset / (samples * 0.5)) {
            let offset = vec2<f32>(vec2(x, y)) / vec2<f32>(shadow_dimensions);
            shadow_amount += textureSampleCompare(
                shadow_atlas,
                shadow_sampler,
                shadow_position.xy + offset,
                shadow_index,
                shadow_position.z - cb,
            );
        }
    }

    // calculate average
    shadow_amount /= (samples * samples);

    // all done
    return shadow_amount;
}

fn calculate_point_shadow_visibility(
    shadow_map: texture_depth_cube_array,
    shadow_sampler: sampler_comparison,
    shadow_position: vec3<f32>,
    light_position: vec3<f32>,
    index: i32,
    near_plane: f32,
    far_plane: f32
) -> f32 {
    //
    // Percentage-closer filtering. Sample texels in the region
    // to smooth the result.
    //
    var bias = 0.002; //max(0.05 * (1.0 - dot(normal, -direction)), 0.007);
    var visibility = 0.0;
    var shadow_dimensions = textureDimensions(shadow_map, 0);
    var length = length(shadow_position - light_position) / (far_plane + (0.5 * near_plane));
    var direction = normalize(shadow_position - light_position);

    // take center pixel and 8 surrounding pixels
    //
    // visibity = textureSampleCompare(
    //     shadow_map,
    //     shadow_sampler,
    //     direction,
    //     index,
    //     length - bias,
    // );

    var samples = 4.0;
    var offset = 0.1;
    for (var x = -offset; x < offset; x += offset / (samples * 0.5)) {
        for (var y = -offset; y < offset; y += offset / (samples * 0.5)) {
            for (var z = -offset; z < offset; z += offset / (samples * 0.5)) {
                visibility = visibility + textureSampleCompare(
                    shadow_map,
                    shadow_sampler,
                    normalize(direction + vec3(x, y, z)),
                    index,
                    length - bias,
                );
            }
        }
    }
    // calculate average 
    visibility /= (samples * samples * samples);

    // done
    return visibility;
}

fn calculate_attenuation(
    surface_position: vec3<f32>,
    light_position: vec3<f32>,
    radius: f32,
    light_constant: f32,
    light_linear: f32,
    light_quadratic: f32
) -> f32 {

    // get distance
    var distance = length(surface_position - light_position);

    // see if radius enabled or not
    if radius > 0.0 {
        if distance > radius {
            return 0.0;
        } else {
            return 1.0;
        }
    }
    
    // do the constant, linear, quadratic attenuation
    return 1.0 / (light_constant + light_linear * distance + light_quadratic * (distance * distance));
}

fn calculate_specular_intensity(
    view_direction: vec3<f32>,
    surface_normal: vec3<f32>,
    light_direction: vec3<f32>,
    metallic_shininess: f32
) -> f32 {
    // specular reflection is pretty basic to implement
    // 1. take the light direction
    // 2. reflect it around the surface normal
    // 3. compare it to the view direction with dot product and result in a value [0.0;1.0]
    // 4. use that factor to power it along with a metallic shininess constant 

    // check for early bail out
    if metallic_shininess == 0.0 {
        return 0.0;
    }

    // get reflection direction
    var reflect_direction = reflect(light_direction, surface_normal);
    
    // calulate specular intensity
    var specular_intensity = pow(max(dot(-view_direction, reflect_direction), 0.0), metallic_shininess);

    // update specular component
    return specular_intensity;
}

fn calculate_directional_component(surface_normal: vec3<f32>, light_direction: vec3<f32>) -> f32 {
    //
    // calculate the dot product between the surface normal and the inverted light direction
    // if co aligned the dot will be 1.0, 
    // if perpendicular the dot will be 0.0, 
    // if opposite the dot will be -1.0
    //
    return max(dot(surface_normal, -light_direction), 0.0);
}

fn calculate_directional_contribution(
    light: Light,
    shadow_atlas: texture_depth_2d_array,
    surface_position: vec3<f32>,
    surface_normal: vec3<f32>,
    view_direction: vec3<f32>,
) -> LightContribution {

    // final result
    var contribution: LightContribution;

    // calculate the diffuse component
    var diffuse = calculate_directional_component(
        surface_normal,
        light.direction.xyz
    );

    // save final diffuse component
    contribution.diffuse = light.color.rgb * diffuse;

    // calculate shadow position
    var shadow_position = screen_space_convertor * light.projection * light.view * vec4(surface_position.xyz, 1.0);
    shadow_position = shadow_position / shadow_position.w;

    // calculate the shadow component
    contribution.shadow = calculate_directional_shadow_component(
        shadow_atlas,
        shadow_sampler,
        i32(light.shadow.x),
        shadow_position.xyz,
        0.1,
        4.0,
        0.002,
        surface_normal,
        light.direction.xyz
    );
    // all done
    return contribution;
}

fn calculate_directional_contributions(
    lights: array<Light, RETINA_MAX_DIRECTIONAL_LIGHT_COUNT>,
    shadow_atlas: texture_depth_2d_array,
    count: i32,
    surface_position: vec3<f32>,
    surface_normal: vec3<f32>,
    view_direction: vec3<f32>,
) -> LightContribution {

    // init 
    var contribution = LightContribution(
        vec3<f32>(0.0, 0.0, 0.0),
        vec3<f32>(0.0, 0.0, 0.0),
        vec3<f32>(0.0, 0.0, 0.0),
        0.0
    );

    // loop over directional lights
    for (var i = 0; i < count; i++) {

        // get light
        var light = info.directionals[i];

        // calculate contibution
        var cb = calculate_directional_contribution(
            light,
            shadow_atlas,
            surface_position,
            surface_normal,
            view_direction
        );

        // add
        contribution.ambient = contribution.ambient + cb.ambient;
        contribution.diffuse = contribution.diffuse + cb.diffuse;
        contribution.specular = contribution.specular + cb.specular;
        contribution.shadow = contribution.shadow + cb.shadow;
    }

    // take average and return
    return LightContribution(
        contribution.ambient / f32(count),
        contribution.diffuse / f32(count),
        contribution.specular / f32(count),
        contribution.shadow / f32(count)
    );
}  

// <shader-condition name="lighting" type="bool" value="true" />
@fragment
fn fragment_main(input: VertexShaderOutput) -> FragmentShaderOutput {

    // final output to be returned
    var output: FragmentShaderOutput;

    // transform texel coordinates
    var texel = input.texel * albedo_map.scale + albedo_map.offset;

    // get albedo
    var albedo: vec4<f32> = textureSample(albedo_texture, albedo_sampler, texel);

    // calculate dot between light direction and normal
    var surface_position = input.wposition;
    var light_direction = normalize(light.direction.xyz);
    var surface_normal = normalize(input.normal);
    var view_direction = normalize(surface_position - camera.position.xyz);

    // calculate directional contributions
    var directional_contribution = calculate_directional_contributions(
        info.directionals,
        shadow_directional_atlas,
        i32(info.counts.x),
        surface_position,
        surface_normal,
        view_direction
    );

    // // assume no shadow visibility
    // var directional_shadow_visibility = 1.0;
    // var point_shadow_visibility = 0.0;

    //     // get shadow position etc
    // var shadow_position = vec3<f32>(input.sposition.xyz / input.sposition.w);
        
    //     // calculate the actual shadow visibility
    // directional_shadow_visibility = calculate_directional_shadow_visibility(
    //     shadow_texture,
    //     shadow_sampler,
    //     shadow_position,
    // );

    // // assume no light
    // var ambient_factor = 0.2;
    // var ambient = vec3<f32>(ambient_factor, ambient_factor, ambient_factor);
    // var diffuse = vec3<f32>(0.0, 0.0, 0.0);
    // var specular = vec3<f32>(0.0, 0.0, 0.0);

    //     // calculate direction amount
    // var directional_amount = max(dot(surface_normal, -light_direction), 0.0);
    
    //     // light color white
    // var light_color = light.color.rgb;
    // var light_count = i32(light.pcount.x);

    //     // update diffuse
    // diffuse = light_color * directional_amount * 0.3;

    //     // override diffuse
    // if light_count > 0 {
    //     diffuse = vec3<f32>(0.0, 0.0, 0.0);
    // }

    //     // // calculate specular intensity
    //     // var specular_intensity = calculate_specular_intensity(
    //     //     view_direction,
    //     //     surface_normal,
    //     //     light_direction,
    //     //     properties.specular.a
    //     // );

    //     // // update specular component
    //     // specular = properties.specular.rgb * specular_intensity;

    // var intdif = vec3(0.0, 0.0, 0.0);
    //     // loop over point lights
    // for (var i = 0; i < light_count; i++) {
                
    //     // get point light
    //     var point_light = light.points[i];

    //     var light_position = point_light.position.xyz;

    //     var light_intensity = point_light.options1.x;
    //     var light_radius = point_light.options1.y;

    //     var light_constant = point_light.options2.x;
    //     var light_linear = point_light.options2.y;
    //     var light_quadratic = point_light.options2.z;

    //     var light_near = point_light.options3.x;
    //     var light_far = point_light.options3.y;

    //     // calculate light direction
    //     var light_direction = normalize(surface_position - point_light.position.xyz);
    
    //     // calculate distance
    //     var distance = length(surface_position - point_light.position.xyz);

    //     // calculate attenuation
    //     var attenuation = calculate_attenuation(
    //         surface_position,
    //         light_position,
    //         light_radius,
    //         light_constant,
    //         light_linear,
    //         light_quadratic
    //     );

    //     // calculate shadow visibility for point light
    //     point_shadow_visibility += calculate_point_shadow_visibility(
    //         shadow_textures,
    //         shadow_sampler,
    //         surface_position,
    //         light_position,
    //         6 * i,
    //         light_near,
    //         light_far
    //     );

    //     // update diffuse light
    //     diffuse = diffuse + (point_light.color.rgb * attenuation * light_intensity);

    //         // // calculate specular intensity
    //         // var specular_intensity = calculate_specular_intensity(
    //         //     view_direction,
    //         //     surface_normal,
    //         //     light_direction,
    //         //     properties.specular.a
    //         // );
    
    //         // // update specular component
    //         // specular = specular + (point_light.color.rgb * specular_intensity * attenuation);
    // }

    //     // intdef
    // intdif = intdif / f32(light_count);

    // // take average of used lights
    // point_shadow_visibility = point_shadow_visibility / f32(light_count);
    
    // // get albedo
    // var albedo: vec4<f32> = textureSample(albedo_texture, albedo_sampler, texel);

    // // point_shadow_visibility = 1.0;
    // // directional_shadow_visibility = 0.4;
    // // final shadow 
    // var shadow_visibility = (directional_shadow_visibility + point_shadow_visibility) / 2.0;
    // // var shadow_visibility = max(directional_shadow_visibility, point_shadow_visibility);

    // shadow_visibility = directional_shadow_visibility;
    
    // final amount of light
    // var light = shadow_visibility * (ambient + diffuse + specular);

    // define the light
    var light = directional_contribution.shadow * (directional_contribution.ambient + directional_contribution.diffuse + directional_contribution.specular);

    // final output color
    output.color = vec4<f32>(
        light * properties.color.rgb * albedo.rgb,
        properties.opacity * albedo.a
    );

    // all done
    return output;
}