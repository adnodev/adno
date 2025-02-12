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
        "id": `${window.location.protocol}//${window.location.host}/manifest.json`,
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
                // "id": "https://iiif.io/api/cookbook/recipe/0261-non-rectangular-commenting/canvas/p1",
                "id": `${window.location.protocol}//${window.location.host}/canvas/p1`,
                "type": "Canvas",
                "height": manifest.height,
                "width": manifest.width,
                "items": [
                    {
                        "id": `${window.location.protocol}//${window.location.host}/annotation-page/p1`,
                        "type": "AnnotationPage",
                        "items": [
                            {
                                "id": `${window.location.protocol}//${window.location.host}/annotation/1`,
                                "type": "Annotation",
                                "motivation": "painting",
                                "body": {
                                    "id": selectedProject.manifest_url,
                                    "type": "Image",
                                    "format": "image/jpeg",
                                    "service": [
                                        {
                                            "id": selectedProject.manifest_url,
                                            "type": "ImageService3",
                                            "profile": "level2"
                                        }
                                    ],
                                    "height": manifest.height,
                                    "width": manifest.width,
                                },
                                "target": `${window.location.protocol}//${window.location.host}/canvas/p1`
                            }
                        ]
                    }
                ],
                "annotations": [{
                    // "id": "https://iiif.io/api/cookbook/recipe/0261-non-rectangular-commenting/page/p2/1",
                    "id": `${window.location.protocol}//${window.location.host}/page/p2/1`,
                    "type": "AnnotationPage",
                    "items": annotations.map(annotation => ({
                        // "id": "https://iiif.io/api/cookbook/recipe/0261-non-rectangular-commenting/annotation/p0002-svg",
                        "id": `${window.location.protocol}//${window.location.host}/annotation/${annotation.id}`,
                        "type": "Annotation",
                        "motivation": "supplementing",
                        "body": annotation.body,
                        "target": annotation.target
                    }))
                }]
            }
        ]
    }

    return content
}