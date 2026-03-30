import { Component, createRef } from "react";
import "./AdnoNavigator.css";

const SMALL = 120;
const ARROW_V = 24; // height of top/bottom arrows
const ARROW_H = 20; // width of left/right arrows

class AdnoNavigator extends Component {
    constructor(props) {
        super(props);
        this.canvasRef = createRef();
        this.wrapRef = createRef();
        this._bgImage = null;
        this._timer = null;
        this._rafId = null;
        this._scrollDir = null;
        this.isDragging = false;
        this.state = { scrollTop: 0, scrollLeft: 0 };
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
        cancelAnimationFrame(this._rafId);
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

    // imageRatio = h/w, so aspectRatio (w/h) = 1/imageRatio
    computeDimensions = () => {
        const { imageRatio } = this.props;
        const MAX_W = SMALL * 3; // fixed pixel max, never scales with viewer
        const MAX_H = SMALL * 3;
        const aspectRatio = 1 / imageRatio; // w/h

        // navImgW/navImgH = how big the full image is drawn
        // navW/navH = visible navigator box (capped)
        let navImgW, navImgH;
        if (aspectRatio >= 1) {
            // wider than tall: fix height to SMALL, grow width
            navImgH = SMALL;
            navImgW = Math.round(SMALL * aspectRatio);
        } else {
            // taller than wide: fix width to SMALL, grow height
            navImgW = SMALL;
            navImgH = Math.round(SMALL / aspectRatio);
        }

        const navW = Math.min(navImgW, MAX_W);
        const navH = Math.min(navImgH, MAX_H);
        const showV = navImgH > navH;
        const showH = navImgW > navW;

        return { navW, navH, navImgW, navImgH, showV, showH };
    }

    maxScrollTop = (navImgH, navH, showH) => Math.max(0, navImgH - navH - (showH ? ARROW_H * 2 : 0));
    maxScrollLeft = (navImgW, navW, showV) => Math.max(0, navImgW - navW - (showV ? ARROW_V * 2 : 0));

    draw = () => {
        const { viewer } = this.props;
        const { scrollTop, scrollLeft } = this.state;
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const { navW, navH, navImgW, navImgH } = this.computeDimensions();
        canvas.width = navW;
        canvas.height = navH;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, navW, navH);
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, navW, navH);

        if (this._bgImage?.complete && this._bgImage.naturalWidth) {
            ctx.drawImage(this._bgImage, -scrollLeft, -scrollTop, navImgW, navImgH);
        }

        const item = viewer.world.getItemAt(0);
        if (!item) return;

        const imgBounds = item.getBounds();
        const viewBounds = viewer.viewport.getBounds(true);

        const toCanvas = (x, y) => ({
            x: ((x - imgBounds.x) / imgBounds.width) * navImgW - scrollLeft,
            y: ((y - imgBounds.y) / imgBounds.height) * navImgH - scrollTop,
        });

        const tl = toCanvas(viewBounds.x, viewBounds.y);
        const br = toCanvas(viewBounds.x + viewBounds.width, viewBounds.y + viewBounds.height);

