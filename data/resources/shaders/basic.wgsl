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


// camera uniform
@group(0) @binding(0)
var<uniform> camera: CameraUniform;

// model uniform
@group(1) @binding(0)
var<uniform> model: ModelUniform;

// material uniform
@group(2) @binding(0)
var<uniform> properties: PropertiesUniform;


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
//
// converter from [-1, 1] to [0, 1] with y being inverted
// nxy = sxy * vec2(0.5, -0.5) + vec2(0.5, 0.5)
// we only convert xy because we don't want z to change
const screen_space_convertor = mat4x4<f32>(0.5, 0.0, 0.0, 0.0, 0.0, -0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.5, 0.5, 0.0, 1.0);

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

    // precaculate
    var surface_normal = normalize(input.normal);
    var light_direction = normalize(vec3<f32>(0.0, 0.0, 1.0));

    // calculate directional component
    var light = max(dot(surface_normal, -light_direction), 0.0);

    // final output color
    output.color = vec4<f32>(
        light * properties.color.rgb,
        properties.opacity
    );

    // all done
    return output;
}