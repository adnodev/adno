import { enhancedFetch } from "../../Utils/utils"

export const exportToIIIF = async (state) => {
    const {
        annotations,
        selectedProject,
        settings
    } = state

    const adnoSettings = btoa(JSON.stringify(settings, null, 4));

    const manifest = await enhancedFetch(selectedProject.manifest_url)
        .then(rawResponse => rawResponse.response.text())
        .then(data => {
            const manifest = data ? JSON.parse(data) : {};
            // TODO - manage error
            return manifest
        })

    const content = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        // "id": "https://iiif.io/api/cookbook/recipe/0261-non-rectangular-commenting/manifest.json",
        "id": `https://example.com/manifest.json`,
        "type": "Manifest",
        "metadata": [
            ...Object.entries(selectedProject)
                .filter(([key, value]) => !['settings', 'id', 'manifest_url'].includes(key) && ("" + value)?.length > 0)
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
        "items": [
            {
                "id": `https://example.com/canvas-1`,
                "type": "Canvas",
                "height": manifest.height,
                "width": manifest.width,
                "items": [
                    {
                        "id": `https://example.com/annotation-page/canvas-1/annopage-1`,
                        "type": "AnnotationPage",
                        "items": [
                            {
                                "id": `https://example.com/annotation/canvas-1/annopage-1/anno-1`,
                                "type": "Annotation",
                                "motivation": "painting",
                                "body": {
                                    "id": selectedProject.manifest_url.replace('/info.json', ''),
                                    "type": "Image",
                                    "format": "image/jpeg",
                                    "service": [
                                        {
                                            "id": selectedProject.manifest_url.replace('/info.json', ''),
                                            "type": "ImageService3",
                                            "profile": "level1"
                                        }
                                    ],
                                    "height": manifest.height,
                                    "width": manifest.width,
                                },
                                "target": `https://example.com/canvas-1`
                            },
                        ]
                    }
                ],
                "annotations": [
                    {
                        "id": `https://example.com/canvas-1/annopage-2`,
                        "type": "AnnotationPage",
                        "items": annotations.map((annotation, idx) => {
                            // const bodies = annotation.body
                            //     .map(body => {
                            //         if (body.type === 'HTMLBody') {
                            //             return {
                            //                 ...body,
                            //                 format: 'text/html'
                            //             }
                            //         }
                            //         return body
                            //     })

                            // const hasHTMLBody = bodies.find(b => b.type === 'HTMLBody')

                            return {
                                "id": `https://example.com/canvas-1/annopage-2/anno-${idx}`,
                                "type": "Annotation",
                                "motivation": "commenting",
                                // "body": hasHTMLBody ? hasHTMLBody : bodies,
                                body: annotation.body,
                                ...extractTargetAndSelector(annotation)
                            }
                        })
                    }
                ]
            }
        ]
    }

    return content
}

function extractTargetAndSelector(annotation) {

    const { selector } = annotation.target
    const value = selector.value

    if (value.startsWith('xywh')) {
        // point "xywh=pixel:1085.033935546875,388.39544677734375,0,0"
        // rect "xywh=pixel:1590.492431640625,148.36683654785156,818.98486328125,872.3969573974609"

        const coordinates = formatCoordinates(value);
        return {
            target: {
                type: "SpecificResource",
                source: "https://example.com/canvas-1",
                selector: {
                    "type": "FragmentSelector",
                    "value": coordinates
                }
            }
        }

    } else if (value.includes('circle')) {
        //<svg><circle cx=\"6651.482267818101\" cy=\"485.07000879322743\" r=\"434.5177321818993\"></circle></svg>
        return {
            target: {
                type: "SpecificResource",
                source: `https://example.com/canvas-1`,
                selector: {
                    ...selector,
                    value: formatSvgCircleToPath(value)
                }
            }
        }
    } else if (value.includes('ellipse')) {
        return {
            target: {
                type: "SpecificResource",
                source: `https://example.com/canvas-1`,
                selector: {
                    ...selector,
                    value: formatSvgEllipseToPath(value)
                }
            }
        }
    } else if (value.includes('polygon')) {
        // <svg><polygon points=\"712.383056640625,1071.79345703125 1086.5421142578125,1162.2012939453125 1004.058837890625,1548.3990478515625 622.3629760742188,1518.2855224609375 425.7992248535156,1259.4378662109375\" /></svg>
        return {
            target: {
                type: "SpecificResource",
                source: `https://example.com/canvas-1`,
                selector: {
                    ...selector,
                    value: formatSvgPolygonToPath(value)
                }
            }
        }
    } else {
        return {
            target: {
                type: "SpecificResource",
                source: `https://example.com/canvas-1`,
                selector: {
                    ...selector,
                    value: formatSvgPath(value)
                }
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

// const formatSvgCircle = (text) => {
//     return text.replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g, (match, cx, cy, r) => {
//         return `<circle cx="${Math.round(cx)}" cy="${Math.round(cy)}" r="${Math.round(r)}"`;
//     });
// };

// const formatSvgPolygon = (text) => {
//     return text.replace(/<polygon points="([\d.,\s]+)"/g, (match, points) => {
//         const roundedPoints = points.split(" ").map(point => {
//             return point.split(",").map(coord => Math.round(parseFloat(coord))).join(",");
//         }).join(" ");
//         return `<polygon points="${roundedPoints}"`;
//     });
// };

// const formatSvgEllipse = (text) => {
//     return text.replace(/<ellipse cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g, (match, cx, cy, rx, ry) => {
//         return `<ellipse cx="${Math.round(cx)}" cy="${Math.round(cy)}" rx="${Math.round(rx)}" ry="${Math.round(ry)}"`;
//     });
// };


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