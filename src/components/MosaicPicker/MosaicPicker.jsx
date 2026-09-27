import { MOSAIC_RATIOS, MOSAIC_ROTATIONS } from "../../Utils/project"
import { mosaicLayout } from "../../Utils/mosaic"

import "./MosaicPicker.css"

const FALLBACK_GROUPS = 4

export function MosaicPicker({ ratio, rotation, groups, onChange }) {
    const currentRatio = ratio || MOSAIC_RATIOS[0]
    const currentRotation = rotation || MOSAIC_ROTATIONS[0]
    const previewGroups = groups > 1 ? groups : FALLBACK_GROUPS

    return (
        <div className="mosaic-picker">
            {MOSAIC_RATIOS.map(previewRatio =>
                <div key={previewRatio} className="mosaic-picker-row">
                    <span className="mosaic-picker-ratio">{previewRatio}</span>

                    {MOSAIC_ROTATIONS.map(previewRotation => {
                        const layout = mosaicLayout(previewGroups, previewRotation, previewRatio)
                        const selected = previewRatio === currentRatio && previewRotation === currentRotation

                        return (
                            <button key={previewRotation}
                                type="button"
                                className={selected ? "mosaic-preview mosaic-preview--selected" : "mosaic-preview"}
                                onClick={() => onChange(previewRatio, previewRotation)}
                                style={{
                                    gridTemplateColumns: layout.columns,
                                    gridTemplateRows: layout.rows,
                                    gridTemplateAreas: layout.areas
                                }}>
                                {layout.names.map((name, index) =>
                                    <span key={name} className="mosaic-preview-cell" style={{ gridArea: name }}>{index + 1}</span>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
