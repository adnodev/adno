import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown, faChevronLeft, faChevronRight, faChevronUp } from "@fortawesome/free-solid-svg-icons"

import { imageThumbnail } from "../../Utils/images"
import { zoneCountsByImage } from "../../Utils/targets"

import "./ImageFilmstrip.css"

const THUMB_HEIGHT = 72

export function ImageFilmstrip({ images, annotations, currentIndex, changeImage, translate }) {
    const [collapsed, setCollapsed] = useState(false)

    if (!images || images.length < 2) {
        return null
    }

    const counts = zoneCountsByImage(annotations, images)

    const step = (delta) => {
        const next = currentIndex + delta

        if (next >= 0 && next < images.length) {
            changeImage(next)
        }
    }

    const onKeyDown = (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault()
            step(-1)
        }

        if (event.key === "ArrowRight") {
            event.preventDefault()
            step(1)
        }
    }

    return (
        <div className="filmstrip"
            tabIndex={0}
            onKeyDown={onKeyDown}
            aria-label={translate('editor.images')}>

            <div className="filmstrip-bar">
                <button className="filmstrip-step"
                    disabled={currentIndex === 0}
                    onClick={() => step(-1)}
                    aria-label={translate('editor.previous_image')}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <span className="filmstrip-count">{currentIndex + 1}/{images.length}</span>

                <button className="filmstrip-step"
                    disabled={currentIndex === images.length - 1}
                    onClick={() => step(1)}
                    aria-label={translate('editor.next_image')}>
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>

                <button className="filmstrip-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={translate(collapsed ? 'editor.expand_images' : 'editor.collapse_images')}>
                    <FontAwesomeIcon icon={collapsed ? faChevronUp : faChevronDown} />
                </button>
            </div>

            {!collapsed &&
                <div className="filmstrip-thumbs">
                    {images.map((image, index) =>
                        <button key={image.id}
                            className={index === currentIndex ? "filmstrip-thumb filmstrip-thumb--current" : "filmstrip-thumb"}
                            onClick={() => changeImage(index)}
                            data-image-index={index}>
                            <img src={imageThumbnail(image, THUMB_HEIGHT)}
                                alt={image.label || String(index + 1)} />
                            <span className="filmstrip-label">{image.label || String(index + 1)}</span>
                            {counts[index] > 0 && <span className="filmstrip-badge">{counts[index]}</span>}
                        </button>
                    )}
                </div>
            }
        </div>
    )
}
