import { Component, createRef } from "react";
import "./AdnoNavigator.css";

const SMALL   = 120;
const SPEED   = 2;
const ARROW_V = 24;
const ARROW_H = 20;

class AdnoNavigator extends Component {
    constructor(props) {
        super(props);
        this.imgRef    = createRef();
        this.canvasRef = createRef();
        this.scrollRef = createRef();
        this._rafScroll = null;
        this.isDragging = false;
        this.scrollTop  = 0;
        this.scrollLeft = 0;
        this.navW    = 0;
        this.navH    = 0;
        this.navImgW = 0;
        this.navImgH = 0;
        this.state = { showV: false, showH: false };
    }

    componentDidMount() {
        const { viewer } = this.props;
        this.setup();
        viewer.addHandler('animation', this.drawRect);
        viewer.addHandler('zoom',      this.drawRect);
        viewer.addHandler('pan',       this.drawRect);
        viewer.addHandler('resize',    this.setup);
        window.addEventListener('mouseup',    this.onWindowMouseUp);
        window.addEventListener('touchend',   this.onWindowMouseUp);
        window.addEventListener('mousemove',  this.onWindowMouseMove);
    }

    componentWillUnmount() {
        const { viewer } = this.props;
        viewer.removeHandler('animation', this.drawRect);
        viewer.removeHandler('zoom',      this.drawRect);
        viewer.removeHandler('pan',       this.drawRect);
        viewer.removeHandler('resize',    this.setup);
        window.removeEventListener('mouseup',   this.onWindowMouseUp);
        window.removeEventListener('touchend',  this.onWindowMouseUp);
        window.removeEventListener('mousemove', this.onWindowMouseMove);
        cancelAnimationFrame(this._rafScroll);
    }

    computeNavDimensions = () => {
        const { viewer } = this.props;
        const item = viewer.world.getItemAt(0);
        if (!item) return null;
        const size  = item.getContentSize();
        const imgW  = size.x;
        const imgH  = size.y;
        const container = viewer.container;
        const cw    = container.clientWidth;
        const ch    = container.clientHeight;
        const maxW  = Math.floor(cw * 2 / 3);
        const maxH  = Math.floor(ch * 2 / 3);
        const ratio = imgW / imgH;

        let w, h;
        if (imgW <= imgH) {
            w = SMALL;
            h = Math.min(Math.round(w / ratio), maxH);
        } else {
            h = SMALL;
            w = Math.min(Math.round(h * ratio), maxW);
        }
        return { w, h, imgW, imgH };
    }

