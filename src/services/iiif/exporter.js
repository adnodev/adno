import { enhancedFetch } from "../../Utils/utils"
import { getTargets } from "../../Utils/targets"
import { imageIndexForSource, projectImages } from "../../Utils/images"

const EXCLUDED_METADATA = ['settings', 'id', 'manifest_url', 'img_url', 'images', 'annotations']

export const exportToIIIF = async (state) => {
    const {
        annotations,
        selectedProject,
        settings
    } = state

    const adnoSettings = btoa(JSON.stringify(settings, null, 4));

    const images = await Promise.all(projectImages(selectedProject).map(sizedImage))

    const content = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        // "id": "https://iiif.io/api/cookbook/recipe/0261-non-rectangular-commenting/manifest.json",
        "id": `https://example.com/manifest.json`,
        "type": "Manifest",
        "metadata": [
            ...Object.entries(selectedProject)
                .filter(([key, value]) => !EXCLUDED_METADATA.includes(key) && ("" + value)?.length > 0)
                .map(([key, value]) => ({
                    label: {
                        en: [
                            key
                        ]
                    },
                    value: {
                        en: [
                            value
                        ]
                    }
                })),
            {
                "label": {
                    "en": [
                        "adno_settings"
                    ]
                },
                "value": {
                    "en": [
                        adnoSettings
                    ]
                }
            },
        ],
        "label": {
            "en": [
                selectedProject.description
            ],
            "fr": [
                selectedProject.description
            ]
        },
        "items": images.map((image, index) =>
            exportCanvas(image, index, images, annotationsOnCanvas(annotations, images, index)))
    }

    return content
}

function canvasId(index) {
    return `https://example.com/canvas-${index + 1}`
}

function canvasIndexOf(annotation, images) {
    const first = getTargets(annotation)[0]

    return Math.max(imageIndexForSource(images, first && first.source), 0)
}

function annotationsOnCanvas(annotations, images, index) {
    return (annotations || []).filter(annotation => canvasIndexOf(annotation, images) === index)
}

function exportCanvas(image, index, images, annotations) {
    const id = canvasId(index)
    const number = index + 1
    const imageId = image.source.replace(/\/info\.json$/, '')

    return {
        "id": id,
        "type": "Canvas",
        ...(image.label ? { "label": { "none": [image.label] } } : {}),
        "height": image.height,
        "width": image.width,
        "items": [
            {
                "id": `https://example.com/annotation-page/canvas-${number}/annopage-1`,
                "type": "AnnotationPage",
                "items": [
                    {
                        "id": `https://example.com/annotation/canvas-${number}/annopage-1/anno-1`,
                        "type": "Annotation",
                        "motivation": "painting",
                        "body": {
                            "id": imageId,
                            "type": "Image",
                            "format": imageFormat(imageId),
                            ...(image.type === 'iiif' ? {
                                "service": [
                                    {
                                        "id": imageId,
                                        "type": "ImageService3",
                                        "profile": "level1"
                                    }
                                ]
                            } : {}),
                            "height": image.height,
                            "width": image.width,
                        },
                        "target": id
                    },
                ]
            }
        ],
        "annotations": [
            {
                "id": `https://example.com/canvas-${number}/annopage-2`,
                "type": "AnnotationPage",
                "items": annotations.map((annotation, idx) => ({
                    "id": `https://example.com/canvas-${number}/annopage-2/anno-${idx}`,
                    "type": "Annotation",
                    "motivation": "commenting",
                    body: annotation.body,
                    ...extractTargetAndSelector(annotation, images)
                }))
            }
        ]
    }
}

async function sizedImage(image) {
    if (image.width && image.height) {
        return image
    }

    const probed = image.type === 'iiif' ? await infoSize(image.source) : await measureImage(image.source)

    return { ...image, ...probed }
}

async function infoSize(source) {
    const url = source.endsWith('info.json') ? source : `${source}/info.json`
    const fetched = await enhancedFetch(url)
    const response = fetched && fetched.response

    if (!response || typeof response.json !== 'function') {
        return {}
    }

    return response.json()
        .then(info => ({ width: info.width, height: info.height }))
        .catch(() => ({}))
}

function measureImage(source) {
    return new Promise(resolve => {
        const image = new Image()
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () => resolve({})
        image.src = source
    })
}

function imageFormat(source) {
    return /\.png$/i.test(source) ? 'image/png' : 'image/jpeg'
}

