import {
    MaterialModeOptions,
    MaterialPropertyKindOptions,
    ShaderDataKindOptions,
    ShaderGroupBindingKindOptions,
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
    readonly uri: string | string[];
}

export type LevelColorResourceDefinition = {
    readonly name: string;
    readonly value: string;
}

export type LevelResourcesDefinition = {
    readonly colors?: Iterable<LevelColorResourceDefinition>;
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

export type ShaderUniformDefinition = {
    readonly name: string;
    readonly kind: ShaderUniformKindOptions;
}

export type ShaderGroupBindingDefinition = {
    readonly name: string;
    readonly kind: ShaderGroupBindingKindOptions;
    readonly index: number;
    readonly uniforms: Iterable<ShaderUniformDefinition>;
}

export type ShaderGroupDefinition = {
    readonly name: string;
    readonly visibility: ShaderStageOptions;
    readonly index: number;
    readonly bindings: Iterable<ShaderGroupBindingDefinition>;
}

export type ShaderBufferDefinition = {
    name: string;
    location: number;
    kind: ShaderDataKindOptions
}

export type ShaderDefinition = {
    readonly name: string;
    readonly kind: ResourceKindOptions;
    code: string;
    readonly base?: string;
    readonly groups: Iterable<ShaderGroupDefinition>;
    readonly buffers: Iterable<ShaderBufferDefinition>;
}

// #endregion

// #region Material Definition
export type MaterialPropertyDefinition = {
    readonly name: string;
    readonly kind: MaterialPropertyKindOptions;
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


// export type InputMapActionBindingDefinition = {
//     readonly device: InputDeviceKindOptions;
//     readonly values: Array<Array<string>>;
// }

// export type InputMapActionDefinition = {
//     readonly name: string;
//     readonly kind: InputControlKindOptions;
//     readonly bindings: Iterable<InputMapActionBindingDefinition>;
// }

// export type InputMapDefinition = {
//     readonly name: string;
//     readonly actions: Iterable<InputMapActionDefinition>;
// }

// export type InputDefinition = {
//     readonly name: string;
//     readonly kind: ResourceKindOptions;
//     readonly maps: Iterable<InputMapDefinition>;
// }


// #endregion