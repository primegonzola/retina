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
    opacity: f32,
};

struct TextureUniform {
    offset: vec2<f32>,
    scale: vec2<f32>,
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
var main_atlas: texture_2d<f32>;

@group(2) @binding(3)
var main_atlas_sampler: sampler;

struct VertexShaderInput {
  @location(0) position: vec3<f32>,
  @location(1) texel: vec2<f32>,
  @location(2) normal: vec3<f32>
}

struct VertexShaderOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texel: vec2<f32>,
  @location(1) normal: vec3<f32> ,
  @location(2) wposition: vec3<f32>
}

struct FragmentShaderOutput {
  @location(0) color: vec4f
}

@vertex
fn vertex_main(input: VertexShaderInput) -> VertexShaderOutput {
    var output: VertexShaderOutput;
    output.texel = input.texel;
    output.normal = vec3<f32>(normalize(model.normal * vec4<f32>(input.normal, 1.0)).xyz);
    output.position = camera.projection * camera.view * model.world * vec4<f32>(input.position, 1.0);
    return output;
}

@fragment
fn fragment_main(input: VertexShaderOutput) -> FragmentShaderOutput {
  // declare output
    var output: FragmentShaderOutput;

  // transform texel coordinates
    var texel = vec2<f32>(
        input.texel.x * main_atlas_map.scale.x + main_atlas_map.offset.x,
        input.texel.y * main_atlas_map.scale.y + main_atlas_map.offset.y
    );

  // get albedo
    var albedo: vec4<f32> = textureSample(
        main_atlas,
        main_atlas_sampler,
        texel
    );

  // set output color
    output.color = vec4<f32>(albedo.rgb * properties.color.rgb, properties.opacity * albedo.a);
  
  // all done return output
    return output;
}