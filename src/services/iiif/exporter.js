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
                }))
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
                        "items": annotations.map((annotation, idx) => ({
                            "id": `https://example.com/canvas-1/annopage-2/anno-${idx}`,
                            "type": "Annotation",
                            "motivation": "commenting",
                            "body": annotation.body,
                            "target": `https://example.com/canvas-1`,
                            "selector": annotation.target.selector
                        }))
                    }
                ]
            }
        ]
    }

    return content
}