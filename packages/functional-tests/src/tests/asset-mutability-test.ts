/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as GltfGen from '@microsoft/gltf-gen';
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Server from '../server';
import { Test } from '../test';
import delay from '../utils/delay';

export default class AssetMutabilityTest extends Test {
    public expectedResultDescription = "Animate a cube's color and texture";

    public async run(): Promise<boolean> {

        const assets = await this.app.context.assetManager.loadGltf(
            'assets', this.generateMaterial()
        );

        const mat = assets.materials.byIndex(0);
        MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 1, y: 1, z: 1 }
            },
            actor: {
                name: 'box',
                appearance: { materialId: mat.id },
                transform: {
                    local: {
                        position: { y: 1, z: -1 }
                    }
                }
            }
        });

        let direction = 1;
        let i = 0;
        while (!this.stopped) {
            mat.color.copyFrom(this.fromHSV(i / 32, 1, 1));
            mat.mainTextureOffset.set(i / 32, i / 32);
            mat.mainTextureScale.set(1 - i / 32, 1 - i / 32);

            i += direction;
            if (i === 0 || i === 64) {
                direction *= -1;
            }
            await delay(100);
        }

        return true;
    }

    private generateMaterial(): string {
        const material = new GltfGen.Material({
            metallicFactor: 0,
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/uv-grid.png` // alternate form (don't embed)
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);

        return Server.registerStaticBuffer('assets.glb', gltfFactory.generateGLTF());
    }

    private fromHSV(h: number, s: number, v: number): MRE.Color4 {
        // from wikipedia: https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
        function f(n: number, k = (n + h * 6) % 6) {
            return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        }
        return new MRE.Color4(f(5), f(3), f(1), 1);
    }
}
