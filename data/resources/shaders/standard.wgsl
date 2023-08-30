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
    components: vec4<f32>,
    lighting: vec4<f32>,
    shadowing: vec4<f32>,
    sampling: vec4<f32>,
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
    lights: vec4<f32>,
    shadows: vec4<f32>,
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
    color: vec4<f32>,
    specular: vec4<f32>,
    textures: vec4<f32>,
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
var<uniform> main_atlas_map: TextureUniform;

@group(2) @binding(2)
var main_atlas: texture_2d_array<f32>;

@group(2) @binding(3)
var main_atlas_sampler: sampler;

// light uniform
@group(3) @binding(0)
var<uniform> lighting: LightInfo;

@group(3) @binding(1)
var shadow_sampler: sampler_comparison;

@group(3) @binding(2)
var shadow_directional_atlas: texture_depth_2d_array;

@group(3) @binding(3)
var shadow_textures: texture_depth_cube_array;

struct VertexShaderInput {
    @location(0) position: vec3<f32>,
    @location(1) texel: vec2<f32>,
    @location(2) normal: vec3<f32>,
    @location(3) tangent: vec3<f32>
}

struct VertexShaderOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texel: vec2<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) tangent: vec3<f32>,
    @location(3) wposition: vec3<f32>,
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
    output.normal = normalize(model.normal * vec4<f32>(input.normal, 0.0)).xyz;
    output.tangent = normalize(model.normal * vec4<f32>(input.tangent, 0.0)).xyz;
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

fn calculate_directional_component(surface_normal: vec3<f32>, light_direction: vec3<f32>) -> f32 {
    //
    // calculate the dot product between the surface normal and the inverted light direction
    // if co aligned the dot will be 1.0, 
    // if perpendicular the dot will be 0.0, 
    // if opposite the dot will be -1.0
    //
    return max(dot(surface_normal, -light_direction), 0.0);
}

fn calculate_specular_component(
    surface_normal: vec3<f32>,
    light_direction: vec3<f32>,
    view_direction: vec3<f32>,
    shininess: f32,
) -> f32 {

    // default
    var specular_intensity = 0.0;

    // check if needed
    if shininess > 0.0 {
        //
        // 1. take the light direction
        // 2. reflect it around the surface normal
        // 3. compare it to the view direction with dot product and result in a value [0.0;1.0]
        // 4. use that factor to power it along with a metallic shininess constant 
        //
        var metallic_shininess = shininess;

        // get reflection direction
        var reflect_direction = reflect(light_direction, surface_normal);
            
        // calulate specular intensity
        specular_intensity = pow(max(dot(-view_direction, reflect_direction), 0.0), metallic_shininess);
    }

    // all done
    return specular_intensity;
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
                shadow_position.z - shadow_bias,
            );
        }
    }

    // calculate average
    shadow_amount /= (samples * samples);

    // all done
    return shadow_amount;
}

