import {
    InputControlKindOptions,
    InputDeviceKindOptions,
    MaterialModeOptions,
    MaterialPropertyKindOptions,
    ShaderLayoutKindOptions,
    ShaderStageOptions,
    ShaderUniformKindOptions,
} from "./index";

export enum ResourceKindOptions {
    Material = "material",
    Input = "input",
    Level = "level",
    Shader = "shader",
}

export type LevelResourceDefinition = {
    readonly name: string;
    readonly kind: ResourceKindOptions;
    readonly uri: string;
}

export type LevelResourcesDefinition = {
    readonly materials?: Iterable<LevelResourceDefinition>;
    readonly shaders?: Iterable<LevelResourceDefinition>;
    readonly textures?: Iterable<LevelResourceDefinition>;
    readonly fonts?: Iterable<LevelResourceDefinition>;
}

export type LevelDefinition = {
    readonly name: string;
    readonly kind: ResourceKindOptions;
    readonly resources: LevelResourcesDefinition;
}


// #region Shader Definition

export type ShaderUniformDefinition2 = {
    readonly name: string;
    readonly kind: ShaderUniformKindOptions;
}

export type ShaderGroupLayoutDefinition2 = {
    readonly name: string;
    readonly kind: ShaderLayoutKindOptions;
    readonly binding: number;
    readonly layout: Iterable<ShaderUniformDefinition2>;
}

export type ShaderGroupDefinition2 = {
    readonly name: string;
    readonly visibility: ShaderStageOptions;
    readonly binding: number;
    readonly layout: Iterable<ShaderGroupLayoutDefinition2>;
}

export type ShaderDefinition2 = {
    readonly name: string;
    readonly kind: ResourceKindOptions;
    readonly code: string;
    readonly base?: string;
    readonly uniforms?: Iterable<ShaderGroupDefinition2>;
}

// #endregion

// #region Material Definition
export type MaterialPropertyDefinition = {
    readonly name: string;
    readonly kind: MaterialPropertyKindOptions;
    readonly binding: number;
    readonly value: unknown;
}

export type MaterialTextureDefinition = {
    readonly name: string;
    readonly key: string;
}

export type MaterialDefinition = {
    readonly name: string;
    readonly kind: ResourceKindOptions;
    readonly base?: string;
    readonly mode?: MaterialModeOptions;
    readonly shader?: string;
    readonly properties?: Iterable<MaterialPropertyDefinition>;
    readonly textures?: Iterable<MaterialTextureDefinition>;
}
// #endregion


// #region Shader Definition
export enum ShaderDataKindOptions {
    Color = "color",
    Matrix = "matrix",
    Float = "float",
    Integer = "integer",
    Vector2 = "vector2",
    Vector3 = "vector3",
    Vector4 = "vector4",
}

export type ShaderUniformLayoutDefinition = {
    name: string;
    kind: ShaderDataKindOptions;
    binding: number;
}

export type ShaderUniformDefinition = {
    name: string;
    binding: number;
    visibility: ShaderStageOptions;
    layout: ShaderUniformLayoutDefinition[];
}

export type ShaderTextureDefinition = {
    name: string;
    binding: number;
    visibility: ShaderStageOptions;
}

export type ShaderBufferDefinition = {
    name: string;
    location: number;
    kind: ShaderDataKindOptions
}

export type ShaderDefinition = {
    name: string;
    kind: ResourceKindOptions;
    code: string;
    base?: string;
    uniforms?: ShaderUniformDefinition[];
    textures?: ShaderTextureDefinition[];
    buffers?: ShaderBufferDefinition[];
}
// #endregion

// #region Input Definition

export type InputMapActionBindingDefinition = {
    readonly device: InputDeviceKindOptions;
    readonly values: Array<Array<string>>;
}

export type InputMapActionDefinition = {
    readonly name: string;
    readonly kind: InputControlKindOptions;
    readonly bindings: Iterable<InputMapActionBindingDefinition>;
}

export type InputMapDefinition = {
    readonly name: string;
    readonly actions: Iterable<InputMapActionDefinition>;
}

export type InputDefinition = {
    readonly name: string;
    readonly kind: ResourceKindOptions;
    readonly maps: Iterable<InputMapDefinition>;
}


// #endregion