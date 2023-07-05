struct CameraUniform {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct ModelUniform {
    world: mat4x4<f32>,
    normal: mat4x4<f32>,
};

struct MaterialUniform {
    color: vec4<f32>,
    opacity: f32,
};

struct MaterialTexture {
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
var<uniform> material: MaterialUniform;

// textures uniform
@group(3) @binding(0)
var albedo_texture: texture_2d<f32>;
@group(3) @binding(1)
var albedo_sampler: sampler;

@group(4) @binding(0)
var<uniform> albedo_map: MaterialUniform;

struct VertexShaderInput {
  @location(0) position: vec3<f32>,
  @location(1) texel: vec2<f32>,
  @location(2) normal: vec3<f32>
}

struct VertexShaderOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) texel : vec2<f32>,
  @location(1) normal : vec3<f32> ,
  @location(2) wposition : vec3<f32>
}

struct FragmentShaderOutput {
  @location(0) color : vec4f
}

@vertex
fn vertex_main(input: VertexShaderInput) -> VertexShaderOutput
{
  var output : VertexShaderOutput;
  output.texel = input.texel;
  output.normal =  vec3<f32>(normalize(model.normal * vec4<f32>(input.normal, 1.0)).xyz);
  output.position = camera.projection * camera.view * model.world * vec4<f32>(input.position, 1.0);
  return output;
}

@fragment
fn fragment_main(input: VertexShaderOutput) -> FragmentShaderOutput
{
  var output : FragmentShaderOutput;

  // // transform texel coordinates
  // var texel = vec2<f32>(
  //   input.texel.x * albedo_map.scale.x + albedo_map.offset.x, 
  //   input.texel.y * albedo_map.scale.y + albedo_map.offset.y);

  // get albedo
  var albedo : vec4<f32> = textureSample(albedo_texture, albedo_sampler, input.texel);

  var color = albedo;
  output.color = vec4<f32>(color.rgb * material.color.rgb, material.opacity * color.a);
  return output;
}