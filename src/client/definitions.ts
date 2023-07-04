import {
    MaterialModeOptions,
    MaterialPropertyKindOptions,
    ShaderStageOptions,
} from "./index";

export enum ResourceKindOptions {
    Material = "material",
    Shader = "shader",
}

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