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

// lighting uniform
@group(3) @binding(0)
var<uniform> lighting: LightingUniform;


struct LightContribution {
    ambient: vec4<f32>,
    diffuse: vec4<f32>,
    specular: vec4<f32>,
    shadows: f32
}

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
    var light_direction = normalize(lighting.directionals[0].direction.xyz);
    var light_color = lighting.directionals[0].color;

    // define initial light contribution
    var contribution = LightContribution(
        vec4<f32>(0.0, 0.0, 0.0, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 0.0),
        0.0
    );

    // calculate directional component
    var directional_component = max(dot(surface_normal, -light_direction), 0.0);

    // update contribution
    contribution.ambient = light_color * properties.components.x;
    contribution.diffuse = light_color * properties.components.y * directional_component;
    contribution.specular = light_color * 0.0;

    // surface color is the sum of all contributions
    var surface_color = contribution.ambient + contribution.diffuse + contribution.specular;

    // final output color
    output.color = vec4<f32>(
        properties.color.rgb * surface_color.rgb,
        properties.color.a
    );

    // all done
    return output;
}