        const rx = Math.max(0, tl.x);
        const ry = Math.max(0, tl.y);
        const rw = Math.min(navW, br.x) - rx;
        const rh = Math.min(navH, br.y) - ry;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, navW, ry);
        ctx.fillRect(0, ry + rh, navW, navH - ry - rh);
        ctx.fillRect(0, ry, rx, rh);
        ctx.fillRect(rx + rw, ry, navW - rx - rw, rh);

        ctx.strokeStyle = 'rgba(255,220,50,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx, ry, rw, rh);

        // Auto-scroll to keep rect visible (15–85% margin)
        const margin = 0.15;
        let newScrollTop = scrollTop;
        let newScrollLeft = scrollLeft;
        const { showV, showH } = this.computeDimensions();
        if (navImgH > navH) {
            const centerY = (tl.y + br.y) / 2;
            if (centerY < navH * margin) newScrollTop = Math.max(0, scrollTop - (navH * margin - centerY));
            else if (centerY > navH * (1 - margin)) newScrollTop = Math.min(this.maxScrollTop(navImgH, navH, showH), scrollTop + (centerY - navH * (1 - margin)));
        }
        if (navImgW > navW) {
            const centerX = (tl.x + br.x) / 2;
            if (centerX < navW * margin) newScrollLeft = Math.max(0, scrollLeft - (navW * margin - centerX));
            else if (centerX > navW * (1 - margin)) newScrollLeft = Math.min(this.maxScrollLeft(navImgW, navW, showV), scrollLeft + (centerX - navW * (1 - margin)));
        }
        if (newScrollTop !== scrollTop || newScrollLeft !== scrollLeft) {
            this.setState({ scrollTop: newScrollTop, scrollLeft: newScrollLeft }, () => this.draw());
        }
    }

    panTo = (e) => {
        const { viewer } = this.props;
        const { scrollTop, scrollLeft } = this.state;
        const canvas = this.canvasRef.current;
        const item = viewer.world.getItemAt(0);
        if (!canvas || !item) return;

        const rect = canvas.getBoundingClientRect();
        const { navImgW, navImgH } = this.computeDimensions();
        const imgBounds = item.getBounds();

        const px = (e.clientX - rect.left + scrollLeft) / navImgW;
        const py = (e.clientY - rect.top + scrollTop) / navImgH;

        viewer.viewport.panTo(new OpenSeadragon.Point(
            imgBounds.x + px * imgBounds.width,
            imgBounds.y + py * imgBounds.height
        ), false);
    }

    handleMouseDown = (e) => { this.isDragging = true; this.panTo(e); }
    handleMouseMove = (e) => { if (this.isDragging) this.panTo(e); }
    handleMouseUp = () => { this.isDragging = false; }

    startScroll = (dir) => {
        // dir: { top: -1|0|1, left: -1|0|1 }
        this._scrollDir = dir;
        const step = () => {
            if (!this._scrollDir) return;
            const { navImgW, navImgH, navW, navH, showV, showH } = this.computeDimensions();
            this.setState(prev => ({
                scrollTop: Math.max(0, Math.min(this.maxScrollTop(navImgH, navH, showH), prev.scrollTop + (this._scrollDir.top || 0) * 2)),
                scrollLeft: Math.max(0, Math.min(this.maxScrollLeft(navImgW, navW, showV), prev.scrollLeft + (this._scrollDir.left || 0) * 2)),
            }), () => this.draw());
            this._rafId = requestAnimationFrame(step);
        };
        this._rafId = requestAnimationFrame(step);
    }

    stopScroll = () => {
        this._scrollDir = null;
        cancelAnimationFrame(this._rafId);
    }

    render() {
        const { navW, navH, showV, showH } = this.computeDimensions();

        return (
            <div className="adno-navigator-wrap" ref={this.wrapRef}>
                {showV && (
                    <button className="adno-navigator-arrow adno-navigator-arrow--top"
                        onMouseDown={() => this.startScroll({ top: -1, left: 0 })}
                        onMouseUp={this.stopScroll}
                        onMouseLeave={this.stopScroll}
                        onTouchStart={() => this.startScroll({ top: -1, left: 0 })}
                        onTouchEnd={this.stopScroll}
                    >▲</button>
                )}
                <div className="adno-navigator-row">
                    {showH && (
                        <button className="adno-navigator-arrow adno-navigator-arrow--left"
                            onMouseDown={() => this.startScroll({ top: 0, left: -1 })}
                            onMouseUp={this.stopScroll}
                            onMouseLeave={this.stopScroll}
                            onTouchStart={() => this.startScroll({ top: 0, left: -1 })}
                            onTouchEnd={this.stopScroll}
                        >◀</button>
                    )}
                    <canvas
                        ref={this.canvasRef}
                        width={navW}
                        height={navH}
                        className="adno-navigator"
                        onMouseDown={this.handleMouseDown}
                        onMouseMove={this.handleMouseMove}
                        onMouseUp={this.handleMouseUp}
                        onMouseLeave={this.handleMouseUp}
                    />
                    {showH && (
                        <button className="adno-navigator-arrow adno-navigator-arrow--right"
                            onMouseDown={() => this.startScroll({ top: 0, left: 1 })}
                            onMouseUp={this.stopScroll}
                            onMouseLeave={this.stopScroll}
                            onTouchStart={() => this.startScroll({ top: 0, left: 1 })}
                            onTouchEnd={this.stopScroll}
                        >▶</button>
                    )}
                </div>
                {showV && (
                    <button className="adno-navigator-arrow adno-navigator-arrow--bottom"
                        onMouseDown={() => this.startScroll({ top: 1, left: 0 })}
                        onMouseUp={this.stopScroll}
                        onMouseLeave={this.stopScroll}
                        onTouchStart={() => this.startScroll({ top: 1, left: 0 })}
                        onTouchEnd={this.stopScroll}
                    >▼</button>
                )}
            </div>
        );
    }
}

export default AdnoNavigator;
