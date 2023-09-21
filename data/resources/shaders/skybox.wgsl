struct CameraUniform {
    position: vec4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct ModelUniform {
    world: mat4x4<f32>,
    normal: mat4x4<f32>,
};

struct PropertiesUniform {
    color: vec4<f32>,
    components: vec4<f32>,
    lighting: vec4<f32>,
    textures: vec4<f32>,
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

struct LightingUniform {
    lights: vec4<f32>,
    shadows: vec4<f32>,
    directionals: array<Light, RETINA_MAX_DIRECTIONAL_LIGHT_COUNT>,
    spots: array<Light, RETINA_MAX_SPOT_LIGHT_COUNT>,
    points: array<Light, RETINA_MAX_POINT_LIGHT_COUNT>,
    areas: array<Light, RETINA_MAX_AREA_LIGHT_COUNT>,
}

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
var albedo_atlas: texture_2d<f32>;

@group(2) @binding(2)
var albedo_atlas_sampler: sampler;

// lighting uniform
@group(3) @binding(0)
var<uniform> lighting: LightingUniform;

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

// <shader-condition name="lighting" type="bool" value="true" />
@fragment
fn fragment_main(input: VertexShaderOutput) -> FragmentShaderOutput {

    // final output to be returned
    var output: FragmentShaderOutput;

    // get albedo
    var albedo: vec4<f32> = textureSample(albedo_atlas, albedo_atlas_sampler, input.texel);

    // final output color
    output.color = vec4<f32>(
        properties.color.rgb * albedo.rgb,
        properties.color.a
    );

    // all done
    return output;
}