import { Component, createRef } from "react";
import "./AdnoNavigator.css";

class AdnoNavigator extends Component {
    constructor(props) {
        super(props);
        this.canvasRef = createRef();
        this.isDragging = false;
        this._bgImage = null;
        this._timer = null;
    }

    componentDidMount() {
        const { viewer } = this.props;

        this.loadThumbnail();
        this._timer = setTimeout(() => this.draw(), 500);
        viewer.addHandler('animation', this.draw);
        viewer.addHandler('resize', this.draw);
    }

    componentWillUnmount() {
        const { viewer } = this.props;

        clearTimeout(this._timer);
        viewer.removeHandler('animation', this.draw);
        viewer.removeHandler('resize', this.draw);
    }

    loadThumbnail = () => {
        const { imgUrl } = this.props;
        if (!imgUrl) return;

        this._bgImage = new Image();
        this._bgImage.crossOrigin = 'anonymous';
        this._bgImage.src = imgUrl.endsWith('/info.json')
            ? `${imgUrl.replace('/info.json', '')}/full/!512,512/0/default.jpg`
            : imgUrl;
        this._bgImage.onload = () => this.draw();
    }

    draw = () => {
        const { viewer } = this.props;
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);

        const item = viewer.world.getItemAt(0);
        if (!item) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, W, H);

        if (this._bgImage?.complete && this._bgImage.naturalWidth) {
            ctx.drawImage(this._bgImage, 0, 0, W, H);
        }

        this.drawViewportRect(ctx, item, W, H);
    }

    drawViewportRect = (ctx, item, W, H) => {
        const { viewer } = this.props;
        const imgBounds = item.getBounds();
        const viewBounds = viewer.viewport.getBounds(true);

        const toCanvas = (x, y) => ({
            x: ((x - imgBounds.x) / imgBounds.width) * W,
            y: ((y - imgBounds.y) / imgBounds.height) * H,
        });

        const tl = toCanvas(viewBounds.x, viewBounds.y);
        const br = toCanvas(
            viewBounds.x + viewBounds.width,
            viewBounds.y + viewBounds.height
        );

        const rx = Math.max(0, tl.x);
        const ry = Math.max(0, tl.y);
        const rw = Math.min(W, br.x) - rx;
        const rh = Math.min(H, br.y) - ry;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, ry);
        ctx.fillRect(0, ry + rh, W, H - ry - rh);
        ctx.fillRect(0, ry, rx, rh);
        ctx.fillRect(rx + rw, ry, W - rx - rw, rh);

        ctx.strokeStyle = 'rgba(255, 220, 50, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx, ry, rw, rh);
    }

    panTo = (e) => {
        const { viewer } = this.props;
        const canvas = this.canvasRef.current;
        const item = viewer.world.getItemAt(0);
        if (!canvas || !item) return;

        const rect = canvas.getBoundingClientRect();
        const imgBounds = item.getBounds();

        const vpX = imgBounds.x + ((e.clientX - rect.left) / canvas.width) * imgBounds.width;
        const vpY = imgBounds.y + ((e.clientY - rect.top) / canvas.height) * imgBounds.height;

        viewer.viewport.panTo(new OpenSeadragon.Point(vpX, vpY), false);
    }

    handleMouseDown = (e) => { this.isDragging = true; this.panTo(e); }
    handleMouseMove = (e) => { if (this.isDragging) this.panTo(e); }
    handleMouseUp = () => { this.isDragging = false; }

    computeSize = () => {
        const { viewer, imageRatio, layout } = this.props;
        const container = viewer?.container;
        const cw = container?.clientWidth || 800;
        const ch = container?.clientHeight || 600;

        const fit = (w, h, maxW, maxH) => {
            if (h > maxH) { h = Math.round(maxH); w = Math.round(h / imageRatio); }
            if (w > maxW) { w = Math.round(maxW); h = Math.round(w * imageRatio); }
            return { width: w, height: h };
        };

        if (layout === 'bottom-center') {
            const w = Math.round(cw * 0.5);
            return fit(w, Math.round(w * imageRatio), cw * 0.5, ch * 0.4);
        }
        if (layout === 'right-vertical') {
            const h = Math.round(ch * 0.8);
            return fit(Math.round(h / imageRatio), h, cw * 0.2, ch * 0.8);
        }
        const w = Math.round(cw * 0.25);
        return fit(w, Math.round(w * imageRatio), cw * 0.25, ch * 0.3);
    }

    render() {
        const { layout } = this.props;
        const { width, height } = this.computeSize();

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