fn calculate_directional_contribution(
    light: Light,
    shadow_atlas: texture_depth_2d_array,
    surface_position_: vec3<f32>,
    surface_texel: vec2<f32>,
    surface_normal_: vec3<f32>,
    surface_tangent_: vec3<f32>,
    view_position_: vec3<f32>,
) -> LightContribution {

    // final result
    var contribution: LightContribution;

    // calculate
    var surface_position = surface_position_;
    var surface_normal = surface_normal_;
    var view_position = view_position_;
    var view_direction = normalize(surface_position - view_position);
    // var light_direction = normalize(surface_position - light.position.xyz);
    var light_direction = light.direction.xyz;

    // check if normal mapping is enabled
    if properties.textures.z >= 0.0 {

        // calculate TBN matrix components
        var N = surface_normal_;
        var T = surface_tangent_;
        T = normalize(T - dot(T, N) * N);
        var B = cross(N, T);
        
        // construct TBN
        var tbn = transpose(mat3x3<f32>(T, B, N));

        // update view, normal and light direction
        surface_position = tbn * surface_position;
        view_position = tbn * view_position;

        // look up normal
        surface_normal = textureSample(
            main_atlas,
            main_atlas_sampler,
            surface_texel,
            i32(properties.textures.z)
        ).xyz;

        // transform normal vector to range [-1,1]  
        surface_normal = normalize(surface_normal * 2.0 - 1.0);
    }

    // calculate the diffuse component
    var diffuse = calculate_directional_component(
        surface_normal,
        light_direction
    );

    // save final diffuse component
    contribution.diffuse = light.color.rgb * diffuse;

    // calculate the specular component
    var specular_component = calculate_specular_component(
        surface_normal,
        light_direction,
        view_direction,
        properties.specular.a,
    );

    // assume no albedo
    var specular_intensity = vec4(1.0, 1.0, 1.0, 1.0);

    // check if override is required
    if properties.textures.y >= 0.0 {
        
        // get and override albedo
        specular_intensity = textureSample(
            main_atlas,
            main_atlas_sampler,
            surface_texel,
            i32(properties.textures.y)
        );
    }

    // save final specular component
    contribution.specular = light.color.rgb * specular_component * specular_intensity.rgb;

    // calculate shadow position
    var shadow_position = screen_space_convertor * light.projection * light.view * vec4(surface_position_.xyz, 1.0);
    shadow_position = shadow_position / shadow_position.w;

    // calculate the shadow component
    contribution.shadow = calculate_directional_shadow_component(
        shadow_atlas,
        shadow_sampler,
        i32(light.sampling.x),
        shadow_position.xyz,
        light.sampling.y,
        light.sampling.z,
        light.sampling.w,
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
    surface_texel: vec2<f32>,
    surface_normal: vec3<f32>,
    surface_tangent: vec3<f32>,
    view_position: vec3<f32>,
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
        var light = lighting.directionals[i];

        // calculate contibution
        var cb = calculate_directional_contribution(
            light,
            shadow_atlas,
            surface_position,
            surface_texel,
            surface_normal,
            surface_tangent,
            view_position
        );

        // add
        contribution.ambient = contribution.ambient + cb.ambient;
        contribution.diffuse = contribution.diffuse + cb.diffuse;
        contribution.specular = contribution.specular + cb.specular;
        contribution.shadow = contribution.shadow + cb.shadow;
    }

    // take average and return
    return LightContribution(
        contribution.ambient,
        contribution.diffuse,
        contribution.specular,
        contribution.shadow / f32(count)
    );
}  

// <shader-condition name="lighting" type="bool" value="true" />
@fragment
fn fragment_main(input: VertexShaderOutput) -> FragmentShaderOutput {

    // final output to be returned
    var output: FragmentShaderOutput;

    // transform texel coordinates
    let surface_texel = input.texel * main_atlas_map.scale + main_atlas_map.offset;

    // assume no albedo
    var albedo = vec4(1.0, 1.0, 1.0, 1.0);

    // check if override is required
    if properties.textures.x >= 0.0 {
        
        // get and override albedo
        albedo = textureSample(
            main_atlas,
            main_atlas_sampler,
            surface_texel,
            i32(properties.textures.x)
        );
    }

    // calculate a number of common used values
    var surface_position = input.wposition;
    var surface_normal = normalize(input.normal);
    var surface_tangent = normalize(input.tangent);
    var view_position = camera.position.xyz;

    // calculate directional contributions
    let directional_contribution = calculate_directional_contributions(
        lighting.directionals,
        shadow_directional_atlas,
        i32(lighting.lights.x),
        surface_position,
        surface_texel,
        surface_normal,
        surface_tangent,
        view_position
    );

    // define the light
    let light = 2.0 * directional_contribution.shadow * (directional_contribution.ambient + directional_contribution.diffuse + directional_contribution.specular);

    // final output color
    output.color = vec4<f32>(
        light * properties.color.rgb * albedo.rgb,
        properties.opacity * albedo.a
    );

    // all done
    return output;
}