struct CameraUniform {
    position: vec4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct LightUniform {
    position: vec3<f32>,
    direction: vec3<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct ModelUniform {
    world: mat4x4<f32>,
    normal: mat4x4<f32>,
};

struct PropertiesUniform {
    color: vec4<f32>
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

// // material uniform
// @group(2) @binding(0)
// var<uniform> properties: PropertiesUniform;

struct VertexShaderInput {
  @location(0) position: vec3<f32>,
}

struct VertexShaderOutput {
  @builtin(position) position: vec4<f32>,
}

struct FragmentShaderOutput {
  @location(0) color: vec4f
}

@vertex
fn vertex_main(input: VertexShaderInput) -> VertexShaderOutput {
    var output: VertexShaderOutput;
    output.position = camera.projection * camera.view * model.world * vec4<f32>(input.position, 1.0);
    return output;
}

@fragment
fn fragment_main(input: VertexShaderOutput) -> FragmentShaderOutput {
    var output: FragmentShaderOutput;
    output.color = vec4<f32>(input.position.z, input.position.z, input.position.z, 1.0);
    return output;
}