function extractTargetAndSelector(annotation, images) {
    const targets = getTargets(annotation).map(target => exportTarget(target, images))

    return { target: targets.length === 1 ? targets[0] : targets }
}

function exportTarget(target, images) {

    const { selector } = target
    const value = selector.value
    const source = canvasId(Math.max(imageIndexForSource(images, target.source), 0))

    if (value.startsWith('xywh')) {
        // point "xywh=pixel:1085.033935546875,388.39544677734375,0,0"
        // rect "xywh=pixel:1590.492431640625,148.36683654785156,818.98486328125,872.3969573974609"

        const coordinates = formatCoordinates(value);
        return {
            type: "SpecificResource",
            source,
            selector: {
                "type": "FragmentSelector",
                "value": coordinates,
                ...(selector.refinedBy ? { refinedBy: selector.refinedBy } : {})
            }
        }

    } else if (value.includes('circle')) {
        //<svg><circle cx=\"6651.482267818101\" cy=\"485.07000879322743\" r=\"434.5177321818993\"></circle></svg>
        return {
            type: "SpecificResource",
            source,
            selector: {
                ...selector,
                value: formatSvgCircleToPath(value)
            }
        }
    } else if (value.includes('ellipse')) {
        return {
            type: "SpecificResource",
            source,
            selector: {
                ...selector,
                value: formatSvgEllipseToPath(value)
            }
        }
    } else if (value.includes('polygon')) {
        // <svg><polygon points=\"712.383056640625,1071.79345703125 1086.5421142578125,1162.2012939453125 1004.058837890625,1548.3990478515625 622.3629760742188,1518.2855224609375 425.7992248535156,1259.4378662109375\" /></svg>
        return {
            type: "SpecificResource",
            source,
            selector: {
                ...selector,
                value: formatSvgPolygonToPath(value)
            }
        }
    } else {
        return {
            type: "SpecificResource",
            source,
            selector: {
                ...selector,
                value: formatSvgPath(value)
            }
        }
    }
}

const formatSvgPath = (text) => {
    return text.replace(/<path d="([ML\d.\s]+)"/g, (match, d) => {
        const roundedD = d.split(" ").map(value => {
            return isNaN(value) ? value : Math.round(parseFloat(value));
        }).join(" ");
        return `<path d="${roundedD}"`;
    });
};

const formatCoordinates = (text) => {
    return text.replace(/xywh=pixel:([\d.]+),([\d.]+),([\d.]+),([\d.]+)/g, (match, p1, p2, p3, p4) => {
        const outP3 = p3 === '0' ? 10 : p3;
        const outP4 = p4 === '0' ? 10 : p4;
        return `xywh=${Math.round(p1)},${Math.round(p2)},${Math.round(outP3)},${Math.round(outP4)}`;
    });
};

const formatSvgCircleToPath = (text) => {
    return text.replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g, (match, cx, cy, r) => {
        const x = Math.round(cx);
        const y = Math.round(cy);
        const radius = Math.round(r);
        return `<path d="M ${x - radius},${y} A ${radius},${radius} 0 1,0 ${x + radius},${y} A ${radius},${radius} 0 1,0 ${x - radius},${y} Z"`;
    });
};

const formatSvgPolygonToPath = (text) => {
    return text.replace(/<polygon points="([\d.,\s]+)"/g, (match, points) => {
        const roundedPoints = points.split(" ").map(point => {
            return point.split(",").map(coord => Math.round(parseFloat(coord))).join(",");
        });

        if (roundedPoints.length < 2) return '';

        let pathData = `M ${roundedPoints[0]}`;
        for (let i = 1; i < roundedPoints.length; i++) {
            pathData += ` L ${roundedPoints[i]}`;
        }
        pathData += ' Z';

        return `<path d="${pathData}"`;
    });
};

const formatSvgEllipseToPath = (text) => {
    return text.replace(/<ellipse cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g, (match, cx, cy, rx, ry) => {
        const x = Math.round(cx);
        const y = Math.round(cy);
        const radiusX = Math.round(rx);
        const radiusY = Math.round(ry);
        return `<path d="M ${x - radiusX},${y} A ${radiusX},${radiusY} 0 1,0 ${x + radiusX},${y} A ${radiusX},${radiusY} 0 1,0 ${x - radiusX},${y} Z"`;
    }).replace('></ellipse>', '/>');
};