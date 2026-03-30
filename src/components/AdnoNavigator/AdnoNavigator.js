import { Component, createRef } from "react";
import "./AdnoNavigator.css";

class AdnoNavigator extends Component {
    constructor(props) {
        super(props);
        this.canvasRef = createRef();
        this.isDragging = false;
        this._bgImage = null;
        this._timer = null;
        this.state = { offset: 0 };
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

    getFullAndVisible = () => {
        const { imageRatio, layout } = this.props;
        const { width, height } = this.computeSize();
        const { offset } = this.state;

        let fullW = width, fullH = height;
        if (layout === 'right-vertical') {
            fullH = Math.round(width * imageRatio);
        } else if (layout === 'bottom-center') {
            fullW = Math.round(height / imageRatio);
        }

        const needsScroll = layout === 'right-vertical'
            ? fullH > height
            : layout === 'bottom-center'
                ? fullW > width
                : false;

        let sx = 0, sy = 0;
        if (layout === 'right-vertical') {
            sy = offset;
        } else if (layout === 'bottom-center') {
            sx = offset;
        }

        return { fullW, fullH, visW: width, visH: height, sx, sy, needsScroll };
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
            const { fullW, fullH, sx, sy } = this.getFullAndVisible();
            ctx.drawImage(this._bgImage, -sx, -sy, fullW, fullH);
        }

        this.drawViewportRect(ctx, item, W, H);
    }

    drawViewportRect = (ctx, item, W, H) => {
        const { viewer } = this.props;
        const imgBounds = item.getBounds();
        const viewBounds = viewer.viewport.getBounds(true);
        const { fullW, fullH, sx, sy } = this.getFullAndVisible();

        const toCanvas = (x, y) => ({
            x: ((x - imgBounds.x) / imgBounds.width) * fullW - sx,
            y: ((y - imgBounds.y) / imgBounds.height) * fullH - sy,
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
        const { fullW, fullH, sx, sy } = this.getFullAndVisible();

        const vpX = imgBounds.x + ((e.clientX - rect.left + sx) / fullW) * imgBounds.width;
        const vpY = imgBounds.y + ((e.clientY - rect.top + sy) / fullH) * imgBounds.height;

        viewer.viewport.panTo(new OpenSeadragon.Point(vpX, vpY), false);
    }

    handleMouseDown = (e) => { this.isDragging = true; this.panTo(e); }
    handleMouseMove = (e) => { if (this.isDragging) this.panTo(e); }
    handleMouseUp = () => { this.isDragging = false; }

    scroll = (direction) => {
        const { layout, imageRatio } = this.props;
        const { width, height } = this.computeSize();

        let fullSize, visSize;
        if (layout === 'right-vertical') {
            fullSize = Math.round(width * imageRatio);
            visSize = height;
        } else {
            fullSize = Math.round(height / imageRatio);
            visSize = width;
        }

        const step = Math.round(visSize * 0.5);
        const maxOffset = Math.max(0, fullSize - visSize);

        this.setState(prev => ({
            offset: Math.max(0, Math.min(maxOffset, prev.offset + direction * step))
        }), () => this.draw());
    }

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

        const maxW = cw * 0.5;
        const maxH = ch * 0.5;

        if (layout === 'bottom-center') {
            const w = Math.round(maxW);
            return fit(w, Math.round(w * imageRatio), maxW, maxH);
        }
        if (layout === 'right-vertical') {
            const h = Math.round(maxH);
            return fit(Math.round(h / imageRatio), h, maxW, maxH);
        }
        const w = Math.round(cw * 0.25);
        return fit(w, Math.round(w * imageRatio), maxW, maxH);
    }

    render() {
        const { layout } = this.props;
        const { width, height } = this.computeSize();
        const { needsScroll } = this.getFullAndVisible();
        const isVertical = layout === 'right-vertical';

        return (
            <div className={`adno-navigator-wrap adno-navigator-wrap--${layout} ${isVertical ? 'adno-navigator-wrap--col' : 'adno-navigator-wrap--row'}`}>
                {needsScroll && (
                    <button className="adno-navigator-arrow" onClick={() => this.scroll(-1)}>
                        {isVertical ? '▲' : '◀'}
                    </button>
                )}
                <canvas
                    ref={this.canvasRef}
                    width={width}
                    height={height}
                    className="adno-navigator"
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                    onMouseLeave={this.handleMouseUp}
                />
                {needsScroll && (
                    <button className="adno-navigator-arrow" onClick={() => this.scroll(1)}>
                        {isVertical ? '▼' : '▶'}
                    </button>
                )}
            </div>
        );
    }
}

export default AdnoNavigator;
