import { getTargets, targetShape, withTargets, type Annotation, type Box, type Target } from "../../Utils/targets"

export function pixelFragment(box: Box): string {
    const rounded = [box.x, box.y, box.width, box.height].map(Math.round)

    return `xywh=${rounded.join(',')}`
}

export function roundTarget(target: Target): Target {
    const shape = targetShape(target)

    if (!shape || shape.kind !== 'rect') {
        return target
    }

    return {
        ...target,
        selector: {
            ...target.selector,
            value: pixelFragment(shape)
        }
    }
}

export function roundTargets(annotation: Annotation): Annotation {
    return withTargets(annotation, getTargets(annotation).map(roundTarget))
}