    setup = () => {
        const { imgUrl } = this.props;
        const dims = this.computeNavDimensions();
        if (!dims) return;
        const { w, h, imgW, imgH } = dims;
        this.navW = w;
        this.navH = h;

        const scale = Math.max(w / imgW, h / imgH);
        this.navImgW = Math.round(imgW * scale);
        this.navImgH = Math.round(imgH * scale);

        const showV = this.navImgH > this.navH;
        const showH = this.navImgW > this.navW;

        this.scrollTop  = 0;
        this.scrollLeft = 0;

        if (this.imgRef.current && imgUrl) {
            const src = imgUrl.replace(/\/full\/[^/]+\//, `/full/${this.navImgW},/`);
            this.imgRef.current.src          = src;
            this.imgRef.current.style.width  = this.navImgW + 'px';
            this.imgRef.current.style.height = this.navImgH + 'px';
        }

        if (this.canvasRef.current) {
            const dpr = window.devicePixelRatio || 1;
            this.canvasRef.current.width        = this.navImgW * dpr;
            this.canvasRef.current.height       = this.navImgH * dpr;
            this.canvasRef.current.style.width  = this.navImgW + 'px';
            this.canvasRef.current.style.height = this.navImgH + 'px';
        }

        this.setState({ showV, showH }, () => {
            this.applyScroll();
            this.drawRect();
        });
    }

    maxScrollTop = () => {
        const usedV = this.state.showV ? ARROW_V * 2 : 0;
        return Math.max(0, this.navImgH - (this.navH - usedV));
    }

    maxScrollLeft = () => {
        const usedH = this.state.showH ? ARROW_H * 2 : 0;
        return Math.max(0, this.navImgW - (this.navW - usedH));
    }

    applyScroll = () => {
        this.scrollTop  = Math.max(0, Math.min(this.scrollTop,  this.maxScrollTop()));
        this.scrollLeft = Math.max(0, Math.min(this.scrollLeft, this.maxScrollLeft()));
        if (this.imgRef.current) {
            this.imgRef.current.style.top  = -this.scrollTop  + 'px';
            this.imgRef.current.style.left = -this.scrollLeft + 'px';
        }
        if (this.canvasRef.current) {
            this.canvasRef.current.style.top  = -this.scrollTop  + 'px';
            this.canvasRef.current.style.left = -this.scrollLeft + 'px';
        }
    }

    drawRect = () => {
        const { viewer } = this.props;
        const canvas = this.canvasRef.current;
        if (!canvas || !viewer?.viewport) return;

        const dpr = window.devicePixelRatio || 1;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const b  = viewer.viewport.getBounds(true);
        const rx = b.x      * this.navImgW * dpr;
        const ry = b.y      * this.navImgW * dpr;
        const rw = b.width  * this.navImgW * dpr;
        const rh = b.height * this.navImgW * dpr;

        ctx.fillStyle   = 'rgba(255,160,0,0.15)';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = 'rgba(255,160,0,0.9)';
        ctx.lineWidth   = 2 * dpr;
        ctx.strokeRect(rx, ry, rw, rh);

        if (!this._rafScroll) {
            const { showV, showH } = this.state;
            const usedV = showV ? ARROW_V : 0;
            const usedH = showH ? ARROW_H : 0;
            const visW  = this.navW - usedH * 2;
            const visH  = this.navH - usedV * 2;
            const cy = ry / dpr + rh / dpr / 2;
            const cx = rx / dpr + rw / dpr / 2;

            if (cy < this.scrollTop + visH * 0.15 || cy > this.scrollTop + visH * 0.85) {
                this.scrollTop = cy - visH / 2;
            }
            if (cx < this.scrollLeft + visW * 0.15 || cx > this.scrollLeft + visW * 0.85) {
                this.scrollLeft = cx - visW / 2;
            }
            this.applyScroll();
        }
    }

    startScroll = (e, dt, dl) => {
        e.stopPropagation();
        e.preventDefault();
        if (this._rafScroll) return;
        const loop = () => {
            this.scrollTop  += dt * SPEED;
            this.scrollLeft += dl * SPEED;
            this.applyScroll();
            this._rafScroll = requestAnimationFrame(loop);
        };
        this._rafScroll = requestAnimationFrame(loop);
    }

    stopScroll = () => {
        if (this._rafScroll) {
            cancelAnimationFrame(this._rafScroll);
            this._rafScroll = null;
        }
    }

    navPosToPan = (clientX, clientY) => {
        const { viewer } = this.props;
        const el = this.scrollRef.current;
        if (!el || !viewer?.viewport) return;
        const rect = el.getBoundingClientRect();
        const px = (clientX - rect.left  + this.scrollLeft) / this.navImgW;
        const py = (clientY - rect.top   + this.scrollTop)  / this.navImgW;
        viewer.viewport.panTo(new OpenSeadragon.Point(px, py), false);
    }

    onScrollMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
        this.props.viewer?.setMouseNavEnabled(false);
        this.navPosToPan(e.clientX, e.clientY);
    }

    onScrollTouchStart = (e) => {
        e.stopPropagation();
        this.isDragging = true;
        this.props.viewer?.setMouseNavEnabled(false);
        this.navPosToPan(e.touches[0].clientX, e.touches[0].clientY);
    }

    onWindowMouseMove = (e) => {
        if (this.isDragging) this.navPosToPan(e.clientX, e.clientY);
    }

    onWindowMouseUp = () => {
        this.stopScroll();
        if (this.isDragging) {
            this.isDragging = false;
            this.props.viewer?.setMouseNavEnabled(true);
        }
    }

    render() {
        const { showV, showH } = this.state;

        return (
            <div className="adno-navigator-wrap">
                {showV && (
                    <button className="adno-navigator-arrow adno-navigator-arrow--top"
                        onMouseDown={(e) => this.startScroll(e, -1, 0)}
                        onTouchStart={(e) => this.startScroll(e, -1, 0)}
                    >▲</button>
                )}
                <div className="adno-navigator-row">
                    {showH && (
                        <button className="adno-navigator-arrow adno-navigator-arrow--left"
                            onMouseDown={(e) => this.startScroll(e, 0, -1)}
                            onTouchStart={(e) => this.startScroll(e, 0, -1)}
                        >◀</button>
                    )}
                    <div className="adno-navigator-scroll"
                        ref={this.scrollRef}
                        style={{ width: this.navW, height: this.navH }}
                        onMouseDown={this.onScrollMouseDown}
                        onTouchStart={this.onScrollTouchStart}
                    >
                        <img
                            ref={this.imgRef}
                            className="adno-navigator-img"
                            alt=""
                            draggable={false}
                        />
                        <canvas ref={this.canvasRef} className="adno-navigator-canvas" />
                    </div>
                    {showH && (
                        <button className="adno-navigator-arrow adno-navigator-arrow--right"
                            onMouseDown={(e) => this.startScroll(e, 0, 1)}
                            onTouchStart={(e) => this.startScroll(e, 0, 1)}
                        >▶</button>
                    )}
                </div>
                {showV && (
                    <button className="adno-navigator-arrow adno-navigator-arrow--bottom"
                        onMouseDown={(e) => this.startScroll(e, 1, 0)}
                        onTouchStart={(e) => this.startScroll(e, 1, 0)}
                    >▼</button>
                )}
            </div>
        );
    }
}

export default AdnoNavigator;
