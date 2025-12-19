import Swal from "sweetalert2";

export function extractIIIFContent(imported_project, options) {
    options.overrideSettings();

    let resultLink = null;
    let annos = [];

    const context = imported_project['@context'] || imported_project.context;
    const contextStr = Array.isArray(context) ? context.join(' ') : (context || '');

    const isPresentationV3 = contextStr.includes('iiif.io/api/presentation/3');
    const isPresentationV2 = contextStr.includes('iiif.io/api/presentation/2') ||
        imported_project['@type'] === 'sc:Manifest';
    const isImageAPI = contextStr.includes('iiif.io/api/image/') ||
        imported_project['@type'] === 'iiif:Image' ||
        imported_project.type === 'ImageService2' ||
        imported_project.type === 'ImageService3';

    if (isImageAPI) {
        console.log('Detected IIIF Image API info.json');
        resultLink = imported_project['@id'] || imported_project.id;

        if (resultLink && !resultLink.endsWith('/info.json')) {
            resultLink = resultLink + '/info.json';
        }
    }

    else if (isPresentationV3) {
        console.log('Detected IIIF Presentation API v3');

        if (imported_project.items && imported_project.items.length > 0) {
            const canvas = imported_project.items[0];

            if (canvas.items && canvas.items.length > 0) {
                const annotationPage = canvas.items[0];

                if (annotationPage.items && annotationPage.items.length > 0) {
                    const annotation = annotationPage.items[0];

                    if (annotation.body) {
                        const body = annotation.body;

                        if (body.service && body.service.length > 0) {
                            const service = body.service[0];
                            resultLink = service.id || service['@id'];

                            if (resultLink && !resultLink.endsWith('/info.json')) {
                                resultLink = resultLink + '/info.json';
                            }
                        }
                        else if (body.id) {
                            resultLink = body.id;
                        }
                    }
                }
            }
        }
        annos = extractIIIFv3Annotations(imported_project);
    }

    else if (isPresentationV2) {
        console.log('Detected IIIF Presentation API v2');

        if (imported_project.sequences && imported_project.sequences.length > 0) {
            const sequence = imported_project.sequences[0];

            if (sequence.canvases && sequence.canvases.length > 0) {
                const canvas = sequence.canvases[0];

                if (canvas.images && canvas.images.length > 0) {
                    const image = canvas.images[0];

                    if (image.resource) {
                        const resource = image.resource;

                        if (resource.service) {
                            const service = Array.isArray(resource.service)
                                ? resource.service[0]
                                : resource.service;

                            resultLink = service['@id'] || service.id;

                            if (resultLink && !resultLink.endsWith('/info.json')) {
                                resultLink = resultLink + '/info.json';
                            }
                        }
                        else if (resource['@id']) {
                            resultLink = resource['@id'];
                        }
                    }
                }
            }
        }
        annos = extractIIIFv2Annotations(imported_project);
    }

    else {
        console.warn('Unknown IIIF format, attempting fallback extraction');
        resultLink = findImageInObject(imported_project);
    }

    if (resultLink) {
        const optSettings = getMetadataFromIIIF(imported_project.metadata, "adno_settings");

        let adnoSettings = {};
        if (optSettings) {
            try {
                adnoSettings = JSON.parse(atob(optSettings));
            } catch (err) {
                console.error('Failed to parse adno_settings:', err);
            }
        }

        // Extract metadata - FIXED VERSION
        // Try to get from metadata array first, then fall back to direct properties
        const title = getMetadataFromIIIF(imported_project.metadata, 'title') ||
            extractLanguageValue(imported_project.label);

        const description = getMetadataFromIIIF(imported_project.metadata, 'description') ||
            extractLanguageValue(imported_project.summary);

        const creator = getMetadataFromIIIF(imported_project.metadata, 'creator');
        const editor = getMetadataFromIIIF(imported_project.metadata, 'editor');

        const rights = imported_project.rights ||
            getMetadataFromIIIF(imported_project.metadata, 'rights') ||
            extractLanguageValue(imported_project.requiredStatement?.value);

        const selectedTags = adnoSettings?.tags || [];
        if (selectedTags.length > 0) {
            annos = annos
                .map(annotation => ({
                    ...annotation,
                    tags: buildTagsList(annotation).map(tag => tag.value)
                }))
                .filter(annotation =>
                    annotation.tags.find(tag => selectedTags.includes(tag))
                );
        }

        const GRANTED_IMG_EXTENSIONS =
            process.env.GRANTED_IMG_EXTENSIONS?.split(",") || [];

        const tileSources = GRANTED_IMG_EXTENSIONS.includes(
            get_url_extension(resultLink)
        )
            ? {
                type: "image",
                url: resultLink,
            }
            : [resultLink];

        options.setState({
            ...adnoSettings,
            annos,
            title,
            description,
            creator,
            editor,
            rights,
            isLoaded: true
        }, () => {
            options.overrideSettings();
            options.displayViewer(tileSources, annos);
        });

    } else {
        Swal.fire({
            title: options.props.t("errors.unable_reading_manifest"),
            text: options.props.t("errors.no_image_source_found"),
            showCancelButton: true,
            showConfirmButton: false,
            cancelButtonText: "OK",
            icon: "warning",
        });
    }
}

