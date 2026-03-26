// components/AdnoNavigator/AdnoNavigator.jsx
import { Component, createRef } from "react";
import "./AdnoNavigator.css";

class AdnoNavigator extends Component {
    constructor(props) {
        super(props);
        this.canvasRef = createRef();
        this.isDragging = false;
    }
    drawNavigator = () => {
        const { viewer } = this.props;
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        const item = viewer.world.getItemAt(0);
        if (!item) return;

        // Fond sombre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, W, H);

        // Dessine l'image complète (pas le canvas OSD zoomé)
        if (this._bgImage && this._bgImage.complete && this._bgImage.naturalWidth) {
            ctx.drawImage(this._bgImage, 0, 0, W, H);
        } else {
            // Fallback IIIF : copie le canvas OSD
            const osdCanvas = viewer.drawer.canvas;
            if (osdCanvas) {
                ctx.drawImage(osdCanvas, 0, 0, W, H);
            }
        }

        // Rectangle de la vue courante
        const imgBounds = item.getBounds();
        const viewBounds = viewer.viewport.getBounds(true);

        const vpToCanvas = (point) => ({
            x: ((point.x - imgBounds.x) / imgBounds.width) * W,
            y: ((point.y - imgBounds.y) / imgBounds.height) * H,
        });

        const topLeft = vpToCanvas({ x: viewBounds.x, y: viewBounds.y });
        const bottomRight = vpToCanvas({
            x: viewBounds.x + viewBounds.width,
            y: viewBounds.y + viewBounds.height,
        });

        const rectX = Math.max(0, topLeft.x);
        const rectY = Math.max(0, topLeft.y);
        const rectW = Math.min(W, bottomRight.x) - rectX;
        const rectH = Math.min(H, bottomRight.y) - rectY;

        // Zone hors viewport assombrie
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, rectY);                          // haut
        ctx.fillRect(0, rectY + rectH, W, H - rectY - rectH);  // bas
        ctx.fillRect(0, rectY, rectX, rectH);                   // gauche
        ctx.fillRect(rectX + rectW, rectY, W - rectX - rectW, rectH); // droite

        // Bordure du rectangle viewport
        ctx.strokeStyle = 'rgba(255, 220, 50, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
    }

    componentDidMount() {
        const { viewer, imgUrl } = this.props;

        // Précharge l'image une seule fois
        if (imgUrl) {
            this._bgImage = new Image();
            this._bgImage.crossOrigin = 'anonymous';
            this._bgImage.src = imgUrl;
            this._bgImage.onload = () => this.drawNavigator();
        }

        setTimeout(() => this.drawNavigator(), 500)
        viewer.addHandler('animation', () => this.drawNavigator());
        viewer.addHandler('pan', () => this.drawNavigator());
        viewer.addHandler('zoom', () => this.drawNavigator());
        viewer.addHandler('resize', () => this.drawNavigator());
    }

    canvasToViewport = (canvasX, canvasY) => {
        const { viewer } = this.props;
        const canvas = this.canvasRef.current;
        const item = viewer.world.getItemAt(0);
        if (!item) return null;

        const imgBounds = item.getBounds();

        return {
            x: imgBounds.x + (canvasX / canvas.width) * imgBounds.width,
            y: imgBounds.y + (canvasY / canvas.height) * imgBounds.height,
        };
    }

    handleMouseDown = (e) => {
        this.isDragging = true;
        this.panTo(e);
    }

    handleMouseMove = (e) => {
        if (!this.isDragging) return;
        this.panTo(e);
    }

    handleMouseUp = () => {
        this.isDragging = false;
    }

    panTo = (e) => {
        const canvas = this.canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const vp = this.canvasToViewport(x, y);
        if (vp) {
            this.props.viewer.viewport.panTo(
                new OpenSeadragon.Point(vp.x, vp.y),
                false
            );
        }
    }

    render() {
        const { imageRatio, layout } = this.props;

        // Dimensions selon le layout
        let width, height;
        if (layout === 'bottom-center') {
            // rouleau horizontal : height fixe, width max
            width = this.props.maxWidth || 400;
            height = Math.round(width * imageRatio);

            if (height > 300) {
                height = 300;
                width = Math.round(height / imageRatio);
            }
        } else if (layout === 'right-vertical') {
            // rouleau vertical : width fixe, height max
            height = this.props.maxHeight || 400;
            width = Math.round(height / imageRatio);
            if (width > 80) {
                width = 80;
                height = Math.round(width * imageRatio);
            }
        } else {
            // classique proportionnel
            width = 200;
            height = Math.round(width * imageRatio);
            if (height > 160) {
                height = 160;
                width = Math.round(height / imageRatio);
            }
        }

        return (
            <canvas
                ref={this.canvasRef}
                width={width}
                height={height}
                className={`adno-navigator adno-navigator--${layout}`}
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
                onMouseUp={this.handleMouseUp}
                onMouseLeave={this.handleMouseUp}
            />
        );
    }
}

export default AdnoNavigator;