export function findImageInObject(obj, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return null;

    if (obj.service) {
        const service = Array.isArray(obj.service) ? obj.service[0] : obj.service;
        const serviceId = service['@id'] || service.id;
        if (serviceId) {
            return serviceId.endsWith('/info.json') ? serviceId : serviceId + '/info.json';
        }
    }

    if (obj['@id'] || obj.id) {
        const id = obj['@id'] || obj.id;
        if (id.includes('/iiif/') || id.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return id;
        }
    }

    for (let key in obj) {
        if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
            const result = findImageInObject(obj[key], depth + 1);
            if (result) return result;
        }
    }

    return null;
}


export function extractIIIFv3Annotations(manifest) {
    const annotations = [];

    if (!manifest.items) return annotations;

    manifest.items.forEach(canvas => {
        if (!canvas.annotations) return;

        canvas.annotations.forEach(annotationPage => {
            if (annotationPage.items) {
                annotationPage.items.forEach(anno => {
                    // Fix FragmentSelector conformsTo for commenting annotations
                    if (anno.motivation === "commenting") {
                        if (anno.target && anno.target.selector && anno.target.selector.type === "FragmentSelector") {
                            anno.target.selector.conformsTo = "http://www.w3.org/TR/media-frags/";
                        }
                    }
                    annotations.push(anno);
                });
            }
        });
    });

    return annotations;
}

/**
 * Extract annotations from IIIF Presentation API v2
 * Convert to v3-compatible format and fix FragmentSelector conformsTo
 */
export function extractIIIFv2Annotations(manifest) {
    const annotations = [];

    if (!manifest.sequences) return annotations;

    manifest.sequences.forEach(sequence => {
        if (!sequence.canvases) return;

        sequence.canvases.forEach(canvas => {
            if (!canvas.otherContent) return;

            canvas.otherContent.forEach(annotationList => {
                if (typeof annotationList === 'string') {
                    console.warn('Annotation list is a URI reference:', annotationList);
                    return;
                }

                if (annotationList.resources) {
                    annotationList.resources.forEach(anno => {
                        const converted = {
                            id: anno['@id'],
                            type: 'Annotation',
                            motivation: anno.motivation || 'commenting',
                            body: anno.resource,
                            target: anno.on
                        };

                        // Fix FragmentSelector conformsTo for commenting annotations
                        if (converted.motivation === "commenting") {
                            if (converted.target && converted.target.selector && converted.target.selector.type === "FragmentSelector") {
                                converted.target.selector.conformsTo = "http://www.w3.org/TR/media-frags/";
                            }
                        }

                        annotations.push(converted);
                    });
                }
            });
        });
    });

    return annotations;
}

/**
 * Extract value from IIIF v3 language map
 * Handles both v3 format { "en": ["value"] } and simple strings
 */
export function extractLanguageValue(languageMap) {
    if (!languageMap) return null;

    // If it's a simple string, return it
    if (typeof languageMap === 'string') return languageMap;

    // If it's an object with language codes
    if (typeof languageMap === 'object' && !Array.isArray(languageMap)) {
        // Try preferred languages in order
        const values = languageMap.en ||
            languageMap.fr ||
            languageMap.none ||
            Object.values(languageMap)[0];

        if (Array.isArray(values) && values.length > 0) {
            return values[0];
        }
        return values;
    }

    return null;
}

/**
 * Extract metadata value from IIIF metadata array
 * This is specifically for the metadata array, NOT for label/summary
 */
export function getMetadataFromIIIF(metadata, key) {
    // metadata should be an array of { label: {...}, value: {...} } objects
    if (!Array.isArray(metadata)) return null;

    const entry = metadata.find(item => {
        // Extract the label - handle both v3 and v2 formats
        const labelValue = extractLanguageValue(item.label);
        return labelValue && labelValue.toLowerCase() === key.toLowerCase();
    });

    if (!entry) return null;

    // Extract the value
    return extractLanguageValue(entry.value);
}

export function buildTagsList(annotation) {
    const tags = [];

    if (annotation.body) {
        const bodies = Array.isArray(annotation.body) ? annotation.body : [annotation.body];

        bodies.forEach(body => {
            if (body.purpose === 'tagging' || body.motivation === 'tagging') {
                tags.push({
                    value: body.value || body.id,
                    label: body.value || body.id
                });
            }
        });
    }

    return tags;
}

export function get_url_extension(url) {
    if (!url) return '';
    const match = url.match(/\.([^./?#]+)(?:[?#]|$)/);
    return match ? match[1].toLowerCase() : '';
}